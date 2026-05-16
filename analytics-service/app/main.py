import json
import logging
import os
import platform
import re
import subprocess
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Annotated, Any, Optional
from urllib.parse import ParseResult, parse_qsl, quote, urlencode, urlparse
from urllib.request import Request, urlopen

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import jwt
from jwt import PyJWTError
from pymongo import MongoClient

from . import order_analytics

# Connectivity note (why only analytics breaks when Java services work):
# Spring uses the MongoDB Java driver + JVM DNS for mongodb+srv. This service uses PyMongo,
# which resolves SRV via dnspython — a different resolver path. Campus/VPN/firewall issues
# often break one stack but not the other. Fix: Atlas "standard connection string" (mongodb://
# with host:port list) in ANALYTICS_MONGODB_URI or ANALYTICS_MONGODB_URI_FALLBACK, or
# ANALYTICS_MONGODB_DNS_USE_TCP=1 for SRV over TCP on system DNS.
# If UDP DNS is blocked, startup tries SRV via DNS-over-HTTPS first, then OS DNS (PowerShell/dig),
# then the original URI (set ANALYTICS_MONGODB_SRV_DOH_DISABLE=1 to skip DoH).
# Live charts use ``ORDER_MONGODB_URI`` (``order_db.orders``) when that connection succeeds.


def _load_env_file() -> None:
    """Load every `.env` on the path from repo root down to `app/` (later files override).

    A single `.env` nearest to this file used to win and **stop** the walk, so if
    `analytics-service/.env` existed without Atlas vars, the platform `.env` was never
    loaded and MongoDB defaulted to localhost → 503 on all analytics routes.
    """
    app_dir = Path(__file__).resolve().parent
    chain: list[Path] = []
    d = app_dir
    for _ in range(10):
        candidate = d / ".env"
        if candidate.is_file():
            chain.append(candidate)
        parent = d.parent
        if parent == d:
            break
        d = parent
    for path in reversed(chain):
        load_dotenv(path, override=True)


_load_env_file()

MONGODB_URI = os.getenv(
    "ANALYTICS_MONGODB_URI",
    os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/analytics_db"),
).strip()
MONGODB_URI_FALLBACK = os.getenv("ANALYTICS_MONGODB_URI_FALLBACK", "").strip()
ORDER_MONGODB_URI = os.getenv("ORDER_MONGODB_URI", "").strip()
JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "ecommerce-jwt-secret-key-for-development-min-256-bits-long-for-hs256-algorithm-safety",
)
ALGORITHM = "HS256"

_log = logging.getLogger(__name__)

# Created in lifespan so import does not run SRV DNS (mongodb+srv) — a DNS failure would crash Uvicorn otherwise.
client: Optional[MongoClient] = None
db: Optional[Any] = None  # pymongo Database (analytics_db)
orders_client: Optional[MongoClient] = None
orders_coll: Optional[Any] = None  # order_db.orders


def _mongo_server_selection_timeout_ms() -> int:
    return int(os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "20000"))


def _env_truthy(name: str) -> bool:
    v = os.getenv(name, "").strip().lower()
    return v in ("1", "true", "yes", "on")


def _mongo_connect_attempts() -> int:
    return max(1, int(os.getenv("ANALYTICS_MONGODB_CONNECT_ATTEMPTS", "3")))


def _mongo_connect_delay_sec() -> float:
    return max(0.0, float(os.getenv("ANALYTICS_MONGODB_CONNECT_DELAY_SEC", "2.0")))


def _safe_uri_for_log(uri: str) -> str:
    """Host / scheme only — never log credentials."""
    try:
        p = urlparse(uri)
        if p.scheme in ("mongodb", "mongodb+srv"):
            host = p.netloc.split("@")[-1] if p.netloc else ""
            return f"{p.scheme}://…@{host}{p.path or ''}"
    except Exception:
        pass
    return "(invalid uri)"


def _compose_direct_mongodb_uri(p: ParseResult, hosts: list[tuple[str, int]], txt_kv: dict[str, str]) -> str:
    """Build ``mongodb://user:pass@h1:p1,h2:p2/db?q`` from SRV targets + TXT options + original SRV URI auth/path."""
    if not hosts:
        return ""
    hostpart = ",".join(f"{h}:{port}" for h, port in hosts)
    merged = dict(parse_qsl(p.query, keep_blank_values=True))
    merged.update(txt_kv)
    merged.setdefault("tls", "true")
    new_query = urlencode(merged)
    user = p.username or ""
    password = p.password or ""
    if user:
        ui = f"{quote(user, safe='')}:{quote(password, safe='')}" if password else quote(user, safe="")
        netloc = f"{ui}@{hostpart}"
    else:
        netloc = hostpart
    path = p.path if p.path else "/"
    return f"mongodb://{netloc}{path}?{new_query}"


def _doh_query_json(name: str, rrtype: str, timeout: float = 12.0) -> Optional[dict]:
    """DNS JSON over HTTPS (no local UDP/53). Cloudflare then Google public DNS."""
    q = urlencode({"name": name, "type": rrtype})
    for base in ("https://cloudflare-dns.com/dns-query", "https://dns.google/resolve"):
        try:
            url = f"{base}?{q}"
            req = Request(url, headers={"accept": "application/dns-json", "User-Agent": "ecommerce-analytics/1.0"})
            with urlopen(req, timeout=timeout) as resp:
                out = json.loads(resp.read().decode())
            if int(out.get("Status", -1)) != 0:
                continue
            return out
        except Exception as exc:
            _log.debug("DoH %s %s via %s: %s", rrtype, name, base, exc)
    return None


def _dns_answer_is_type(ans: dict, code: int) -> bool:
    t = ans.get("type")
    if t == code:
        return True
    if isinstance(t, str):
        if t.isdigit() and int(t) == code:
            return True
        if code == 33 and t.upper() == "SRV":
            return True
        if code == 16 and t.upper() == "TXT":
            return True
    return False


def _parse_srv_rdata(data: Any) -> Optional[tuple[str, int]]:
    """Return (hostname, port) from SRV RDATA string or structured dict."""
    if isinstance(data, dict):
        t = str(data.get("target", "")).rstrip(".")
        try:
            pr = int(data.get("port", 27017))
        except (TypeError, ValueError):
            pr = 27017
        return (t, pr) if t else None
    parts = str(data).split()
    if len(parts) < 4:
        return None
    try:
        port = int(parts[2])
    except ValueError:
        return None
    target = parts[3].rstrip(".")
    return (target, port) if target else None


def _build_direct_mongodb_uri_from_srv_via_doh(srv_uri: str) -> Optional[str]:
    """Resolve ``mongodb+srv`` SRV/TXT via HTTPS, build ``mongodb://host:port,...`` (no dnspython SRV)."""
    p = urlparse(srv_uri)
    if p.scheme != "mongodb+srv" or not p.hostname:
        return None
    srv_name = f"_mongodb._tcp.{p.hostname}"
    srv_pack = _doh_query_json(srv_name, "SRV")
    if not srv_pack:
        return None
    host_tuples: list[tuple[str, int]] = []
    for a in srv_pack.get("Answer", []):
        if not _dns_answer_is_type(a, 33):
            continue
        parsed = _parse_srv_rdata(a.get("data"))
        if parsed:
            host_tuples.append(parsed)
    if not host_tuples:
        return None

    txt_params: dict[str, str] = {}
    txt_pack = _doh_query_json(srv_name, "TXT")
    if txt_pack:
        for a in txt_pack.get("Answer", []):
            if not _dns_answer_is_type(a, 16):
                continue
            raw = a.get("data")
            if raw is None:
                continue
            if isinstance(raw, list):
                for chunk in raw:
                    s = str(chunk).strip().strip('"')
                    txt_params.update(dict(parse_qsl(s, keep_blank_values=True)))
                continue
            s = str(raw).strip()
            if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
                s = s[1:-1]
            txt_params.update(dict(parse_qsl(s, keep_blank_values=True)))

    out = _compose_direct_mongodb_uri(p, host_tuples, txt_params)
    return out or None


def _resolve_srv_via_powershell(srv_qname: str) -> Optional[tuple[list[tuple[str, int]], dict[str, str]]]:
    """Windows: SRV + TXT using Resolve-DnsName (OS resolver, same family as JVM)."""
    ps = rf"""
$name = '{srv_qname}'
$srvRecs = @()
foreach ($r in Resolve-DnsName -Name $name -Type SRV -DnsOnly -ErrorAction SilentlyContinue) {{
  if ($r.NameTarget -and ($null -ne $r.Port)) {{
    $srvRecs += @{{ h = $r.NameTarget.TrimEnd('.'); p = [int]$r.Port }}
  }}
}}
$txtLines = @()
foreach ($r in Resolve-DnsName -Name $name -Type TXT -DnsOnly -ErrorAction SilentlyContinue) {{
  if ($null -ne $r.Strings -and $r.Strings.Count -gt 0) {{
    foreach ($s in $r.Strings) {{ $txtLines += [string]$s }}
  }}
}}
@{{ srv = $srvRecs; txt = $txtLines }} | ConvertTo-Json -Compress -Depth 6
"""
    kwargs: dict[str, Any] = {}
    if hasattr(subprocess, "CREATE_NO_WINDOW"):
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
            capture_output=True,
            text=True,
            timeout=25,
            **kwargs,
        )
    except Exception as exc:
        _log.warning("PowerShell SRV lookup failed: %s", exc)
        return None
    try:
        raw_out = (proc.stdout or "").strip().lstrip("\ufeff")
        data = json.loads(raw_out or "{}")
    except json.JSONDecodeError:
        _log.debug("PowerShell SRV JSON decode failed stdout=%r stderr=%r", proc.stdout[:300], proc.stderr[:300])
        return None
    hosts: list[tuple[str, int]] = []
    for item in data.get("srv") or []:
        if isinstance(item, dict) and item.get("h"):
            try:
                hosts.append((str(item["h"]), int(item.get("p", 27017))))
            except (TypeError, ValueError):
                continue
    txt_kv: dict[str, str] = {}
    for line in data.get("txt") or []:
        s = str(line).strip().strip('"')
        if s:
            txt_kv.update(dict(parse_qsl(s, keep_blank_values=True)))
    return (hosts, txt_kv) if hosts else None


def _resolve_srv_via_dig(srv_qname: str) -> Optional[tuple[list[tuple[str, int]], dict[str, str]]]:
    """Unix/macOS: SRV + TXT via dig(1) if installed."""
    try:
        srv_out = subprocess.run(
            ["dig", "+short", "SRV", srv_qname],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except FileNotFoundError:
        return None
    hosts: list[tuple[str, int]] = []
    for line in (srv_out.stdout or "").splitlines():
        parts = line.split()
        if len(parts) >= 4 and parts[0].isdigit():
            try:
                hosts.append((parts[3].rstrip("."), int(parts[2])))
            except ValueError:
                continue
    if not hosts:
        return None
    txt_kv: dict[str, str] = {}
    try:
        txt_out = subprocess.run(
            ["dig", "+short", "TXT", srv_qname],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except FileNotFoundError:
        txt_out = None
    if txt_out and txt_out.stdout:
        for line in txt_out.stdout.splitlines():
            s = line.strip().strip('"')
            if s:
                txt_kv.update(dict(parse_qsl(s, keep_blank_values=True)))
    return hosts, txt_kv


def _resolve_srv_via_os(srv_qname: str) -> Optional[tuple[list[tuple[str, int]], dict[str, str]]]:
    """SRV + TXT using OS tools (not dnspython)."""
    if not re.match(r"^[A-Za-z0-9._-]+$", srv_qname):
        return None
    if platform.system() == "Windows":
        return _resolve_srv_via_powershell(srv_qname)
    return _resolve_srv_via_dig(srv_qname)


def _reset_dns_resolver_to_system() -> None:
    """Clear dnspython overrides before switching URI (e.g. SRV → standard mongodb://)."""
    try:
        import dns.resolver

        dns.resolver.default_resolver = dns.resolver.Resolver()
    except Exception:
        pass


def _configure_mongodb_dns_resolver(uri: str) -> None:
    """dnspython settings for ``mongodb+srv`` SRV lookups (Python driver; differs from JVM).

    - Default: no override (system DNS, UDP).
    - ``ANALYTICS_MONGODB_DNS_USE_TCP=1``: system resolver + **TCP** (helps flaky UDP/53).
    - ``ANALYTICS_MONGODB_DNS_SERVERS``: comma-separated resolver IPs (optional with TCP).
    - ``ANALYTICS_MONGODB_INHERIT_MONGODB_DNS_SERVERS=1``: also use ``MONGODB_DNS_SERVERS`` from the platform ``.env`` (same list as other services). Leave unset if public DNS (8.8.8.8) is blocked on your network.
    """
    if not uri.startswith("mongodb+srv://"):
        return
    use_tcp = _env_truthy("ANALYTICS_MONGODB_DNS_USE_TCP")
    raw = os.getenv("ANALYTICS_MONGODB_DNS_SERVERS", "").strip()
    if not raw and _env_truthy("ANALYTICS_MONGODB_INHERIT_MONGODB_DNS_SERVERS"):
        raw = os.getenv("MONGODB_DNS_SERVERS", "").strip()
    if not use_tcp and not raw:
        return
    try:
        import dns.resolver

        if raw:
            res = dns.resolver.Resolver(configure=False)
            res.nameservers = [x.strip() for x in raw.split(",") if x.strip()]
        else:
            res = dns.resolver.Resolver()
        res.use_tcp = bool(use_tcp or raw)
        dns.resolver.default_resolver = res
        _log.info(
            "SRV DNS resolver: nameservers=%s use_tcp=%s",
            getattr(res, "nameservers", None),
            res.use_tcp,
        )
    except Exception as exc:
        _log.warning("Analytics DNS resolver setup ignored (%s).", exc)


def _try_connect_mongodb(uri: str) -> tuple[bool, Optional[str]]:
    """Single attempt: new client + ping. Returns (ok, error_message)."""
    global client, db
    c: Optional[MongoClient] = None
    try:
        _configure_mongodb_dns_resolver(uri)
        c = MongoClient(uri, serverSelectionTimeoutMS=_mongo_server_selection_timeout_ms())
        d = c.get_default_database()
        c.admin.command("ping")
        client = c
        db = d
        c = None
        return True, None
    except Exception as exc:
        err = str(exc)
        if c is not None:
            try:
                c.close()
            except Exception:
                pass
        client = None
        db = None
        return False, err


def _connect_orders_db() -> None:
    """Optional second client: ``ORDER_MONGODB_URI`` → ``order_db.orders`` for live aggregates."""
    global orders_client, orders_coll
    orders_client = None
    orders_coll = None
    uri = ORDER_MONGODB_URI.strip()
    if not uri:
        return
    c: Optional[MongoClient] = None
    try:
        _configure_mongodb_dns_resolver(uri)
        c = MongoClient(uri, serverSelectionTimeoutMS=_mongo_server_selection_timeout_ms())
        c.admin.command("ping")
        odb = c.get_default_database()
        orders_client = c
        orders_coll = odb["orders"]
        c = None
        _log.info("ORDER_MONGODB_URI connected; live admin charts use order_db.orders.")
    except Exception as exc:
        _log.warning("ORDER_MONGODB_URI failed (order-based analytics disabled): %s", exc)
        if c is not None:
            try:
                c.close()
            except Exception:
                pass
        orders_client = None
        orders_coll = None


def _orders_live() -> bool:
    return orders_coll is not None


def _chart_sales_trend(series: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for row in series:
        iso = row.get("date") or ""
        if isinstance(iso, str) and len(iso) >= 10:
            label = iso[5:10]
        else:
            label = str(row.get("period") or "—")[:12]
        out.append(
            {
                "label": label,
                "revenue": float(row.get("revenue") or 0),
                "orders": int(row.get("orders") or 0),
            }
        )
    return out


def _chart_pie_from_counts(counts: dict[str, int]) -> list[dict[str, Any]]:
    return [{"name": k, "value": int(v)} for k, v in sorted(counts.items(), key=lambda kv: -kv[1])]


def _chart_user_activity(act: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for x in act:
        d = x.get("date") or ""
        label = d[5:10] if isinstance(d, str) and len(d) >= 10 else "—"
        rows.append(
            {
                "label": label,
                "users": int(x.get("activeUsers") or 0),
                "signups": int(x.get("newSignups") or 0),
            }
        )
    return rows


def _chart_top_products_bar(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "label": (p.get("name") or p.get("productId") or "?")[:24],
            "revenue": float(p.get("revenue") or 0),
            "unitsSold": int(p.get("unitsSold") or 0),
        }
        for p in products[:12]
    ]


def _jwt_key(secret: str) -> bytes:
    b = secret.encode("utf-8")
    if len(b) >= 32:
        return b
    return b.ljust(32, b"\0")[:32]


def decode_token(authorization: Optional[str]) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing token")
    token = authorization[7:].strip()
    try:
        return jwt.decode(token, _jwt_key(JWT_SECRET), algorithms=[ALGORITHM])
    except PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")


def admin_claims(authorization: Optional[str]) -> dict[str, Any]:
    claims = decode_token(authorization)
    if claims.get("role") != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin only")
    return claims


def require_mongo(request: Request) -> None:
    if not getattr(request.app.state, "backend_ready", False):
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Analytics backend is not reachable. Open GET /health/db. "
            "Set ANALYTICS_MONGODB_URI and/or ORDER_MONGODB_URI (same cluster as in platform .env). "
            "If SRV/DNS fails for PyMongo, use Atlas standard mongodb://… in ANALYTICS_MONGODB_URI_FALLBACK "
            "or ANALYTICS_MONGODB_DNS_USE_TCP=1.",
        )


MongoReady = Annotated[None, Depends(require_mongo)]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db, orders_client, orders_coll
    app.state.db_unavailable = True
    app.state.backend_ready = False
    app.state.orders_live = False
    app.state.analytics_db_ready = False
    app.state.mongodb_last_error = None
    app.state.mongodb_uri_logged = _safe_uri_for_log(MONGODB_URI)
    app.state.mongodb_via = "none"
    client = None
    db = None
    orders_client = None
    orders_coll = None
    try:
        attempts = _mongo_connect_attempts()
        delay = _mongo_connect_delay_sec()
        last_err: Optional[str] = None
        ok = False
        uri_chain: list[tuple[str, str]] = [("ANALYTICS_MONGODB_URI", MONGODB_URI)]
        if MONGODB_URI_FALLBACK:
            uri_chain.append(("ANALYTICS_MONGODB_URI_FALLBACK", MONGODB_URI_FALLBACK))

        # mongodb+srv: avoid PyMongo SRV first. Try DoH before OS DNS — UDP/53 to resolvers is often blocked
        # while HTTPS to Cloudflare/Google still works; the reverse also happens, so both paths exist.
        if MONGODB_URI.startswith("mongodb+srv://") and not _env_truthy("ANALYTICS_MONGODB_SRV_DIRECT_DISABLE"):
            p_srv = urlparse(MONGODB_URI)
            if p_srv.hostname:
                srv_q = f"_mongodb._tcp.{p_srv.hostname}"

                if not _env_truthy("ANALYTICS_MONGODB_SRV_DOH_DISABLE"):
                    direct = _build_direct_mongodb_uri_from_srv_via_doh(MONGODB_URI)
                    if direct:
                        _reset_dns_resolver_to_system()
                        app.state.mongodb_uri_logged = _safe_uri_for_log(direct)
                        _log.info("Trying MongoDB via SRV resolved over HTTPS (direct mongodb://)")
                        for i in range(attempts):
                            ok, last_err = _try_connect_mongodb(direct)
                            if ok:
                                app.state.mongodb_via = "ANALYTICS_MONGODB_URI+SRV_over_DNS_over_HTTPS"
                                _log.info(
                                    "MongoDB connected via DoH-resolved URI (%s) attempt %s/%s",
                                    app.state.mongodb_uri_logged,
                                    i + 1,
                                    attempts,
                                )
                                break
                            _log.warning(
                                "MongoDB DoH-resolved attempt %s/%s failed: %s",
                                i + 1,
                                attempts,
                                last_err,
                            )
                            if i + 1 < attempts and delay > 0:
                                time.sleep(delay)
                    elif not ok:
                        _log.info("SRV over DNS-over-HTTPS did not yield hosts; will try OS DNS.")

                if not ok:
                    os_res = _resolve_srv_via_os(srv_q)
                    if os_res:
                        host_tuples, txt_kv = os_res
                        direct_os = _compose_direct_mongodb_uri(p_srv, host_tuples, txt_kv)
                        if direct_os:
                            _reset_dns_resolver_to_system()
                            app.state.mongodb_uri_logged = _safe_uri_for_log(direct_os)
                            _log.info("Trying MongoDB via OS-resolved SRV → direct mongodb://")
                            for i in range(attempts):
                                ok, last_err = _try_connect_mongodb(direct_os)
                                if ok:
                                    app.state.mongodb_via = "ANALYTICS_MONGODB_URI+SRV_via_OS_DNS"
                                    _log.info(
                                        "MongoDB connected via OS DNS (%s) attempt %s/%s",
                                        app.state.mongodb_uri_logged,
                                        i + 1,
                                        attempts,
                                    )
                                    break
                                _log.warning(
                                    "MongoDB OS-resolved attempt %s/%s failed: %s",
                                    i + 1,
                                    attempts,
                                    last_err,
                                )
                                if i + 1 < attempts and delay > 0:
                                    time.sleep(delay)
                    else:
                        _log.info("OS SRV lookup returned no hosts; trying original URIs.")

        for label, uri in uri_chain:
            if ok:
                break
            if label != uri_chain[0][0]:
                _reset_dns_resolver_to_system()
                _log.info("Trying %s (%s)", label, _safe_uri_for_log(uri))
            app.state.mongodb_uri_logged = _safe_uri_for_log(uri)
            for i in range(attempts):
                ok, last_err = _try_connect_mongodb(uri)
                if ok:
                    app.state.mongodb_via = label
                    _log.info(
                        "MongoDB connected via %s (%s) attempt %s/%s",
                        label,
                        app.state.mongodb_uri_logged,
                        i + 1,
                        attempts,
                    )
                    break
                _log.warning(
                    "MongoDB %s attempt %s/%s failed: %s | uri=%s",
                    label,
                    i + 1,
                    attempts,
                    last_err,
                    app.state.mongodb_uri_logged,
                )
                if i + 1 < attempts and delay > 0:
                    time.sleep(delay)
            if ok:
                break

        _connect_orders_db()

        if not ok and orders_coll is None:
            app.state.mongodb_last_error = last_err
            _log.warning(
                "Neither ANALYTICS_MONGODB_URI nor ORDER_MONGODB_URI connected. GET /health/db. "
                "If DoH is blocked, set ANALYTICS_MONGODB_URI_FALLBACK to Atlas standard mongodb:// "
                "or ANALYTICS_MONGODB_DNS_USE_TCP=1. Atlas → Network Access must allow this host. "
                "(Tried %s URI chain entries × %s attempts.)",
                len(uri_chain),
                attempts,
            )
            yield
            return

        app.state.orders_live = orders_coll is not None
        app.state.analytics_db_ready = bool(ok)
        app.state.backend_ready = bool(ok or orders_coll is not None)
        app.state.db_unavailable = not app.state.backend_ready
        app.state.mongodb_last_error = None if app.state.backend_ready else last_err

        if ok and db is not None and db["sales_daily"].estimated_document_count() == 0:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            days = []
            for i in range(30):
                d = today - timedelta(days=29 - i)
                days.append({"date": d, "revenue": 1200 + i * 37, "orders": 15 + (i % 7)})
            db["sales_daily"].insert_many(days)
        if ok and db is not None and db["top_products"].estimated_document_count() == 0:
            db["top_products"].insert_many(
                [
                    {"productId": "seed-prod-1", "name": "Wireless Headphones", "unitsSold": 120, "revenue": 15588.0},
                    {"productId": "seed-prod-2", "name": "Running Shoes", "unitsSold": 95, "revenue": 8502.5},
                    {"productId": "seed-prod-4", "name": "USB-C Hub", "unitsSold": 210, "revenue": 9657.9},
                ]
            )
        if ok and db is not None and db["order_status_counts"].estimated_document_count() == 0:
            db["order_status_counts"].insert_one(
                {
                    "PLACED": 12,
                    "CONFIRMED": 45,
                    "PACKED": 20,
                    "SHIPPED": 33,
                    "DELIVERED": 180,
                    "CANCELLED": 8,
                }
            )
        if ok and db is not None and db["user_activity"].estimated_document_count() == 0:
            db["user_activity"].insert_many(
                [
                    {"date": datetime.utcnow() - timedelta(days=1), "activeUsers": 42, "newSignups": 3},
                    {"date": datetime.utcnow() - timedelta(days=2), "activeUsers": 38, "newSignups": 5},
                ]
            )
        yield
    finally:
        if client is not None:
            client.close()
        if orders_client is not None:
            orders_client.close()
        client = None
        db = None
        orders_client = None
        orders_coll = None


app = FastAPI(title="Analytics Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/health/db")
def health_db(request: Request):
    """Whether MongoDB is reachable (no auth). Use when analytics routes return 503."""
    ready = getattr(request.app.state, "backend_ready", False)
    out: dict[str, Any] = {
        "mongodb": "up" if ready else "down",
        "analyticsDb": getattr(request.app.state, "analytics_db_ready", False),
        "orderDbLive": getattr(request.app.state, "orders_live", False),
        "uri": getattr(request.app.state, "mongodb_uri_logged", None),
    }
    via = getattr(request.app.state, "mongodb_via", None)
    if via and via != "none":
        out["envVar"] = via
    err = getattr(request.app.state, "mongodb_last_error", None)
    if not ready and err:
        out["lastError"] = err[:2000]
    return out


@app.get("/swagger", include_in_schema=False)
def swagger_redirect():
    return RedirectResponse(url="/docs", status_code=307)


@app.get("/analytics/summary")
def summary(
    _mongo: MongoReady,
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    admin_claims(authorization)
    if _orders_live():
        body = order_analytics.summary_from_orders(orders_coll)  # type: ignore[arg-type]
        src = "order_db"
        counts = order_analytics.aggregate_order_status_counts(orders_coll)  # type: ignore[arg-type]
    else:
        assert db is not None
        daily = list(db["sales_daily"].find().sort("date", -1).limit(90))
        total_revenue = sum(d.get("revenue", 0) for d in daily)
        total_orders = sum(d.get("orders", 0) for d in daily)
        status_doc = db["order_status_counts"].find_one() or {}
        cancelled = int(status_doc.get("CANCELLED", 0))
        body = {
            "totalRevenue": total_revenue,
            "totalOrders": total_orders,
            "cancelledOrders": cancelled,
            "generatedAt": datetime.utcnow().isoformat() + "Z",
        }
        src = "analytics_db"
        counts = {k: int(v) for k, v in (status_doc or {}).items() if k != "_id" and isinstance(v, (int, float))}
    body["source"] = src
    body["charts"] = {
        "kpis": body.copy(),
        "orderStatusPie": _chart_pie_from_counts(counts),
    }
    return body


@app.get("/analytics/sales")
def sales(
    _mongo: MongoReady,
    period: str = "daily",
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    admin_claims(authorization)
    if period not in ("daily", "weekly", "monthly"):
        raise HTTPException(400, "period must be daily, weekly, or monthly")
    if _orders_live():
        series = order_analytics.sales_series_by_period(orders_coll, period)  # type: ignore[arg-type]
        src = "order_db"
    else:
        assert db is not None
        daily = list(db["sales_daily"].find().sort("date", 1))
        if period == "daily":
            series = [{"date": d["date"].isoformat(), "revenue": d["revenue"], "orders": d["orders"]} for d in daily]
        elif period == "weekly":
            buckets: dict[str, dict[str, float]] = {}
            for d in daily:
                wk = d["date"].isocalendar()[1]
                key = f"{d['date'].year}-W{wk:02d}"
                buckets.setdefault(key, {"revenue": 0.0, "orders": 0})
                buckets[key]["revenue"] += float(d["revenue"])
                buckets[key]["orders"] += int(d["orders"])
            series = [{"period": k, **v} for k, v in sorted(buckets.items())]
        else:
            buckets = {}
            for d in daily:
                key = d["date"].strftime("%Y-%m")
                buckets.setdefault(key, {"revenue": 0.0, "orders": 0})
                buckets[key]["revenue"] += float(d["revenue"])
                buckets[key]["orders"] += int(d["orders"])
            series = [{"period": k, **v} for k, v in sorted(buckets.items())]
        src = "analytics_db"
    return {
        "source": src,
        "period": period,
        "series": series,
        "charts": {"revenueTrend": _chart_sales_trend(series)},
    }


@app.get("/analytics/top-products")
def top_products(
    _mongo: MongoReady,
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    admin_claims(authorization)
    if _orders_live():
        rows = order_analytics.aggregate_top_products(orders_coll, limit=20)  # type: ignore[arg-type]
        src = "order_db"
    else:
        assert db is not None
        rows = []
        for x in db["top_products"].find().sort("revenue", -1).limit(20):
            x = dict(x)
            x["_id"] = str(x["_id"])
            rows.append(x)
        src = "analytics_db"
    return {"source": src, "series": rows, "charts": {"topProductsBar": _chart_top_products_bar(rows)}}


@app.get("/analytics/orders-status")
def orders_status(
    _mongo: MongoReady,
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    admin_claims(authorization)
    if _orders_live():
        counts = order_analytics.aggregate_order_status_counts(orders_coll)  # type: ignore[arg-type]
        src = "order_db"
    else:
        assert db is not None
        doc = db["order_status_counts"].find_one() or {}
        doc = dict(doc)
        doc.pop("_id", None)
        counts = {k: int(v) for k, v in doc.items() if isinstance(v, (int, float))}
        src = "analytics_db"
    return {
        "source": src,
        "counts": counts,
        "charts": {"orderStatusPie": _chart_pie_from_counts(counts)},
    }


@app.get("/analytics/user-activity")
def user_activity(
    _mongo: MongoReady,
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    admin_claims(authorization)
    if _orders_live():
        series = order_analytics.aggregate_user_activity(orders_coll)  # type: ignore[arg-type]
        src = "order_db"
    else:
        assert db is not None
        cur = db["user_activity"].find().sort("date", -1).limit(30)
        series = [
            {"date": x["date"].isoformat(), "activeUsers": x["activeUsers"], "newSignups": x["newSignups"]}
            for x in cur
        ]
        src = "analytics_db"
    return {"source": src, "series": series, "charts": {"userActivityLines": _chart_user_activity(series)}}

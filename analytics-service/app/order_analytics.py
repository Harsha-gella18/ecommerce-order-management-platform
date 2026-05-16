"""Live admin analytics from the order-service ``orders`` collection (``order_db``)."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from bson.decimal128 import Decimal128
from pymongo.collection import Collection


def _to_float(x: Any) -> float:
    if x is None:
        return 0.0
    if isinstance(x, Decimal128):
        return float(x.to_decimal())
    if isinstance(x, (int, float)):
        return float(x)
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def _as_double(field_path: str) -> dict[str, Any]:
    """Aggregation expression: coerce BSON/string numbers to double (Atlas / Mongo 4.0+)."""
    return {
        "$convert": {
            "input": field_path,
            "to": "double",
            "onError": 0.0,
            "onNull": 0.0,
        }
    }


def aggregate_daily_sales(coll: Collection, days: int = 90) -> list[dict[str, Any]]:
    """Rows aligned with legacy ``sales_daily``: ``date`` (datetime UTC midnight), ``revenue``, ``orders``."""
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"createdAt": {"$gte": since}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt", "timezone": "UTC"},
                },
                "revenue": {"$sum": _as_double("$totalAmount")},
                "orders": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    rows: list[dict[str, Any]] = []
    for r in coll.aggregate(pipeline, allowDiskUse=True):
        day = r.get("_id")
        if not day:
            continue
        try:
            dt = datetime.strptime(str(day), "%Y-%m-%d")
        except ValueError:
            continue
        rows.append(
            {
                "date": dt,
                "revenue": _to_float(r.get("revenue")),
                "orders": int(r.get("orders") or 0),
            }
        )
    return rows


def sales_series_by_period(coll: Collection, period: str, days: int = 120) -> list[dict[str, Any]]:
    daily = aggregate_daily_sales(coll, days=days)
    if period == "daily":
        return [{"date": d["date"].isoformat(), "revenue": d["revenue"], "orders": d["orders"]} for d in daily]
    if period == "weekly":
        buckets: dict[str, dict[str, float]] = {}
        for d in daily:
            wk = d["date"].isocalendar()[1]
            key = f"{d['date'].year}-W{wk:02d}"
            buckets.setdefault(key, {"revenue": 0.0, "orders": 0})
            buckets[key]["revenue"] += float(d["revenue"])
            buckets[key]["orders"] += int(d["orders"])
        return [{"period": k, **v} for k, v in sorted(buckets.items())]
    buckets: dict[str, dict[str, float]] = {}
    for d in daily:
        key = d["date"].strftime("%Y-%m")
        buckets.setdefault(key, {"revenue": 0.0, "orders": 0})
        buckets[key]["revenue"] += float(d["revenue"])
        buckets[key]["orders"] += int(d["orders"])
    return [{"period": k, **v} for k, v in sorted(buckets.items())]


def aggregate_order_status_counts(coll: Collection) -> dict[str, int]:
    out: dict[str, int] = {}
    for r in coll.aggregate(
        [{"$group": {"_id": "$status", "count": {"$sum": 1}}}], allowDiskUse=True
    ):
        k = r.get("_id")
        key = "UNKNOWN" if k is None else str(k)
        out[key] = int(r.get("count") or 0)
    return out


def aggregate_top_products(coll: Collection, limit: int = 20) -> list[dict[str, Any]]:
    q = _as_double("$items.quantity")
    p = _as_double("$items.unitPrice")
    pipeline = [
        {"$unwind": {"path": "$items", "preserveNullAndEmptyArrays": False}},
        {
            "$group": {
                "_id": "$items.productId",
                "name": {"$first": {"$ifNull": ["$items.productName", "Unknown"]}},
                "unitsSold": {"$sum": q},
                "revenue": {"$sum": {"$multiply": [q, p]}},
            }
        },
        {"$sort": {"revenue": -1}},
        {"$limit": limit},
    ]
    out: list[dict[str, Any]] = []
    for i, r in enumerate(coll.aggregate(pipeline, allowDiskUse=True)):
        pid = r.get("_id")
        out.append(
            {
                "_id": f"live-tp-{i}",
                "productId": "" if pid is None else str(pid),
                "name": str(r.get("name") or ""),
                "unitsSold": int(r.get("unitsSold") or 0),
                "revenue": _to_float(r.get("revenue")),
            }
        )
    return out


def aggregate_user_activity(coll: Collection, days: int = 45) -> list[dict[str, Any]]:
    """Distinct ordering customers per UTC day (proxy for active users). ``newSignups`` is 0 without user_db."""
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"createdAt": {"$gte": since}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt", "timezone": "UTC"},
                },
                "cust": {"$addToSet": "$customerId"},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    rows: list[dict[str, Any]] = []
    for r in coll.aggregate(pipeline, allowDiskUse=True):
        day = r.get("_id")
        if not day:
            continue
        try:
            dt = datetime.strptime(str(day), "%Y-%m-%d")
        except ValueError:
            continue
        raw_ids = [x for x in (r.get("cust") or []) if x is not None and str(x).strip()]
        active = len({str(x) for x in raw_ids})
        rows.append({"date": dt, "activeUsers": active, "newSignups": 0})
    return [
        {"date": x["date"].isoformat(), "activeUsers": x["activeUsers"], "newSignups": x["newSignups"]}
        for x in rows[-30:]
    ]


def summary_from_orders(coll: Collection, days: int = 90) -> dict[str, Any]:
    daily = aggregate_daily_sales(coll, days=days)
    total_revenue = sum(d["revenue"] for d in daily)
    total_orders = sum(d["orders"] for d in daily)
    st = aggregate_order_status_counts(coll)
    cancelled = int(st.get("CANCELLED", 0) or 0)
    return {
        "totalRevenue": total_revenue,
        "totalOrders": total_orders,
        "cancelledOrders": cancelled,
        "generatedAt": datetime.utcnow().isoformat() + "Z",
    }

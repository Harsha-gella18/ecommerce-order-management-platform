package com.ecommerce.gateway.filter;

import com.ecommerce.gateway.security.JwtParser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {
    private final JwtParser jwtParser;

    public JwtAuthenticationFilter(JwtParser jwtParser) {
        this.jwtParser = jwtParser;
    }

    private static String stringClaim(Claims claims, String key) {
        Object raw = claims.get(key);
        if (raw == null) {
            return null;
        }
        String s = String.valueOf(raw).trim();
        return s.isEmpty() ? null : s;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest req = exchange.getRequest();
        String path = req.getPath().value();
        HttpMethod method = req.getMethod();
        if (method == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }
        if (isPublic(path, method)) {
            return chain.filter(exchange);
        }
        String auth = req.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        String token = auth.substring(7).trim();
        try {
            var claims = jwtParser.parse(token);
            String userId = claims.getSubject();
            String role = stringClaim(claims, "role");
            ServerHttpRequest mutated = req.mutate()
                    .header("X-User-Id", userId != null ? userId : "")
                    .header("X-User-Role", role != null ? role : "")
                    .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (JwtException | IllegalArgumentException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublic(String path, HttpMethod method) {
        if (path.startsWith("/api/auth/signup") && method == HttpMethod.POST) {
            return true;
        }
        if (path.startsWith("/api/auth/login") && method == HttpMethod.POST) {
            return true;
        }
        if (path.startsWith("/api/auth/validate") && method == HttpMethod.GET) {
            return true;
        }
        if (path.startsWith("/api/products") && method == HttpMethod.GET) {
            return true;
        }
        if (method == HttpMethod.GET && path.startsWith("/api/inventory/")) {
            String rest = path.substring("/api/inventory/".length());
            return !rest.isEmpty() && !rest.contains("/");
        }
        return false;
    }

    @Override
    public int getOrder() {
        return -100;
    }
}

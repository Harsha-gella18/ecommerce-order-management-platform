package com.ecommerce.inventory.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class InventoryAuthInterceptor implements HandlerInterceptor {
    public static final String ATTR_ROLE = "role";

    private final JwtUtil jwtUtil;

    public InventoryAuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
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
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        String m = request.getMethod();
        if ("GET".equals(m) && path.matches(".*/inventory/[^/]+$")) {
            return true;
        }
        String h = request.getHeader("Authorization");
        if (h == null || !h.startsWith("Bearer ")) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }
        try {
            var claims = jwtUtil.parse(h.substring(7).trim());
            request.setAttribute(ATTR_ROLE, stringClaim(claims, "role"));
            return true;
        } catch (JwtException e) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }
    }
}

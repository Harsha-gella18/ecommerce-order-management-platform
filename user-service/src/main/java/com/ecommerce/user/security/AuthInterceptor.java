package com.ecommerce.user.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    public static final String ATTR_USER_ID = "userId";
    public static final String ATTR_ROLE = "role";
    public static final String ATTR_EMAIL = "email";

    private final JwtUtil jwtUtil;

    public AuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    /** JJWT may store custom claims as non-String types; never use claims.get(key, String.class) for email/role. */
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
        String h = request.getHeader("Authorization");
        if (h == null || !h.startsWith("Bearer ")) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }
        try {
            var claims = jwtUtil.parse(h.substring(7).trim());
            request.setAttribute(ATTR_USER_ID, claims.getSubject());
            request.setAttribute(ATTR_ROLE, stringClaim(claims, "role"));
            request.setAttribute(ATTR_EMAIL, stringClaim(claims, "email"));
            return true;
        } catch (JwtException e) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }
    }
}

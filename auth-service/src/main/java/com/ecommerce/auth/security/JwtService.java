package com.ecommerce.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expirationMs) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(bytes.length >= 32 ? bytes : padSecret(bytes));
        this.expirationMs = expirationMs;
    }

    private static byte[] padSecret(byte[] b) {
        byte[] out = new byte[32];
        System.arraycopy(b, 0, out, 0, Math.min(b.length, 32));
        return out;
    }

    public String generateToken(String userId, String email, String role) {
        Date now = new Date();
        // Null claims can trigger failures in some JJWT versions → avoid 500 after successful login
        String safeEmail = email != null ? email : "";
        String safeRole = role != null && !role.isBlank() ? role : "CUSTOMER";
        return Jwts.builder()
                .subject(userId)
                .claim("email", safeEmail)
                .claim("role", safeRole)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

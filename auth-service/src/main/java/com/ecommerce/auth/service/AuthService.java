package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.AuthResponse;
import com.ecommerce.auth.dto.LoginRequest;
import com.ecommerce.auth.dto.SignupRequest;
import com.ecommerce.auth.dto.ValidateResponse;
import com.ecommerce.auth.integration.UserServiceClient;
import com.ecommerce.auth.model.UserAuth;
import com.ecommerce.auth.repository.UserAuthRepository;
import com.ecommerce.auth.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static String stringClaim(Claims claims, String key) {
        Object raw = claims.get(key);
        if (raw == null) {
            return null;
        }
        String s = String.valueOf(raw).trim();
        return s.isEmpty() ? null : s;
    }

    private final UserAuthRepository userAuthRepository;
    private final JwtService jwtService;
    private final UserServiceClient userServiceClient;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(
            UserAuthRepository userAuthRepository,
            JwtService jwtService,
            UserServiceClient userServiceClient) {
        this.userAuthRepository = userAuthRepository;
        this.jwtService = jwtService;
        this.userServiceClient = userServiceClient;
    }

    public AuthResponse signup(SignupRequest req) {
        if (userAuthRepository.existsByEmail(req.getEmail().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        UserAuth u = new UserAuth();
        u.setEmail(req.getEmail().toLowerCase().trim());
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        u.setRole("CUSTOMER");
        u.setStatus("ACTIVE");
        u.setAccountStatus("ACTIVE");
        u.setCreatedAt(Instant.now());
        u = userAuthRepository.save(u);
        String token = jwtService.generateToken(u.getId(), u.getEmail(), u.getRole());
        try {
            userServiceClient.provisionAfterSignup(token, req);
        } catch (RestClientException e) {
            log.warn("Post-signup profile sync failed (user-service may be down): {}", e.toString());
        } catch (Exception e) {
            log.warn("Post-signup profile sync failed: {}", e.toString());
        }
        return new AuthResponse(token, u.getId(), u.getEmail(), u.getRole());
    }

    public AuthResponse login(LoginRequest req) {
        UserAuth u = userAuthRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!"ACTIVE".equals(u.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account inactive");
        }
        if ("BLOCKED".equals(u.getAccountStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account blocked");
        }
        String hash = u.getPasswordHash();
        if (hash == null || hash.isBlank()) {
            log.warn("Login rejected: user {} has no password hash in database", u.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        try {
            if (!passwordEncoder.matches(req.getPassword(), hash)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
            }
        } catch (IllegalArgumentException e) {
            log.warn("Login rejected: invalid password hash stored for {}", u.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (u.getId() == null || u.getId().isBlank()) {
            log.error("User {} in database has no id; cannot issue token", u.getEmail());
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Account data incomplete — reseed or fix user document");
        }
        String token = jwtService.generateToken(u.getId(), u.getEmail(), u.getRole());
        try {
            userServiceClient.syncEmailToProfile(token, u.getEmail());
        } catch (RestClientException e) {
            log.warn("Post-login profile email sync failed (user-service may be down): {}", e.toString());
        } catch (Exception e) {
            log.warn("Post-login profile email sync failed: {}", e.toString());
        }
        return new AuthResponse(token, u.getId(), u.getEmail(), u.getRole());
    }

    public ValidateResponse validate(String bearer) {
        ValidateResponse r = new ValidateResponse();
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            r.setValid(false);
            return r;
        }
        String token = bearer.substring(7).trim();
        try {
            var claims = jwtService.parse(token);
            r.setValid(true);
            r.setUserId(claims.getSubject());
            r.setEmail(stringClaim(claims, "email"));
            r.setRole(stringClaim(claims, "role"));
            userAuthRepository
                    .findById(claims.getSubject())
                    .ifPresent(
                            authUser -> {
                                if ("BLOCKED".equals(authUser.getAccountStatus())) {
                                    r.setValid(false);
                                }
                            });
        } catch (Exception e) {
            r.setValid(false);
        }
        return r;
    }

    private Claims requireAdminFromBearer(String bearer) {
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token");
        }
        String token = bearer.substring(7).trim();
        try {
            Claims claims = jwtService.parse(token);
            if (!"ADMIN".equals(stringClaim(claims, "role"))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
            }
            return claims;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (JwtException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }

    public void adminSetUserAccountStatus(String bearer, String userId, String status) {
        requireAdminFromBearer(bearer);
        UserAuth u = userAuthRepository
                .findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if ("ADMIN".equals(u.getRole()) && "BLOCKED".equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot block administrator accounts");
        }
        u.setAccountStatus(status);
        userAuthRepository.save(u);
    }
}

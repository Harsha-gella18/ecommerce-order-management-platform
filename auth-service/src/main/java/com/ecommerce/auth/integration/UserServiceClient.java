package com.ecommerce.auth.integration;

import com.ecommerce.auth.dto.SignupRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

/** Calls user-service with the new user's JWT to seed profile name and phone. */
@Component
public class UserServiceClient {
    private final RestTemplate restTemplate;
    private final String baseUrl;

    public UserServiceClient(
            RestTemplate restTemplate,
            @Value("${app.user-service-url:http://127.0.0.1:8082}") String baseUrl) {
        this.restTemplate = restTemplate;
        String u = baseUrl == null ? "" : baseUrl.trim();
        this.baseUrl = u.endsWith("/") ? u.substring(0, u.length() - 1) : u;
    }

    public void provisionAfterSignup(String bearerToken, SignupRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(bearerToken);

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name", req.getName().trim());
        profile.put("phone", req.getPhone().trim());
        profile.put("email", req.getEmail().trim());
        restTemplate.exchange(
                baseUrl + "/users/me",
                HttpMethod.PUT,
                new HttpEntity<>(profile, headers),
                Void.class);
    }

    /** Writes email from auth DB into user profile (fixes older profiles missing email). */
    public void syncEmailToProfile(String bearerToken, String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(bearerToken);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email.trim());
        restTemplate.exchange(
                baseUrl + "/users/me",
                HttpMethod.PUT,
                new HttpEntity<>(body, headers),
                Void.class);
    }
}

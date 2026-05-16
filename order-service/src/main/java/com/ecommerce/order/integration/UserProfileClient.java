package com.ecommerce.order.integration;

import com.ecommerce.order.config.AppProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Component
public class UserProfileClient {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AppProperties props;

    public UserProfileClient(RestTemplate restTemplate, ObjectMapper objectMapper, AppProperties props) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.props = props;
    }

    /**
     * Loads the caller's profile and formats the address with the given id.
     */
    public String resolveShippingAddress(String authorizationHeader, String addressId) {
        if (!StringUtils.hasText(addressId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "shippingAddressId is blank");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authorizationHeader);
        String body;
        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    trimSlash(props.getUserServiceUrl()) + "/users/me",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class);
            body = res.getBody();
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "User profile service unavailable");
        }
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty profile response");
        }
        JsonNode root;
        try {
            root = objectMapper.readTree(body);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid profile response");
        }
        JsonNode list = root.path("addresses");
        if (!list.isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No saved addresses on profile");
        }
        for (JsonNode a : list) {
            if (addressId.equals(a.path("id").asText())) {
                String formatted = formatAddress(a);
                if (!StringUtils.hasText(formatted)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Saved address is incomplete");
                }
                return formatted;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown shipping address id");
    }

    private static String trimSlash(String url) {
        if (url == null) return "";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private static String formatAddress(JsonNode a) {
        List<String> parts = new ArrayList<>();
        addIfPresent(parts, text(a, "line1"));
        addIfPresent(parts, text(a, "line2"));
        addIfPresent(parts, text(a, "city"));
        addIfPresent(parts, text(a, "state"));
        addIfPresent(parts, text(a, "postalCode"));
        addIfPresent(parts, text(a, "country"));
        return String.join(", ", parts);
    }

    private static void addIfPresent(List<String> parts, String s) {
        if (StringUtils.hasText(s)) {
            parts.add(s.trim());
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode n = node.get(field);
        if (n == null || n.isNull()) {
            return null;
        }
        String s = n.asText();
        return StringUtils.hasText(s) ? s : null;
    }
}

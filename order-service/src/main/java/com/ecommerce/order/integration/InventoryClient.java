package com.ecommerce.order.integration;

import com.ecommerce.order.config.AppProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class InventoryClient {
    private final RestTemplate restTemplate;
    private final AppProperties props;

    public InventoryClient(RestTemplate restTemplate, AppProperties props) {
        this.restTemplate = restTemplate;
        this.props = props;
    }

    @SuppressWarnings("unchecked")
    public boolean check(String authHeader, List<Map<String, Object>> items) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        Map<String, Object> body = Map.of("items", items);
        ResponseEntity<Map<String, Object>> res = restTemplate.exchange(
                props.getInventoryServiceUrl() + "/inventory/check",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                new ParameterizedTypeReference<>() {}
        );
        Map<String, Object> r = res.getBody();
        return r != null && Boolean.TRUE.equals(r.get("available"));
    }

    public void reduce(String authHeader, List<Map<String, Object>> items) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        Map<String, Object> body = Map.of("items", items);
        restTemplate.exchange(
                props.getInventoryServiceUrl() + "/inventory/reduce",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Void.class
        );
    }
}

package com.ecommerce.order.integration;

import com.ecommerce.order.config.AppProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class CartClient {
    private final RestTemplate restTemplate;
    private final AppProperties props;

    public CartClient(RestTemplate restTemplate, AppProperties props) {
        this.restTemplate = restTemplate;
        this.props = props;
    }

    public Map<String, Object> getCart(String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        ResponseEntity<Map<String, Object>> res = restTemplate.exchange(
                props.getCartServiceUrl() + "/cart",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );
        return res.getBody();
    }

    public void clearCart(String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        restTemplate.exchange(
                props.getCartServiceUrl() + "/cart/clear",
                HttpMethod.DELETE,
                new HttpEntity<>(headers),
                Void.class
        );
    }
}

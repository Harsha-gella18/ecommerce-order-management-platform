package com.ecommerce.order.integration;

import com.ecommerce.order.config.AppProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class PaymentClient {
    private final RestTemplate restTemplate;
    private final AppProperties props;

    public PaymentClient(RestTemplate restTemplate, AppProperties props) {
        this.restTemplate = restTemplate;
        this.props = props;
    }

    public Map<String, Object> createPayment(String authHeader, String orderId, BigDecimal amount, String userId, boolean simulateSuccess) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        Map<String, Object> body = Map.of(
                "orderId", orderId,
                "amount", amount,
                "userId", userId,
                "simulateSuccess", simulateSuccess
        );
        ResponseEntity<Map<String, Object>> res = restTemplate.exchange(
                props.getPaymentServiceUrl() + "/payments",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                new ParameterizedTypeReference<>() {}
        );
        return res.getBody();
    }
}

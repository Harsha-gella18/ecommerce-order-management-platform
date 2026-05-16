package com.ecommerce.payment.messaging;

import java.util.Map;

public interface DomainEventPublisher {
    void publish(String routingKey, Map<String, Object> payload);
}

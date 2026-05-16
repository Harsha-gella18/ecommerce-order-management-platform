package com.ecommerce.order.messaging;

import java.util.Map;

public interface DomainEventPublisher {
    void publish(String routingKey, Map<String, Object> payload);
}

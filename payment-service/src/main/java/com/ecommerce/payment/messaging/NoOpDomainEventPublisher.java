package com.ecommerce.payment.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@ConditionalOnMissingBean(RabbitTemplate.class)
public class NoOpDomainEventPublisher implements DomainEventPublisher {
    @Override
    public void publish(String routingKey, Map<String, Object> payload) {
        // Local profile without RabbitMQ
    }
}

package com.ecommerce.order.messaging;

import com.ecommerce.order.config.RabbitConfig;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@ConditionalOnBean(RabbitTemplate.class)
public class AmqpDomainEventPublisher implements DomainEventPublisher {
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AmqpDomainEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public void publish(String routingKey, Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, routingKey, json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}

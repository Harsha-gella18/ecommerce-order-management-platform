package com.ecommerce.order.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnBean(RabbitTemplate.class)
public class RabbitConfig {
    public static final String EXCHANGE = "ecom.events";

    @Bean
    public TopicExchange ecomExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }
}

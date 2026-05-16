package com.ecommerce.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        EnvBootstrap.load();
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}

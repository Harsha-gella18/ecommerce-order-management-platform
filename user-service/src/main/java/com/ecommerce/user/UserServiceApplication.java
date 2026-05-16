package com.ecommerce.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UserServiceApplication {
    public static void main(String[] args) {
        EnvBootstrap.load();
        SpringApplication.run(UserServiceApplication.class, args);
    }
}

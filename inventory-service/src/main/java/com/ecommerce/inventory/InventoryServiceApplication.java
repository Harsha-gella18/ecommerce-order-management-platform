package com.ecommerce.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class InventoryServiceApplication {
    public static void main(String[] args) {
        EnvBootstrap.load();
        SpringApplication.run(InventoryServiceApplication.class, args);
    }
}

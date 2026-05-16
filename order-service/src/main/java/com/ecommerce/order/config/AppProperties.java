package com.ecommerce.order.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String cartServiceUrl = "http://127.0.0.1:3001";
    private String inventoryServiceUrl = "http://127.0.0.1:8084";
    private String paymentServiceUrl = "http://127.0.0.1:8086";
    private String userServiceUrl = "http://127.0.0.1:8082";

    public String getCartServiceUrl() { return cartServiceUrl; }
    public void setCartServiceUrl(String cartServiceUrl) { this.cartServiceUrl = cartServiceUrl; }
    public String getInventoryServiceUrl() { return inventoryServiceUrl; }
    public void setInventoryServiceUrl(String inventoryServiceUrl) { this.inventoryServiceUrl = inventoryServiceUrl; }
    public String getPaymentServiceUrl() { return paymentServiceUrl; }
    public void setPaymentServiceUrl(String paymentServiceUrl) { this.paymentServiceUrl = paymentServiceUrl; }
    public String getUserServiceUrl() { return userServiceUrl; }
    public void setUserServiceUrl(String userServiceUrl) { this.userServiceUrl = userServiceUrl; }
}

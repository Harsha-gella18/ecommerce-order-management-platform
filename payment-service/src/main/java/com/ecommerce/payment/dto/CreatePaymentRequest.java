package com.ecommerce.payment.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreatePaymentRequest {
    @NotBlank
    private String orderId;
    @NotNull
    private BigDecimal amount;
    @NotBlank
    private String userId;
    private Boolean simulateSuccess = Boolean.TRUE;

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Boolean getSimulateSuccess() { return simulateSuccess; }
    public void setSimulateSuccess(Boolean simulateSuccess) { this.simulateSuccess = simulateSuccess; }
}

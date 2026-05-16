package com.ecommerce.order.dto;

/**
 * Provide either {@code shippingAddressId} (saved profile address) or {@code shippingAddress} (free text).
 */
public class CreateOrderRequest {
    /** Id of an address returned from {@code GET /users/me}. */
    private String shippingAddressId;
    /** Full shipping line when not using a saved address id. */
    private String shippingAddress;
    private Boolean simulatePaymentSuccess = Boolean.TRUE;

    public String getShippingAddressId() {
        return shippingAddressId;
    }

    public void setShippingAddressId(String shippingAddressId) {
        this.shippingAddressId = shippingAddressId;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public Boolean getSimulatePaymentSuccess() {
        return simulatePaymentSuccess;
    }

    public void setSimulatePaymentSuccess(Boolean simulatePaymentSuccess) {
        this.simulatePaymentSuccess = simulatePaymentSuccess;
    }
}

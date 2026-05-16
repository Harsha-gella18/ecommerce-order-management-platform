package com.ecommerce.inventory.dto;

import javax.validation.constraints.Min;

public class RestockRequest {
    @Min(0)
    private int quantity;

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}

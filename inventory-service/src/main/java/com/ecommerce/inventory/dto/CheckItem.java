package com.ecommerce.inventory.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

public class CheckItem {
    @NotBlank
    private String productId;
    @Min(1)
    private int quantity;

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}

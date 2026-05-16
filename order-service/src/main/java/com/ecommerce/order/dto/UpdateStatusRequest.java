package com.ecommerce.order.dto;

import javax.validation.constraints.NotBlank;

public class UpdateStatusRequest {
    @NotBlank
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

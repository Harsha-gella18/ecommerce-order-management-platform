package com.ecommerce.user.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

public class AccountStatusRequest {
    @NotBlank
    @Pattern(regexp = "ACTIVE|BLOCKED")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

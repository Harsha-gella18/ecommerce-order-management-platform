package com.ecommerce.inventory.dto;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;

import java.util.List;

public class CheckRequest {
    @NotEmpty
    @Valid
    private List<CheckItem> items;

    public List<CheckItem> getItems() { return items; }
    public void setItems(List<CheckItem> items) { this.items = items; }
}

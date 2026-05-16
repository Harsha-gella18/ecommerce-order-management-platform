package com.ecommerce.product.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

public class ProductRequest {
    @NotBlank
    private String name;
    private String description;
    @NotBlank
    private String category;
    @NotNull @PositiveOrZero
    private BigDecimal price;
    private List<String> images;
    private double rating;
    private boolean active = true;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

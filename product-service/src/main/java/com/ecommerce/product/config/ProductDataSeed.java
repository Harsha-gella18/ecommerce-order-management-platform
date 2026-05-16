package com.ecommerce.product.config;

import com.ecommerce.product.model.Product;
import com.ecommerce.product.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class ProductDataSeed implements CommandLineRunner {
    private final ProductRepository repo;

    public ProductDataSeed(ProductRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        /* Prices in Indian Rupees (INR) */
        List<Product> all = List.of(
                p("seed-prod-1", "Wireless Headphones", "Noise-cancelling over-ear headphones", "Electronics", 10999,
                        4.6, "https://placehold.co/400x300?text=Headphones"),
                p("seed-prod-2", "Running Shoes", "Lightweight daily trainers", "Footwear", 7499, 4.3,
                        "https://placehold.co/400x300?text=Shoes"),
                p("seed-prod-3", "Stainless Bottle", "Insulated 32oz bottle", "Home", 1999, 4.8,
                        "https://placehold.co/400x300?text=Bottle"),
                p("seed-prod-4", "USB-C Hub", "7-in-1 hub for laptops", "Electronics", 3799, 4.2,
                        "https://placehold.co/400x300?text=Hub"),
                p("seed-prod-5", "Yoga Mat", "Non-slip exercise mat", "Sports", 2999, 4.5,
                        "https://placehold.co/400x300?text=Yoga"),
                p("seed-prod-6", "Desk Lamp LED", "Warm dimmable desk lamp for workspaces", "Home", 4299, 4.4,
                        "https://placehold.co/400x300?text=Lamp"),
                p("seed-prod-7", "Coffee Beans 1kg", "Medium roast whole bean", "Grocery", 1549, 4.7,
                        "https://placehold.co/400x300?text=Coffee"),
                p("seed-prod-8", "Travel Backpack", "Laptop compartment up to 16\"", "Travel", 6599, 4.6,
                        "https://placehold.co/400x300?text=Backpack"),
                p("seed-prod-9", "Portable Charger 20Ah", "USB-C PD fast charging", "Electronics", 3299, 4.5,
                        "https://placehold.co/400x300?text=Charger"),
                p("seed-prod-10", "Ceramic Mug Set", "Set of 4 stackable mugs", "Home", 2299, 4.3,
                        "https://placehold.co/400x300?text=Mugs"),
                p("seed-prod-11", "Bluetooth Speaker", "Water-resistant compact speaker", "Electronics", 5299, 4.55,
                        "https://placehold.co/400x300?text=Speaker"),
                p("seed-prod-12", "Organic Cotton Tee", "Unisex premium cotton t-shirt", "Apparel", 1799, 4.25,
                        "https://placehold.co/400x300?text=Tee")
        );
        all.stream().filter(p -> !repo.existsById(p.getId())).forEach(repo::save);
    }

    private Product p(String id, String name, String desc, String cat, double price, double rating, String img) {
        Product x = new Product();
        x.setId(id);
        x.setName(name);
        x.setDescription(desc);
        x.setCategory(cat);
        x.setPrice(BigDecimal.valueOf(price));
        x.setImages(List.of(img));
        x.setRating(rating);
        x.setActive(true);
        x.setCreatedAt(Instant.now());
        return x;
    }
}

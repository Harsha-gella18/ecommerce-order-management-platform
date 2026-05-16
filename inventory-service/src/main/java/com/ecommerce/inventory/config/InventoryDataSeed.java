package com.ecommerce.inventory.config;

import com.ecommerce.inventory.model.StockItem;
import com.ecommerce.inventory.repository.StockItemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds stock for catalogue product IDs (see ProductDataSeed). Skips SKUs already present.
 */
@Component
public class InventoryDataSeed implements CommandLineRunner {
    private final StockItemRepository repo;

    public InventoryDataSeed(StockItemRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        ensure("seed-prod-1", 40);
        ensure("seed-prod-2", 25);
        ensure("seed-prod-3", 100);
        ensure("seed-prod-4", 60);
        ensure("seed-prod-5", 30);
        ensure("seed-prod-6", 45);
        ensure("seed-prod-7", 200);
        ensure("seed-prod-8", 35);
        ensure("seed-prod-9", 80);
        ensure("seed-prod-10", 55);
        ensure("seed-prod-11", 42);
        ensure("seed-prod-12", 120);
    }

    private void ensure(String productId, int qty) {
        if (repo.findByProductId(productId).isPresent()) {
            return;
        }
        StockItem s = new StockItem();
        s.setProductId(productId);
        s.setQuantity(qty);
        repo.save(s);
    }
}

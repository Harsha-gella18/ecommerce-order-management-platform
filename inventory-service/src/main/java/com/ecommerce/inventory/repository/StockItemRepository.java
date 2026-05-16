package com.ecommerce.inventory.repository;

import com.ecommerce.inventory.model.StockItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface StockItemRepository extends MongoRepository<StockItem, String> {
    Optional<StockItem> findByProductId(String productId);
}

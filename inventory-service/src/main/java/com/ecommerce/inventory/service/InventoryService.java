package com.ecommerce.inventory.service;

import com.ecommerce.inventory.dto.CheckItem;
import com.ecommerce.inventory.dto.ReduceRequest;
import com.ecommerce.inventory.dto.RestockRequest;
import com.ecommerce.inventory.model.StockItem;
import com.ecommerce.inventory.repository.StockItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InventoryService {
    private final StockItemRepository repo;

    public InventoryService(StockItemRepository repo) {
        this.repo = repo;
    }

    public StockItem getByProductId(String productId) {
        return repo.findByProductId(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No stock for product"));
    }

    public Map<String, Object> checkAvailability(List<CheckItem> items) {
        boolean ok = true;
        Map<String, Integer> available = new HashMap<>();
        for (CheckItem it : items) {
            int q = repo.findByProductId(it.getProductId()).map(StockItem::getQuantity).orElse(0);
            available.put(it.getProductId(), q);
            if (q < it.getQuantity()) ok = false;
        }
        return Map.of("available", ok, "details", available);
    }

    public void reduce(ReduceRequest req) {
        for (CheckItem it : req.getItems()) {
            StockItem s = repo.findByProductId(it.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown product: " + it.getProductId()));
            if (s.getQuantity() < it.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock for " + it.getProductId());
            }
            s.setQuantity(s.getQuantity() - it.getQuantity());
            repo.save(s);
        }
    }

    public StockItem restock(String productId, RestockRequest req) {
        StockItem s = repo.findByProductId(productId).orElseGet(() -> {
            StockItem n = new StockItem();
            n.setProductId(productId);
            n.setQuantity(0);
            return n;
        });
        s.setQuantity(req.getQuantity());
        return repo.save(s);
    }
}

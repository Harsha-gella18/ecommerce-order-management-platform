package com.ecommerce.inventory.controller;

import com.ecommerce.inventory.dto.CheckRequest;
import com.ecommerce.inventory.dto.ReduceRequest;
import com.ecommerce.inventory.dto.RestockRequest;
import com.ecommerce.inventory.model.StockItem;
import com.ecommerce.inventory.security.InventoryAuthInterceptor;
import com.ecommerce.inventory.service.InventoryService;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    private void requireAdmin(HttpServletRequest req) {
        if (!"ADMIN".equals(req.getAttribute(InventoryAuthInterceptor.ATTR_ROLE))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
    }

    @GetMapping("/{productId}")
    public ResponseEntity<StockItem> get(@PathVariable String productId) {
        return ResponseEntity.ok(inventoryService.getByProductId(productId));
    }

    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> check(@Valid @RequestBody CheckRequest body) {
        return ResponseEntity.ok(inventoryService.checkAvailability(body.getItems()));
    }

    @PostMapping("/reduce")
    public ResponseEntity<Void> reduce(@Valid @RequestBody ReduceRequest body) {
        inventoryService.reduce(body);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/restock/{productId}")
    public ResponseEntity<StockItem> restock(HttpServletRequest req, @PathVariable String productId, @Valid @RequestBody RestockRequest body) {
        requireAdmin(req);
        return ResponseEntity.ok(inventoryService.restock(productId, body));
    }
}

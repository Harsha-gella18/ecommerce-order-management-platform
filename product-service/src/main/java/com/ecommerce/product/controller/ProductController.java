package com.ecommerce.product.controller;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.model.Product;
import com.ecommerce.product.security.ProductAuthInterceptor;
import com.ecommerce.product.service.ProductService;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {
    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    private void requireAdmin(HttpServletRequest req) {
        String role = (String) req.getAttribute(ProductAuthInterceptor.ATTR_ROLE);
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
    }

    /** Distinct categories for filters — use /meta/categories so it never clashes with /{id}. */
    @GetMapping("/meta/categories")
    public ResponseEntity<List<String>> categories() {
        return ResponseEntity.ok(productService.distinctCategories());
    }

    @GetMapping
    public ResponseEntity<List<Product>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(productService.list(q, category, minPrice, maxPrice, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> get(@PathVariable String id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Product> create(HttpServletRequest req, @Valid @RequestBody ProductRequest body) {
        requireAdmin(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(HttpServletRequest req, @PathVariable String id, @Valid @RequestBody ProductRequest body) {
        requireAdmin(req);
        return ResponseEntity.ok(productService.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(HttpServletRequest req, @PathVariable String id) {
        requireAdmin(req);
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

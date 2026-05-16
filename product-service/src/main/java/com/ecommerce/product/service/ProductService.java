package com.ecommerce.product.service;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.model.Product;
import com.ecommerce.product.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ProductService {
    private final ProductRepository repo;

    public ProductService(ProductRepository repo) {
        this.repo = repo;
    }

    public List<String> distinctCategories() {
        return repo.findByActiveTrue().stream()
                .map(Product::getCategory)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .collect(Collectors.toList());
    }

    public List<Product> list(String q, String category, BigDecimal minPrice, BigDecimal maxPrice, String sort) {
        Stream<Product> stream = repo.findByActiveTrue().stream();
        if (category != null && !category.isBlank()) {
            stream = stream.filter(p -> category.equalsIgnoreCase(p.getCategory()));
        }
        if (q != null && !q.isBlank()) {
            String qq = q.toLowerCase(Locale.ROOT);
            stream = stream.filter(p ->
                    (p.getName() != null && p.getName().toLowerCase(Locale.ROOT).contains(qq))
                    || (p.getDescription() != null && p.getDescription().toLowerCase(Locale.ROOT).contains(qq)));
        }
        if (minPrice != null) {
            stream = stream.filter(p -> p.getPrice() != null && p.getPrice().compareTo(minPrice) >= 0);
        }
        if (maxPrice != null) {
            stream = stream.filter(p -> p.getPrice() != null && p.getPrice().compareTo(maxPrice) <= 0);
        }
        List<Product> filtered = stream.collect(Collectors.toList());
        return sortProducts(filtered, sort);
    }

    private List<Product> sortProducts(List<Product> items, String sortKey) {
        String s = sortKey == null || sortKey.isBlank() ? "newest" : sortKey.trim().toLowerCase(Locale.ROOT);
        Comparator<Product> cmp;
        switch (s) {
            case "price_asc":
                cmp = Comparator.comparing(Product::getPrice, Comparator.nullsLast(BigDecimal::compareTo));
                break;
            case "price_desc":
                cmp = Comparator.comparing(Product::getPrice, Comparator.nullsLast(BigDecimal::compareTo)).reversed();
                break;
            case "name_asc":
                cmp = Comparator.comparing(
                        Product::getName, Comparator.nullsFirst(String.CASE_INSENSITIVE_ORDER));
                break;
            case "name_desc":
                cmp = Comparator.comparing(
                        Product::getName, Comparator.nullsFirst(String.CASE_INSENSITIVE_ORDER)).reversed();
                break;
            case "rating_desc":
                cmp = Comparator.comparingDouble(Product::getRating).reversed();
                break;
            case "newest":
            default:
                cmp = Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
                break;
        }
        return items.stream().sorted(cmp).collect(Collectors.toList());
    }

    public Product getById(String id) {
        return repo.findById(id).filter(Product::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    public Product getByIdAdmin(String id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    public Product create(ProductRequest req) {
        Product p = map(new Product(), req);
        p.setCreatedAt(Instant.now());
        return repo.save(p);
    }

    public Product update(String id, ProductRequest req) {
        Product p = getByIdAdmin(id);
        map(p, req);
        return repo.save(p);
    }

    public void delete(String id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        repo.deleteById(id);
    }

    private Product map(Product p, ProductRequest req) {
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setCategory(req.getCategory());
        p.setPrice(req.getPrice());
        if (req.getImages() != null) p.setImages(req.getImages());
        p.setRating(req.getRating());
        p.setActive(req.isActive());
        return p;
    }
}

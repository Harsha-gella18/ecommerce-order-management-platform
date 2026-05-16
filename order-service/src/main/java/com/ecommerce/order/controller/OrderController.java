package com.ecommerce.order.controller;

import com.ecommerce.order.dto.CreateOrderRequest;
import com.ecommerce.order.dto.UpdateStatusRequest;
import com.ecommerce.order.model.ShopOrder;
import com.ecommerce.order.security.OrderAuthInterceptor;
import com.ecommerce.order.service.ShopOrderService;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {
    private final ShopOrderService shopOrderService;

    public OrderController(ShopOrderService shopOrderService) {
        this.shopOrderService = shopOrderService;
    }

    private String uid(HttpServletRequest req) {
        return (String) req.getAttribute(OrderAuthInterceptor.ATTR_USER_ID);
    }

    private String auth(HttpServletRequest req) {
        return req.getHeader("Authorization");
    }

    @PostMapping
    public ResponseEntity<ShopOrder> create(HttpServletRequest req, @Valid @RequestBody CreateOrderRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shopOrderService.create(auth(req), uid(req), body));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ShopOrder>> my(HttpServletRequest req) {
        return ResponseEntity.ok(shopOrderService.myOrders(uid(req)));
    }

    @GetMapping("/admin/all")
    public List<ShopOrder> adminAll(HttpServletRequest req) {
        if (!"ADMIN".equals(req.getAttribute(OrderAuthInterceptor.ATTR_ROLE))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
        return shopOrderService.allOrdersAdmin();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShopOrder> one(HttpServletRequest req, @PathVariable String id) {
        return ResponseEntity.ok(shopOrderService.getById(req, id));
    }

    @GetMapping(value = "/{id}/invoice", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> invoice(HttpServletRequest req, @PathVariable String id) {
        ShopOrder o = shopOrderService.getById(req, id);
        String body = shopOrderService.renderInvoice(o);
        String safe = id.replaceAll("[^a-zA-Z0-9_-]", "_");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-" + safe + ".txt\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(body);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ShopOrder> status(HttpServletRequest req, @PathVariable String id, @Valid @RequestBody UpdateStatusRequest body) {
        return ResponseEntity.ok(shopOrderService.updateStatus(req, id, body));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ShopOrder> cancel(HttpServletRequest req, @PathVariable String id) {
        return ResponseEntity.ok(shopOrderService.cancel(req, id));
    }
}

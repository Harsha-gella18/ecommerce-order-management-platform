package com.ecommerce.payment.controller;

import com.ecommerce.payment.dto.CreatePaymentRequest;
import com.ecommerce.payment.model.PaymentRecord;
import com.ecommerce.payment.service.PaymentService;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<PaymentRecord>> adminAll(HttpServletRequest req) {
        return ResponseEntity.ok(paymentService.listAllAdmin(req));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(HttpServletRequest req, @Valid @RequestBody CreatePaymentRequest body) {
        return ResponseEntity.ok(paymentService.create(req, body));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<PaymentRecord> byOrder(HttpServletRequest req, @PathVariable String orderId) {
        return ResponseEntity.ok(paymentService.getByOrderId(req, orderId));
    }

    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<PaymentRecord> refund(HttpServletRequest req, @PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.refund(req, paymentId));
    }
}

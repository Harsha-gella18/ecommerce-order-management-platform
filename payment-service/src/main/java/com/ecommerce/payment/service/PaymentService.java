package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.CreatePaymentRequest;
import com.ecommerce.payment.messaging.DomainEventPublisher;
import com.ecommerce.payment.model.PaymentRecord;
import com.ecommerce.payment.repository.PaymentRepository;
import com.ecommerce.payment.security.PaymentAuthInterceptor;
import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final DomainEventPublisher eventPublisher;

    public PaymentService(PaymentRepository paymentRepository, DomainEventPublisher eventPublisher) {
        this.paymentRepository = paymentRepository;
        this.eventPublisher = eventPublisher;
    }

    public Map<String, Object> create(HttpServletRequest req, CreatePaymentRequest body) {
        String callerId = (String) req.getAttribute(PaymentAuthInterceptor.ATTR_USER_ID);
        if (!callerId.equals(body.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User mismatch");
        }
        PaymentRecord p = new PaymentRecord();
        p.setOrderId(body.getOrderId());
        p.setUserId(body.getUserId());
        p.setAmount(body.getAmount());
        p.setCreatedAt(Instant.now());

        // Mock payment only — no external gateway; always record SUCCESS for this project.
        p.setStatus("SUCCESS");
        p = paymentRepository.save(p);

        eventPublisher.publish("payment.result", Map.of(
                "paymentId", p.getId(),
                "orderId", p.getOrderId(),
                "userId", p.getUserId(),
                "status", p.getStatus(),
                "type", "PAYMENT_" + p.getStatus()));

        Map<String, Object> out = new HashMap<>();
        out.put("id", p.getId());
        out.put("orderId", p.getOrderId());
        out.put("status", p.getStatus());
        out.put("amount", p.getAmount());
        return out;
    }

    public PaymentRecord getByOrderId(HttpServletRequest req, String orderId) {
        String userId = (String) req.getAttribute(PaymentAuthInterceptor.ATTR_USER_ID);
        String role = (String) req.getAttribute(PaymentAuthInterceptor.ATTR_ROLE);
        PaymentRecord p = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (!"ADMIN".equals(role) && !userId.equals(p.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        return p;
    }

    public PaymentRecord refund(HttpServletRequest req, String paymentId) {
        if (!"ADMIN".equals(req.getAttribute(PaymentAuthInterceptor.ATTR_ROLE))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
        PaymentRecord p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (!"SUCCESS".equals(p.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only successful payments can be refunded");
        }
        p.setStatus("REFUNDED");
        p = paymentRepository.save(p);
        eventPublisher.publish("payment.refund", Map.of(
                "paymentId", p.getId(),
                "orderId", p.getOrderId(),
                "type", "PAYMENT_REFUNDED"));
        return p;
    }

    public List<PaymentRecord> listAllAdmin(HttpServletRequest req) {
        if (!"ADMIN".equals(req.getAttribute(PaymentAuthInterceptor.ATTR_ROLE))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }
}

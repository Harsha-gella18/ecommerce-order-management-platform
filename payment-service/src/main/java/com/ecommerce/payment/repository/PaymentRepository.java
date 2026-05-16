package com.ecommerce.payment.repository;

import com.ecommerce.payment.model.PaymentRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends MongoRepository<PaymentRecord, String> {
    Optional<PaymentRecord> findFirstByOrderIdOrderByCreatedAtDesc(String orderId);

    List<PaymentRecord> findAllByOrderByCreatedAtDesc();
}

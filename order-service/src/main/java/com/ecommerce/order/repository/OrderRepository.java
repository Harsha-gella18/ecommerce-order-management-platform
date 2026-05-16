package com.ecommerce.order.repository;

import com.ecommerce.order.model.ShopOrder;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface OrderRepository extends MongoRepository<ShopOrder, String> {
    List<ShopOrder> findByCustomerIdOrderByCreatedAtDesc(String customerId);
}

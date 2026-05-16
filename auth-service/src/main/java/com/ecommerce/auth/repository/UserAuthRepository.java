package com.ecommerce.auth.repository;

import com.ecommerce.auth.model.UserAuth;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserAuthRepository extends MongoRepository<UserAuth, String> {
    Optional<UserAuth> findByEmail(String email);
    boolean existsByEmail(String email);
}

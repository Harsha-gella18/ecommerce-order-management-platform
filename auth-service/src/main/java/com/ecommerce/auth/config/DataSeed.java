package com.ecommerce.auth.config;

import com.ecommerce.auth.model.UserAuth;
import com.ecommerce.auth.repository.UserAuthRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Demo accounts for local / capstone demos. Skips any email that already exists.
 * See {@code docs/demo-credentials.md} for the full reference table.
 */
@Component
public class DataSeed implements CommandLineRunner {
    private final UserAuthRepository repo;
    private final BCryptPasswordEncoder enc = new BCryptPasswordEncoder();

    public DataSeed(UserAuthRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        seed("admin@example.com", "Admin@123", "ADMIN");
        seed("ops.admin@example.com", "OpsAdmin@123", "ADMIN");
        seed("customer@example.com", "Customer@123", "CUSTOMER");
        seed("demo.shopper@example.com", "Shopper@123", "CUSTOMER");
        seed("jane.buyer@example.com", "Buyer@123", "CUSTOMER");
        seed("alex.martinez@example.com", "AlexDemo@123", "CUSTOMER");
        seed("store.demo@example.com", "StoreDemo@123", "CUSTOMER");
        seed("direct.login@example.com", "DirectLogin@123", "CUSTOMER");
        seed("simple.user@example.com", "SimpleUser@1", "CUSTOMER");
        seed("admin.direct@example.com", "AdminDirect@123", "ADMIN");
    }

    private void seed(String email, String password, String role) {
        String e = email.toLowerCase().trim();
        if (repo.findByEmail(e).isPresent()) {
            return;
        }
        UserAuth u = new UserAuth();
        u.setEmail(e);
        u.setPasswordHash(enc.encode(password));
        u.setRole(role);
        u.setStatus("ACTIVE");
        u.setAccountStatus("ACTIVE");
        u.setCreatedAt(Instant.now());
        repo.save(u);
    }
}

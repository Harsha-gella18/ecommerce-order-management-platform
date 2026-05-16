package com.ecommerce.auth.controller;

import com.ecommerce.auth.dto.AuthAccountStatusRequest;
import com.ecommerce.auth.dto.AuthResponse;
import com.ecommerce.auth.dto.LoginRequest;
import com.ecommerce.auth.dto.SignupRequest;
import com.ecommerce.auth.dto.ValidateResponse;
import com.ecommerce.auth.service.AuthService;
import javax.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest body) {
        return ResponseEntity.ok(authService.signup(body));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest body) {
        return ResponseEntity.ok(authService.login(body));
    }

    @GetMapping("/validate")
    public ResponseEntity<ValidateResponse> validate(@RequestHeader(value = "Authorization", required = false) String auth) {
        return ResponseEntity.ok(authService.validate(auth));
    }

    @PutMapping("/admin/users/{id}/account-status")
    public ResponseEntity<Void> adminUserAccountStatus(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String id,
            @Valid @RequestBody AuthAccountStatusRequest body) {
        authService.adminSetUserAccountStatus(auth, id, body.getStatus());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}

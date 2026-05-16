package com.ecommerce.user.controller;

import com.ecommerce.user.dto.AccountStatusRequest;
import com.ecommerce.user.dto.AddressRequest;
import com.ecommerce.user.dto.UpdateProfileRequest;
import com.ecommerce.user.model.UserProfile;
import com.ecommerce.user.security.AuthInterceptor;
import com.ecommerce.user.service.UserService;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    private String uid(HttpServletRequest req) {
        return (String) req.getAttribute(AuthInterceptor.ATTR_USER_ID);
    }

    private String email(HttpServletRequest req) {
        return (String) req.getAttribute(AuthInterceptor.ATTR_EMAIL);
    }

    private String role(HttpServletRequest req) {
        return (String) req.getAttribute(AuthInterceptor.ATTR_ROLE);
    }

    private void requireAdmin(HttpServletRequest req) {
        if (!"ADMIN".equals(role(req))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
    }

    @GetMapping("/admin/profiles")
    public ResponseEntity<List<UserProfile>> adminProfiles(HttpServletRequest req) {
        requireAdmin(req);
        return ResponseEntity.ok(userService.listAllForAdmin());
    }

    @PutMapping("/admin/profiles/{id}/status")
    public ResponseEntity<UserProfile> adminSetStatus(
            HttpServletRequest req, @PathVariable String id, @Valid @RequestBody AccountStatusRequest body) {
        requireAdmin(req);
        return ResponseEntity.ok(userService.setAccountStatusForAdmin(id, body.getStatus()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfile> me(HttpServletRequest req) {
        return ResponseEntity.ok(userService.getMe(uid(req), email(req), role(req)));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfile> updateMe(HttpServletRequest req, @Valid @RequestBody UpdateProfileRequest body) {
        return ResponseEntity.ok(userService.updateMe(uid(req), email(req), role(req), body));
    }

    @PostMapping("/me/addresses")
    public ResponseEntity<UserProfile> addAddress(HttpServletRequest req, @Valid @RequestBody AddressRequest body) {
        return ResponseEntity.ok(userService.addAddress(uid(req), email(req), role(req), body));
    }

    @DeleteMapping("/me/addresses/{id}")
    public ResponseEntity<UserProfile> deleteAddress(HttpServletRequest req, @PathVariable String id) {
        return ResponseEntity.ok(userService.deleteAddress(uid(req), email(req), role(req), id));
    }
}

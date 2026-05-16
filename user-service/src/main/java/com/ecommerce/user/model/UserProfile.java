package com.ecommerce.user.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "user_profiles")
public class UserProfile {
    @Id
    private String id;
    /** Synced from JWT email claim on each authenticated request. */
    private String email;
    /** Synced from JWT role claim on each authenticated request. */
    private String role;
    private String name;
    private String phone;
    /** ACTIVE or BLOCKED — surfaced to admin customer management (enforcement is app-level for this demo). */
    private String accountStatus = "ACTIVE";
    private Map<String, String> preferences = new HashMap<>();
    private List<Address> addresses = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }
    public Map<String, String> getPreferences() { return preferences; }
    public void setPreferences(Map<String, String> preferences) { this.preferences = preferences; }
    public List<Address> getAddresses() { return addresses; }
    public void setAddresses(List<Address> addresses) { this.addresses = addresses; }
}

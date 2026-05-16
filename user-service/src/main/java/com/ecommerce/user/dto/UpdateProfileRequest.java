package com.ecommerce.user.dto;

import javax.validation.constraints.Size;

import java.util.Map;

public class UpdateProfileRequest {
    @Size(max = 200)
    private String name;
    @Size(max = 30)
    private String phone;
    /** Optional: persisted on profile (e.g. auth-service sync after signup / login). */
    @Size(max = 255)
    private String email;
    private Map<String, String> preferences;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Map<String, String> getPreferences() { return preferences; }
    public void setPreferences(Map<String, String> preferences) { this.preferences = preferences; }
}

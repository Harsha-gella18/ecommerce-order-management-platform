package com.ecommerce.user.service;

import com.ecommerce.user.dto.AddressRequest;
import com.ecommerce.user.dto.UpdateProfileRequest;
import com.ecommerce.user.model.Address;
import com.ecommerce.user.model.UserProfile;
import com.ecommerce.user.repository.UserProfileRepository;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    private final UserProfileRepository repo;
    private final MongoTemplate mongoTemplate;

    public UserService(UserProfileRepository repo, MongoTemplate mongoTemplate) {
        this.repo = repo;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * If the mapped entity has no name but the raw document has one (alternate BSON keys, legacy imports),
     * copy it onto the entity and persist so API JSON includes {@code name}.
     */
    private boolean hydrateNameFromRawDocumentIfMissing(UserProfile p) {
        if (p == null || !StringUtils.hasText(p.getId()) || StringUtils.hasText(p.getName())) {
            return false;
        }
        Document d =
                mongoTemplate.findById(p.getId(), Document.class, mongoTemplate.getCollectionName(UserProfile.class));
        if (d == null) {
            return false;
        }
        String resolved = firstNonBlankStringField(d, "name", "fullName", "displayName", "userName", "username", "Name");
        if (!StringUtils.hasText(resolved)) {
            return false;
        }
        p.setName(resolved);
        return true;
    }

    private static String firstNonBlankStringField(Document d, String... keys) {
        for (String key : keys) {
            String s = asNonBlankScalarString(d.get(key));
            if (s != null) {
                return s;
            }
        }
        return null;
    }

    private static String asNonBlankScalarString(Object raw) {
        if (raw == null || raw instanceof Document) {
            return null;
        }
        String s = String.valueOf(raw).trim();
        return StringUtils.hasText(s) ? s : null;
    }

    /**
     * Loads or creates the profile for {@code userId} and keeps email and role from the JWT in sync when present.
     */
    public UserProfile getOrCreate(String userId, String emailFromJwt, String roleFromJwt) {
        UserProfile p;
        Optional<UserProfile> opt = repo.findById(userId);
        if (opt.isEmpty()) {
            p = new UserProfile();
            p.setId(userId);
            if (StringUtils.hasText(emailFromJwt)) {
                p.setEmail(emailFromJwt.trim());
            }
            if (StringUtils.hasText(roleFromJwt)) {
                p.setRole(roleFromJwt.trim());
            }
            p = repo.save(p);
        } else {
            p = opt.get();
            boolean dirty = false;
            if (StringUtils.hasText(emailFromJwt)) {
                String e = emailFromJwt.trim();
                if (!e.equals(p.getEmail())) {
                    p.setEmail(e);
                    dirty = true;
                }
            }
            if (StringUtils.hasText(roleFromJwt)) {
                String r = roleFromJwt.trim();
                if (!r.equals(p.getRole())) {
                    p.setRole(r);
                    dirty = true;
                }
            }
            if (dirty) {
                p = repo.save(p);
            }
        }
        if (hydrateNameFromRawDocumentIfMissing(p)) {
            p = repo.save(p);
        }
        return p;
    }

    public UserProfile getMe(String userId, String emailFromJwt, String roleFromJwt) {
        return getOrCreate(userId, emailFromJwt, roleFromJwt);
    }

    public UserProfile updateMe(String userId, String emailFromJwt, String roleFromJwt, UpdateProfileRequest req) {
        UserProfile p = getOrCreate(userId, emailFromJwt, roleFromJwt);
        if (req.getName() != null) {
            p.setName(req.getName());
        }
        if (req.getPhone() != null) {
            p.setPhone(req.getPhone());
        }
        if (StringUtils.hasText(req.getEmail())) {
            p.setEmail(req.getEmail().trim());
        }
        if (req.getPreferences() != null) {
            p.setPreferences(req.getPreferences());
        }
        return repo.save(p);
    }

    public UserProfile addAddress(String userId, String emailFromJwt, String roleFromJwt, AddressRequest req) {
        UserProfile p = getOrCreate(userId, emailFromJwt, roleFromJwt);
        Address a = new Address();
        a.setId(UUID.randomUUID().toString());
        a.setLine1(req.getLine1());
        a.setLine2(req.getLine2());
        a.setCity(req.getCity());
        a.setState(req.getState());
        a.setPostalCode(req.getPostalCode());
        a.setCountry(req.getCountry());
        a.setDefaultAddress(req.isDefaultAddress());
        if (req.isDefaultAddress()) {
            p.getAddresses().forEach(x -> x.setDefaultAddress(false));
        }
        p.getAddresses().add(a);
        return repo.save(p);
    }

    public UserProfile deleteAddress(String userId, String emailFromJwt, String roleFromJwt, String addressId) {
        UserProfile p = getOrCreate(userId, emailFromJwt, roleFromJwt);
        boolean removed = p.getAddresses().removeIf(a -> addressId.equals(a.getId()));
        if (!removed) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found");
        }
        return repo.save(p);
    }

    public List<UserProfile> listAllForAdmin() {
        return repo.findAll();
    }

    public UserProfile setAccountStatusForAdmin(String profileUserId, String status) {
        UserProfile p = repo.findById(profileUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        p.setAccountStatus(status);
        return repo.save(p);
    }
}

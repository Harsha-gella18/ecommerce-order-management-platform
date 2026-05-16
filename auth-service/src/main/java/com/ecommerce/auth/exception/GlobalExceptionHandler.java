package com.ecommerce.auth.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.mongodb.MongoException;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleRse(ResponseStatusException ex) {
        Map<String, String> m = new HashMap<>();
        m.put("error", ex.getReason() != null ? ex.getReason() : ex.getStatus().toString());
        return ResponseEntity.status(ex.getStatus()).body(m);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        FieldError fe = ex.getBindingResult().getFieldError();
        String msg = fe != null ? fe.getDefaultMessage() : "Validation failed";
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDb(DataAccessException ex) {
        log.error("Database error", ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Database unavailable — check MongoDB and AUTH_MONGODB_URI in .env"));
    }

    /** Raw driver errors sometimes bypass {@link DataAccessException} mapping — avoid opaque 500s on login. */
    @ExceptionHandler(MongoException.class)
    public ResponseEntity<Map<String, String>> handleMongoDriver(MongoException ex) {
        log.error("Mongo driver error", ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Database unavailable — check AUTH_MONGODB_URI, Atlas network access, and credentials"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleOther(Exception ex) {
        log.error("Unhandled error", ex);
        Map<String, String> body = new HashMap<>();
        body.put("error", ex.getMessage() != null ? ex.getMessage() : "Internal error — see auth-service logs");
        body.put("type", ex.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

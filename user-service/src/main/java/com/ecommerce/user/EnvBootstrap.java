package com.ecommerce.user;

import io.github.cdimascio.dotenv.Dotenv;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public final class EnvBootstrap {
    private EnvBootstrap() {}

    public static void load() {
        Path envFile = findEnvFile();
        if (envFile == null || !Files.isRegularFile(envFile)) {
            return;
        }
        Dotenv dotenv = Dotenv.configure()
                .directory(envFile.getParent().toString())
                .filename(envFile.getFileName().toString())
                .ignoreIfMissing()
                .load();
        dotenv.entries().forEach(e -> {
            String key = e.getKey();
            if (System.getenv(key) == null && System.getProperty(key) == null) {
                System.setProperty(key, e.getValue());
            }
        });
    }

    private static Path findEnvFile() {
        Path dir = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
        for (int depth = 0; depth < 8 && dir != null; depth++) {
            Path candidate = dir.resolve(".env");
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
            Path parent = dir.getParent();
            if (parent == null || parent.equals(dir)) {
                break;
            }
            dir = parent;
        }
        return null;
    }
}

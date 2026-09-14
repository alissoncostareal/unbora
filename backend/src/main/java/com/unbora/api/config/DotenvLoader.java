package com.unbora.api.config;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class DotenvLoader {

    public static void load() {
        Map<String, String> envMap = new HashMap<>();

        File[] possibleFiles = new File[]{
                new File(".env"),
                new File("../.env"),
                new File(System.getProperty("user.dir"), ".env"),
                new File(System.getProperty("user.dir"), "../.env")
        };

        for (File file : possibleFiles) {
            if (file.exists() && file.isFile()) {
                loadFromFile(file, envMap);
                break;
            }
        }

        // Set properties into System properties
        setPropIfPresent(envMap, "GROQ_API_KEY", "unbora.groq.api-key");
        setPropIfPresent(envMap, "GROQ_MODEL", "unbora.groq.model");
        setPropIfPresent(envMap, "BRAVE_API_KEY", "unbora.brave.api-key");

        String placesKey = envMap.get("GOOGLE_PLACES_API_KEY");
        if (placesKey == null) placesKey = envMap.get("GOOGLE_MAPS_API_KEY");
        if (placesKey != null && !placesKey.isBlank()) {
            System.setProperty("unbora.google.places-api-key", placesKey);
        }

        String googleClientIds = envMap.get("GOOGLE_CLIENT_IDS");
        if (googleClientIds == null || googleClientIds.isBlank()) googleClientIds = envMap.get("GOOGLE_CLIENT_ID");
        if (googleClientIds == null || googleClientIds.isBlank()) googleClientIds = envMap.get("EXPO_PUBLIC_GOOGLE_CLIENT_ID");
        if (googleClientIds != null && !googleClientIds.isBlank()) {
            System.setProperty("unbora.oauth.google.client-ids", googleClientIds);
        }

        setPropIfPresent(envMap, "SUPERADMIN_EMAIL", "unbora.superadmin.email");
        setPropIfPresent(envMap, "SUPERADMIN_PASSWORD", "unbora.superadmin.password");
        setPropIfPresent(envMap, "SUPERADMIN_NAME", "unbora.superadmin.name");

        String jwtSecret = envMap.get("ADMIN_JWT_SECRET");
        if (jwtSecret == null) jwtSecret = envMap.get("JWT_SECRET");
        if (jwtSecret != null && !jwtSecret.isBlank()) {
            System.setProperty("unbora.jwt.secret", jwtSecret);
        }

        setPropIfPresent(envMap, "ALLOWED_ORIGIN", "unbora.cors.allowed-origin");
        setPropIfPresent(envMap, "PORT", "server.port");

        // Process DATABASE_URL
        String databaseUrl = envMap.get("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            databaseUrl = System.getenv("DATABASE_URL");
        }

        if (databaseUrl != null && !databaseUrl.isBlank()) {
            try {
                if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
                    URI uri = new URI(databaseUrl.replace("postgresql://", "http://").replace("postgres://", "http://"));
                    String userInfo = uri.getUserInfo();
                    String username = null;
                    String password = null;
                    if (userInfo != null) {
                        String[] parts = userInfo.split(":", 2);
                        username = parts[0];
                        if (parts.length > 1) {
                            password = parts[1];
                        }
                    }

                    int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                    String path = uri.getPath();
                    if (path != null && path.startsWith("/")) {
                        path = path.substring(1);
                    }
                    String query = uri.getQuery();

                    String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + "/" + path + (query != null ? "?" + query : "");

                    System.setProperty("spring.datasource.url", jdbcUrl);
                    if (username != null) System.setProperty("spring.datasource.username", username);
                    if (password != null) System.setProperty("spring.datasource.password", password);
                } else if (databaseUrl.startsWith("jdbc:postgresql://")) {
                    System.setProperty("spring.datasource.url", databaseUrl);
                }
            } catch (Exception e) {
                System.err.println("Could not parse DATABASE_URL: " + e.getMessage());
            }
        }
    }

    private static void setPropIfPresent(Map<String, String> map, String envKey, String propKey) {
        String val = map.get(envKey);
        if (val == null || val.isBlank()) {
            val = System.getenv(envKey);
        }
        if (val != null && !val.isBlank()) {
            System.setProperty(propKey, val);
        }
    }

    private static void loadFromFile(File file, Map<String, String> map) {
        try (BufferedReader reader = new BufferedReader(new FileReader(file, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                int equalIdx = line.indexOf('=');
                if (equalIdx > 0) {
                    String key = line.substring(0, equalIdx).trim();
                    String value = line.substring(equalIdx + 1).trim();

                    if ((value.startsWith("\"") && value.endsWith("\"")) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        if (value.length() >= 2) {
                            value = value.substring(1, value.length() - 1);
                        }
                    }

                    map.put(key, value);
                    if (System.getProperty(key) == null) {
                        System.setProperty(key, value);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading " + file.getAbsolutePath() + ": " + e.getMessage());
        }
    }
}

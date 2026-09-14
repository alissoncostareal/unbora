package com.unbora.api.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> envProperties = new HashMap<>();

        File[] possibleFiles = new File[]{
                new File(".env"),
                new File("../.env"),
                new File(System.getProperty("user.dir"), ".env"),
                new File(System.getProperty("user.dir"), "../.env")
        };

        for (File file : possibleFiles) {
            if (file.exists() && file.isFile()) {
                loadEnvFile(file, envProperties);
                break;
            }
        }

        // Map environment variables to Spring properties
        String groqKey = getVal(envProperties, "GROQ_API_KEY");
        if (groqKey != null) envProperties.put("unbora.groq.api-key", groqKey);

        String braveKey = getVal(envProperties, "BRAVE_API_KEY");
        if (braveKey != null) envProperties.put("unbora.brave.api-key", braveKey);

        String placesKey = getVal(envProperties, "GOOGLE_PLACES_API_KEY");
        if (placesKey == null) placesKey = getVal(envProperties, "GOOGLE_MAPS_API_KEY");
        if (placesKey != null) envProperties.put("unbora.google.places-api-key", placesKey);

        String superEmail = getVal(envProperties, "SUPERADMIN_EMAIL");
        if (superEmail != null) envProperties.put("unbora.superadmin.email", superEmail);

        String superPass = getVal(envProperties, "SUPERADMIN_PASSWORD");
        if (superPass != null) envProperties.put("unbora.superadmin.password", superPass);

        String superName = getVal(envProperties, "SUPERADMIN_NAME");
        if (superName != null) envProperties.put("unbora.superadmin.name", superName);

        String jwtSecret = getVal(envProperties, "ADMIN_JWT_SECRET");
        if (jwtSecret == null) jwtSecret = getVal(envProperties, "JWT_SECRET");
        if (jwtSecret != null) envProperties.put("unbora.jwt.secret", jwtSecret);

        String allowedOrigin = getVal(envProperties, "ALLOWED_ORIGIN");
        if (allowedOrigin != null) envProperties.put("unbora.cors.allowed-origin", allowedOrigin);

        // Handle DATABASE_URL conversion
        String databaseUrl = getVal(envProperties, "DATABASE_URL");
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

                    envProperties.put("spring.datasource.url", jdbcUrl);
                    envProperties.put("SPRING_DATASOURCE_URL", jdbcUrl);

                    if (username != null) {
                        envProperties.put("spring.datasource.username", username);
                        envProperties.put("SPRING_DATASOURCE_USERNAME", username);
                    }
                    if (password != null) {
                        envProperties.put("spring.datasource.password", password);
                        envProperties.put("SPRING_DATASOURCE_PASSWORD", password);
                    }
                } else if (databaseUrl.startsWith("jdbc:postgresql://")) {
                    envProperties.put("spring.datasource.url", databaseUrl);
                    envProperties.put("SPRING_DATASOURCE_URL", databaseUrl);
                }
            } catch (Exception e) {
                System.err.println("Could not parse DATABASE_URL: " + e.getMessage());
            }
        }

        if (!envProperties.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("dotenvProperties", envProperties));
        }
    }

    private String getVal(Map<String, Object> map, String key) {
        String val = (String) map.get(key);
        if (val == null || val.isBlank()) {
            val = System.getenv(key);
        }
        return val;
    }

    private void loadEnvFile(File file, Map<String, Object> envProperties) {
        try (BufferedReader reader = new BufferedReader(new FileReader(file, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                int equalIdx = line.indexOf('=');
                if (equalIdx > 0) {
                    String key = line.substring(0, equalIdx).trim();
                    String value = line.substring(equalIdx + 1).trim();

                    // Strip wrapping quotes
                    if ((value.startsWith("\"") && value.endsWith("\"")) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        if (value.length() >= 2) {
                            value = value.substring(1, value.length() - 1);
                        }
                    }

                    envProperties.put(key, value);
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

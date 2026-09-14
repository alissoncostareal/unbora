package com.unbora.api.domain.health;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@Tag(name = "Health", description = "Verificação de status da API")
public class HealthController {

    @GetMapping("/")
    @Operation(summary = "Informações da raiz da API")
    public Map<String, Object> root() {
        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("health", "/health");
        endpoints.put("swagger", "/swagger-ui.html");
        endpoints.put("recommend", "POST /api/recomendar");
        endpoints.put("search", "POST /api/buscar");
        endpoints.put("events", "POST /api/eventos");
        endpoints.put("users", "/users");
        endpoints.put("usersStats", "/users/stats");
        endpoints.put("carousels", "/carousels");
        endpoints.put("notifications", "/notifications");
        endpoints.put("locations", "/locations");
        endpoints.put("adminLogin", "POST /admin/auth/login");

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("status", "ok");
        root.put("service", "unbora-backend");
        root.put("message", "API Unbora rodando (Java Spring Boot 3.4)");
        root.put("endpoints", endpoints);

        return root;
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "service", "unbora-backend"
        );
    }
}

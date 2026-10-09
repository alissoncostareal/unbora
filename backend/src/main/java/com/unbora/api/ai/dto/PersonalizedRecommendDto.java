package com.unbora.api.ai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

public record PersonalizedRecommendDto(
        @Schema(description = "ID do usuário para consulta do histórico de visitas e check-ins", example = "usr_123456")
        String userId,

        @Schema(description = "Cidade foco da recomendação", example = "Fortaleza")
        @Size(max = 100, message = "O nome da cidade deve ter no máximo 100 caracteres")
        String city,

        @Schema(description = "Estado/Região", example = "Ceará")
        @Size(max = 100, message = "O nome da região deve ter no máximo 100 caracteres")
        String region,

        @Schema(description = "País", example = "Brasil")
        @Size(max = 100, message = "O nome do país deve ter no máximo 100 caracteres")
        String country,

        @Schema(description = "Latitude do usuário para ordenação por proximidade", example = "-3.7319")
        Double latitude,

        @Schema(description = "Longitude do usuário para ordenação por proximidade", example = "-38.5267")
        Double longitude,

        @Schema(description = "Raio máximo de busca em km", example = "12.0")
        Double radiusKm
) {}

package com.unbora.api.ai.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SearchDto(
        @NotBlank(message = "O termo de busca não pode ser vazio.")
        @Size(max = 300, message = "O termo de busca deve ter no máximo 300 caracteres.")
        String query,

        @Size(max = 100, message = "Nome da cidade deve ter no máximo 100 caracteres.")
        String city,

        @Size(max = 100, message = "Nome da região deve ter no máximo 100 caracteres.")
        String region,

        @Size(max = 100, message = "Nome do país deve ter no máximo 100 caracteres.")
        String country,

        @DecimalMin(value = "-90.0", message = "Latitude inválida.")
        @DecimalMax(value = "90.0", message = "Latitude inválida.")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "Longitude inválida.")
        @DecimalMax(value = "180.0", message = "Longitude inválida.")
        Double longitude,

        @Size(max = 120, message = "ID de usuário inválido.")
        String userId
) {
    public SearchDto(String query) {
        this(query, null, null, null, null, null, null);
    }
}

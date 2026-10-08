package com.unbora.api.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RecommendDto(
        @NotBlank(message = "O humor não pode ser vazio.")
        @Size(max = 100, message = "O humor deve ter no máximo 100 caracteres.")
        String humor,

        @NotBlank(message = "O campo sentir não pode ser vazio.")
        @Size(max = 500, message = "O campo sentir deve ter no máximo 500 caracteres.")
        String sentir,

        @NotEmpty(message = "Pelo menos uma atividade deve ser selecionada.")
        @Size(max = 30, message = "No máximo 30 atividades permitidas.")
        List<@Valid ActivityItemDto> activities,

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

        @DecimalMin(value = "1.0", message = "Raio mínimo é 1 km.")
        @DecimalMax(value = "100.0", message = "Raio máximo é 100 km.")
        Double radiusKm,

        @Size(max = 120, message = "ID de usuário inválido.")
        String userId
) {
    public RecommendDto(String humor, String sentir, List<ActivityItemDto> activities) {
        this(humor, sentir, activities, null, null, null, null, null, null, null);
    }
}

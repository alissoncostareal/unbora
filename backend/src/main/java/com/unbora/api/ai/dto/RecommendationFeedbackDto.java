package com.unbora.api.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecommendationFeedbackDto(
        @NotBlank(message = "Nome do lugar não pode ser vazio.")
        @Size(max = 200, message = "Nome do lugar deve ter no máximo 200 caracteres.")
        String placeName,

        @Size(max = 50, message = "Ação deve ter no máximo 50 caracteres.")
        String action, // "LIKE", "DISLIKE", "MAPS_CLICK", "SHARE", "RATE"

        @Size(max = 100, message = "Humor deve ter no máximo 100 caracteres.")
        String humor,

        @Size(max = 500, message = "Sentir deve ter no máximo 500 caracteres.")
        String sentir,

        @Size(max = 100, message = "Categoria deve ter no máximo 100 caracteres.")
        String categoryTag,

        @Size(max = 1000, message = "Comentário deve ter no máximo 1000 caracteres.")
        String comment,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        Integer stars,

        @Size(max = 150, message = "Place ID deve ter no máximo 150 caracteres.")
        String placeId,

        @Size(max = 120, message = "User ID deve ter no máximo 120 caracteres.")
        String userId
) {}

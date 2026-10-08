package com.unbora.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActivityItemDto(
        @NotBlank(message = "ID da atividade é obrigatório")
        @Size(max = 60, message = "ID da atividade deve ter no máximo 60 caracteres")
        String id,

        @NotBlank(message = "Nome da atividade é obrigatório")
        @Size(max = 100, message = "Nome da atividade deve ter no máximo 100 caracteres")
        String label,

        @Size(max = 200, message = "Dica de busca deve ter no máximo 200 caracteres")
        String searchHint
) {
    public ActivityItemDto(String id, String label) {
        this(id, label, null);
    }
}

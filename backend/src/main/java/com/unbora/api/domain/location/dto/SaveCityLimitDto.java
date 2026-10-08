package com.unbora.api.domain.location.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveCityLimitDto(
        @NotBlank(message = "O nome da cidade é obrigatório")
        @Size(max = 120, message = "Nome da cidade muito longo")
        String cityName,

        @Min(value = 6, message = "O número mínimo de resultados é 6")
        @Max(value = 60, message = "O número máximo de resultados é 60")
        int maxResults,

        Boolean active
) {}

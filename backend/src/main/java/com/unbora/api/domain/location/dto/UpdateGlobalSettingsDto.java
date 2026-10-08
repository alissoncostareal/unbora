package com.unbora.api.domain.location.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateGlobalSettingsDto(
        @Min(value = 6, message = "O número mínimo de resultados é 6")
        @Max(value = 60, message = "O número máximo de resultados é 60")
        int defaultMaxResults
) {}

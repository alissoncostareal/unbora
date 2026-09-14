package com.unbora.api.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record SearchDto(
        @NotBlank String query,
        String city,
        String region,
        String country,
        Double latitude,
        Double longitude
) {
    public SearchDto(String query) {
        this(query, null, null, null, null, null);
    }
}

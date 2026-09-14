package com.unbora.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record RecommendDto(
        @NotBlank String humor,
        @NotBlank String sentir,
        @NotEmpty List<ActivityItemDto> activities,
        String city,
        String region,
        String country,
        Double latitude,
        Double longitude,
        Double radiusKm
) {
    public RecommendDto(String humor, String sentir, List<ActivityItemDto> activities) {
        this(humor, sentir, activities, null, null, null, null, null, null);
    }
}

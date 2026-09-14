package com.unbora.api.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RecommendationFeedbackDto(
        @NotBlank String placeName,
        String action, // "LIKE", "DISLIKE", "MAPS_CLICK", "SHARE", "RATE"
        String humor,
        String sentir,
        String categoryTag,
        String comment,
        @Min(1) @Max(5) Integer stars,
        String placeId
) {}

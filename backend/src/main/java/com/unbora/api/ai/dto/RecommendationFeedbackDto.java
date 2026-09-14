package com.unbora.api.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record RecommendationFeedbackDto(
        @NotBlank String placeName,
        String action, // "LIKE", "DISLIKE", "MAPS_CLICK", "SHARE"
        String humor,
        String sentir,
        String categoryTag,
        String comment
) {}

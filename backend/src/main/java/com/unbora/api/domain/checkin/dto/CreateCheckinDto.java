package com.unbora.api.domain.checkin.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public record CreateCheckinDto(
        @NotBlank(message = "O ID do local é obrigatório.")
        String placeId,

        @NotBlank(message = "O nome do local é obrigatório.")
        String placeName,

        String placeType,
        String city,
        String imageUrl,
        String mapsUrl,
        Integer rating,
        String notes,
        Instant visitedAt
) {}

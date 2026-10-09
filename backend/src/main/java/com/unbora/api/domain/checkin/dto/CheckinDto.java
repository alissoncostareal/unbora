package com.unbora.api.domain.checkin.dto;

import java.time.Instant;

public record CheckinDto(
        String id,
        String userId,
        String placeId,
        String placeName,
        String placeType,
        String city,
        String imageUrl,
        String mapsUrl,
        Integer rating,
        String notes,
        Instant visitedAt,
        Instant createdAt
) {}

package com.unbora.api.domain.checkin.dto;

import java.time.Instant;

public record RevisitSuggestionDto(
        String placeId,
        String placeName,
        String placeType,
        String city,
        String imageUrl,
        String mapsUrl,
        Integer rating,
        String notes,
        Instant lastVisitedAt,
        long daysSinceLastVisit,
        String inviteMessage
) {}

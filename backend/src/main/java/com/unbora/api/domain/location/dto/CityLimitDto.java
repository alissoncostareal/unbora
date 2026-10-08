package com.unbora.api.domain.location.dto;

import java.time.Instant;

public record CityLimitDto(
        String id,
        String cityName,
        int maxResults,
        boolean active,
        Instant updatedAt
) {}

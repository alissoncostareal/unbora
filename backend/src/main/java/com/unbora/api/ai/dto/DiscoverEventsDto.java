package com.unbora.api.ai.dto;

public record DiscoverEventsDto(
        String city,
        String region,
        String country,
        Double latitude,
        Double longitude
) {
    public DiscoverEventsDto(String city) {
        this(city, null, null, null, null);
    }
}

package com.unbora.api.domain.location;

public record CitySuggestion(
        String city,
        String region,
        String country,
        String label,
        Double latitude,
        Double longitude
) {}

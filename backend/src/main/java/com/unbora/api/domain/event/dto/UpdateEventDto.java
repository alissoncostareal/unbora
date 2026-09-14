package com.unbora.api.domain.event.dto;

public record UpdateEventDto(
        String title,
        String description,
        String imageUrl,
        String city,
        String region,
        String venue,
        String startsAt,
        Boolean active
) {}

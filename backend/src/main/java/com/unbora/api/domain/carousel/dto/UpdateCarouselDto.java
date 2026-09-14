package com.unbora.api.domain.carousel.dto;

public record UpdateCarouselDto(
        String title,
        String subtitle,
        String tag,
        String imageUrl,
        String city,
        String region,
        Integer order,
        Boolean active
) {}

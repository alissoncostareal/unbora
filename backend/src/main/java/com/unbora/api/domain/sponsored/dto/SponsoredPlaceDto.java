package com.unbora.api.domain.sponsored.dto;

public record SponsoredPlaceDto(
        String id,
        String name,
        String city,
        String region,
        String country,
        String type,
        String description,
        String benefitText,
        String categoryTags,
        String imageUrl,
        String mapsUrl,
        String address,
        String placeId,
        Double rating,
        String priceLevel,
        Boolean slotBoost,
        Boolean homeHighlight,
        Boolean active,
        Integer sortOrder,
        Long impressionsCount,
        Long clicksCount,
        String createdAt,
        String updatedAt
) {}

package com.unbora.api.domain.sponsored.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SaveSponsoredPlaceDto(
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
        Integer sortOrder
) {}

package com.unbora.api.domain.testimonial.dto;

import java.util.List;

public record UpdateTestimonialSettingsDto(
        Boolean enabled,
        String kicker,
        String headline,
        String description,
        List<TestimonialItemDto> items
) {}

package com.unbora.api.domain.testimonial.dto;

public record TestimonialItemDto(
        String id,
        String name,
        String role,
        String city,
        String text,
        String mark,
        Integer rating,
        Boolean active
) {}

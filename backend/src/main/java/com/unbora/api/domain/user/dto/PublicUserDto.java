package com.unbora.api.domain.user.dto;

public record PublicUserDto(
        String id,
        String name,
        String email,
        Boolean isGuest,
        String platform,
        String role,
        String businessName,
        String createdAt,
        String lastSeenAt
) {}

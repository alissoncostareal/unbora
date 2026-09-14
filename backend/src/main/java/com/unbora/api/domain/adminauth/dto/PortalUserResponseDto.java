package com.unbora.api.domain.adminauth.dto;

public record PortalUserResponseDto(
        String id,
        String name,
        String email,
        String role,
        String createdAt
) {}

package com.unbora.api.domain.adminauth.dto;

public record AdminSessionDto(
        String id,
        String name,
        String email,
        String role
) {}

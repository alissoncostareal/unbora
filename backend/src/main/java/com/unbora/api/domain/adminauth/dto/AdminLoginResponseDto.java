package com.unbora.api.domain.adminauth.dto;

public record AdminLoginResponseDto(
        String token,
        AdminSessionDto user
) {}

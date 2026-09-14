package com.unbora.api.domain.user.dto;

public record GoogleLoginDto(
        String idToken,
        String email,
        String name,
        String googleId,
        String platform
) {}

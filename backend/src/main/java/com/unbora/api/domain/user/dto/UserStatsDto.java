package com.unbora.api.domain.user.dto;

public record UserStatsDto(
        long total,
        long guests,
        long registered,
        long activeToday
) {}

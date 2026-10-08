package com.unbora.api.domain.user.dto;

import java.util.List;

public record UserStatsDto(
        long total,
        long guests,
        long registered,
        long activeToday,
        List<Long> dailyActive,
        List<Long> dailyRegistered,
        List<String> dayLabels
) {
    public UserStatsDto(long total, long guests, long registered, long activeToday) {
        this(total, guests, registered, activeToday, List.of(), List.of(), List.of());
    }
}

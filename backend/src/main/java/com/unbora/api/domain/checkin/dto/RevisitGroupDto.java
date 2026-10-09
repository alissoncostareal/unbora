package com.unbora.api.domain.checkin.dto;

import java.util.List;

public record RevisitGroupDto(
        long totalCheckins,
        List<CheckinDto> thisWeek,
        List<CheckinDto> lastWeek,
        List<CheckinDto> lastMonth,
        List<CheckinDto> older,
        List<RevisitSuggestionDto> revisitSuggestions
) {}

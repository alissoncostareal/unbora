package com.unbora.api.domain.location.dto;

import java.util.List;

public record LocationSettingsDto(
        int defaultMaxResults,
        List<CityLimitDto> cityLimits
) {}

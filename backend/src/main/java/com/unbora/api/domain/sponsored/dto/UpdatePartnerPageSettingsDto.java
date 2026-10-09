package com.unbora.api.domain.sponsored.dto;

public record UpdatePartnerPageSettingsDto(
        String badgeText,
        String headline,
        String subheadline,
        String feature1Title,
        String feature1Description,
        String feature2Title,
        String feature2Description,
        String feature3Title,
        String feature3Description,
        String ctaPrimaryText,
        String ctaSecondaryText
) {}

package com.unbora.api.domain.notification.dto;

public record UpdateNotificationDto(
        String title,
        String body,
        String city,
        String region,
        Boolean active
) {}

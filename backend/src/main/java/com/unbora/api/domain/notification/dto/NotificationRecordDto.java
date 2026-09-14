package com.unbora.api.domain.notification.dto;

public record NotificationRecordDto(
        String id,
        String title,
        String body,
        String city,
        String region,
        Boolean active,
        String createdAt,
        String updatedAt
) {}

package com.unbora.api.domain.event.dto;

public record EventRecordDto(
        String id,
        String title,
        String description,
        String imageUrl,
        String city,
        String region,
        String venue,
        String startsAt,
        Boolean active,
        String merchantId,
        String merchantName,
        String businessName,
        String createdAt,
        String updatedAt,
        String category,
        String status,
        String rejectionReason
) {}

package com.unbora.api.domain.sponsored.dto;

import com.unbora.api.domain.sponsored.InvoiceStatus;
import com.unbora.api.domain.sponsored.PaymentMethod;

import java.math.BigDecimal;

public record SponsoredInvoiceDto(
        String id,
        String sponsoredPlaceId,
        String placeName,
        BigDecimal amount,
        String dueDate,
        String paidAt,
        InvoiceStatus status,
        PaymentMethod paymentMethod,
        String referencePeriod,
        String pixCopyPaste,
        String notes,
        String createdAt,
        String updatedAt
) {}

package com.unbora.api.domain.sponsored.dto;

import com.unbora.api.domain.sponsored.PaymentMethod;

import java.math.BigDecimal;

public record CreateInvoiceDto(
        BigDecimal amount,
        String dueDate,
        PaymentMethod paymentMethod,
        String referencePeriod,
        String notes
) {}

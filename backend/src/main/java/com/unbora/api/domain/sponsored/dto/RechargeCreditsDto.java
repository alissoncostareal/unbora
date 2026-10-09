package com.unbora.api.domain.sponsored.dto;

import com.unbora.api.domain.sponsored.PaymentMethod;

import java.math.BigDecimal;

public record RechargeCreditsDto(
        BigDecimal amount,
        PaymentMethod paymentMethod,
        String notes
) {}

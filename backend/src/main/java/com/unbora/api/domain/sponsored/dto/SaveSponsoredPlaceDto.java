package com.unbora.api.domain.sponsored.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.unbora.api.domain.sponsored.BillingModel;
import com.unbora.api.domain.sponsored.PaymentStatus;
import com.unbora.api.domain.sponsored.PlanTier;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SaveSponsoredPlaceDto(
        String name,
        String city,
        String region,
        String country,
        String type,
        String description,
        String benefitText,
        String categoryTags,
        String imageUrl,
        String mapsUrl,
        String address,
        String placeId,
        Double rating,
        String priceLevel,
        Boolean slotBoost,
        Boolean homeHighlight,
        Boolean active,
        Integer sortOrder,
        BillingModel billingModel,
        PlanTier planTier,
        BigDecimal monthlyPrice,
        BigDecimal creditBalance,
        BigDecimal costPerClick,
        BigDecimal costPerImpression,
        BigDecimal dailyBudget,
        PaymentStatus paymentStatus,
        String currentCycleStart,
        String nextBillingDate,
        String contactName,
        String contactPhone,
        String contactEmail,
        String cnpjCpf,
        String billingNotes,
        Boolean autoRenew,
        String merchantId,
        String merchantName,
        String merchantEmail
) {}

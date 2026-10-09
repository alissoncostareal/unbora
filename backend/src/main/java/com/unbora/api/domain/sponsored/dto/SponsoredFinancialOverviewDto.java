package com.unbora.api.domain.sponsored.dto;

import java.math.BigDecimal;
import java.util.Map;

public record SponsoredFinancialOverviewDto(
        BigDecimal monthlyRecurringRevenue,
        BigDecimal totalRevenueAllTime,
        BigDecimal totalPendingReceivables,
        BigDecimal totalOverdueReceivables,
        BigDecimal totalWalletBalance,
        long activeSubscriptionsCount,
        long activeCpcCampaignsCount,
        long totalInvoicesCount,
        long pendingInvoicesCount,
        long overdueInvoicesCount,
        Map<String, Long> placesByPlanTier,
        Map<String, Long> placesByBillingModel
) {}

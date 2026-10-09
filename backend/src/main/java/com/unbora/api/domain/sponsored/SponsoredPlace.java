package com.unbora.api.domain.sponsored;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "sponsored_places")
public class SponsoredPlace {

    @Id
    @Column(nullable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    private String region;

    @Column(nullable = false)
    private String country = "Brasil";

    private String type = "Experiência";

    @Column(length = 1000)
    private String description;

    /** Método B: Benefício Exclusivo / Unbora Perks (ex: 10% off mencionando o Unbora) */
    @Column(name = "benefit_text", length = 500)
    private String benefitText;

    /** Tags separadas por vírgula para matching com busca / humor (ex: café, gastronomia, relaxar) */
    @Column(name = "category_tags", length = 500)
    private String categoryTags;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "maps_url", length = 1000)
    private String mapsUrl;

    @Column(length = 500)
    private String address;

    @Column(name = "place_id")
    private String placeId;

    private Double rating = 4.8;

    @Column(name = "price_level")
    private String priceLevel = "MODERATE";

    /** Método A: Exibir no Slot de Ouro nos resultados de busca */
    @Column(name = "slot_boost", nullable = false)
    private Boolean slotBoost = true;

    /** Método C: Exibir nos Carrosséis de Destaque da Home e do App */
    @Column(name = "home_highlight", nullable = false)
    private Boolean homeHighlight = true;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "impressions_count", nullable = false)
    private Long impressionsCount = 0L;

    @Column(name = "clicks_count", nullable = false)
    private Long clicksCount = 0L;

    // --- 2. Modelos de Cobrança (Monetização) ---

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_model", nullable = false)
    private BillingModel billingModel = BillingModel.SUBSCRIPTION;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_tier", nullable = false)
    private PlanTier planTier = PlanTier.GOLD;

    @Column(name = "monthly_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPrice = BigDecimal.valueOf(199.00);

    @Column(name = "credit_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal creditBalance = BigDecimal.ZERO;

    @Column(name = "cost_per_click", nullable = false, precision = 8, scale = 2)
    private BigDecimal costPerClick = BigDecimal.valueOf(0.75);

    @Column(name = "cost_per_impression", nullable = false, precision = 8, scale = 3)
    private BigDecimal costPerImpression = BigDecimal.valueOf(0.015);

    @Column(name = "daily_budget", nullable = false, precision = 12, scale = 2)
    private BigDecimal dailyBudget = BigDecimal.ZERO;

    @Column(name = "spent_today", nullable = false, precision = 12, scale = 2)
    private BigDecimal spentToday = BigDecimal.ZERO;

    @Column(name = "total_spent", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PAID;

    @Column(name = "current_cycle_start")
    private LocalDate currentCycleStart;

    @Column(name = "next_billing_date")
    private LocalDate nextBillingDate;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "cnpj_cpf")
    private String cnpjCpf;

    @Column(name = "billing_notes", length = 1000)
    private String billingNotes;

    @Column(name = "merchant_id")
    private String merchantId;

    @Column(name = "merchant_name")
    private String merchantName;

    @Column(name = "merchant_email")
    private String merchantEmail;

    @Column(name = "auto_renew", nullable = false)
    private Boolean autoRenew = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    public void prePersist() {
        if (this.id == null || this.id.isBlank()) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.country == null || this.country.isBlank()) {
            this.country = "Brasil";
        }
        if (this.impressionsCount == null) this.impressionsCount = 0L;
        if (this.clicksCount == null) this.clicksCount = 0L;
        if (this.billingModel == null) this.billingModel = BillingModel.SUBSCRIPTION;
        if (this.planTier == null) this.planTier = PlanTier.GOLD;
        if (this.monthlyPrice == null) this.monthlyPrice = BigDecimal.valueOf(199.00);
        if (this.creditBalance == null) this.creditBalance = BigDecimal.ZERO;
        if (this.costPerClick == null) this.costPerClick = BigDecimal.valueOf(0.75);
        if (this.costPerImpression == null) this.costPerImpression = BigDecimal.valueOf(0.015);
        if (this.dailyBudget == null) this.dailyBudget = BigDecimal.ZERO;
        if (this.spentToday == null) this.spentToday = BigDecimal.ZERO;
        if (this.totalSpent == null) this.totalSpent = BigDecimal.ZERO;
        if (this.paymentStatus == null) this.paymentStatus = PaymentStatus.PAID;
        if (this.autoRenew == null) this.autoRenew = true;
        if (this.currentCycleStart == null) this.currentCycleStart = LocalDate.now();
        if (this.nextBillingDate == null) this.nextBillingDate = LocalDate.now().plusMonths(1);
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.updatedAt == null) this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public SponsoredPlace() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBenefitText() {
        return benefitText;
    }

    public void setBenefitText(String benefitText) {
        this.benefitText = benefitText;
    }

    public String getCategoryTags() {
        return categoryTags;
    }

    public void setCategoryTags(String categoryTags) {
        this.categoryTags = categoryTags;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getMapsUrl() {
        return mapsUrl;
    }

    public void setMapsUrl(String mapsUrl) {
        this.mapsUrl = mapsUrl;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPlaceId() {
        return placeId;
    }

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getPriceLevel() {
        return priceLevel;
    }

    public void setPriceLevel(String priceLevel) {
        this.priceLevel = priceLevel;
    }

    public Boolean getSlotBoost() {
        return slotBoost;
    }

    public void setSlotBoost(Boolean slotBoost) {
        this.slotBoost = slotBoost;
    }

    public Boolean getHomeHighlight() {
        return homeHighlight;
    }

    public void setHomeHighlight(Boolean homeHighlight) {
        this.homeHighlight = homeHighlight;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Long getImpressionsCount() {
        return impressionsCount;
    }

    public void setImpressionsCount(Long impressionsCount) {
        this.impressionsCount = impressionsCount;
    }

    public Long getClicksCount() {
        return clicksCount;
    }

    public void setClicksCount(Long clicksCount) {
        this.clicksCount = clicksCount;
    }

    public BillingModel getBillingModel() {
        return billingModel;
    }

    public void setBillingModel(BillingModel billingModel) {
        this.billingModel = billingModel;
    }

    public PlanTier getPlanTier() {
        return planTier;
    }

    public void setPlanTier(PlanTier planTier) {
        this.planTier = planTier;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(BigDecimal monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public BigDecimal getCreditBalance() {
        return creditBalance;
    }

    public void setCreditBalance(BigDecimal creditBalance) {
        this.creditBalance = creditBalance;
    }

    public BigDecimal getCostPerClick() {
        return costPerClick;
    }

    public void setCostPerClick(BigDecimal costPerClick) {
        this.costPerClick = costPerClick;
    }

    public BigDecimal getCostPerImpression() {
        return costPerImpression;
    }

    public void setCostPerImpression(BigDecimal costPerImpression) {
        this.costPerImpression = costPerImpression;
    }

    public BigDecimal getDailyBudget() {
        return dailyBudget;
    }

    public void setDailyBudget(BigDecimal dailyBudget) {
        this.dailyBudget = dailyBudget;
    }

    public BigDecimal getSpentToday() {
        return spentToday;
    }

    public void setSpentToday(BigDecimal spentToday) {
        this.spentToday = spentToday;
    }

    public BigDecimal getTotalSpent() {
        return totalSpent;
    }

    public void setTotalSpent(BigDecimal totalSpent) {
        this.totalSpent = totalSpent;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDate getCurrentCycleStart() {
        return currentCycleStart;
    }

    public void setCurrentCycleStart(LocalDate currentCycleStart) {
        this.currentCycleStart = currentCycleStart;
    }

    public LocalDate getNextBillingDate() {
        return nextBillingDate;
    }

    public void setNextBillingDate(LocalDate nextBillingDate) {
        this.nextBillingDate = nextBillingDate;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getCnpjCpf() {
        return cnpjCpf;
    }

    public void setCnpjCpf(String cnpjCpf) {
        this.cnpjCpf = cnpjCpf;
    }

    public String getBillingNotes() {
        return billingNotes;
    }

    public void setBillingNotes(String billingNotes) {
        this.billingNotes = billingNotes;
    }

    public String getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(String merchantId) {
        this.merchantId = merchantId;
    }

    public String getMerchantName() {
        return merchantName;
    }

    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
    }

    public String getMerchantEmail() {
        return merchantEmail;
    }

    public void setMerchantEmail(String merchantEmail) {
        this.merchantEmail = merchantEmail;
    }

    public Boolean getAutoRenew() {
        return autoRenew;
    }

    public void setAutoRenew(Boolean autoRenew) {
        this.autoRenew = autoRenew;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

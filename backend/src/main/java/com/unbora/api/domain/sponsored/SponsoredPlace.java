package com.unbora.api.domain.sponsored;

import jakarta.persistence.*;
import java.time.Instant;
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

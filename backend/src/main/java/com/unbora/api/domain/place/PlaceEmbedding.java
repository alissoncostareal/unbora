package com.unbora.api.domain.place;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "place_embeddings", indexes = {
        @Index(name = "idx_place_embeddings_city", columnList = "city"),
        @Index(name = "idx_place_embeddings_category", columnList = "categoryTag")
})
public class PlaceEmbedding {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "category_tag", length = 50)
    private String categoryTag;

    @Column(name = "primary_type", length = 100)
    private String primaryType;

    @Column(name = "formatted_address", columnDefinition = "TEXT")
    private String formattedAddress;

    private Double latitude;
    private Double longitude;
    private Double rating;

    @Column(name = "user_rating_count")
    private Integer userRatingCount;

    @Column(name = "google_maps_uri", columnDefinition = "TEXT")
    private String googleMapsUri;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "vibe_summary", columnDefinition = "TEXT")
    private String vibeSummary;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public PlaceEmbedding() {}

    public PlaceEmbedding(String id, String name, String city, String categoryTag, String primaryType,
                          String formattedAddress, Double latitude, Double longitude, Double rating,
                          Integer userRatingCount, String googleMapsUri, String photoUrl, String vibeSummary) {
        this.id = id;
        this.name = name;
        this.city = city;
        this.categoryTag = categoryTag;
        this.primaryType = primaryType;
        this.formattedAddress = formattedAddress;
        this.latitude = latitude;
        this.longitude = longitude;
        this.rating = rating;
        this.userRatingCount = userRatingCount;
        this.googleMapsUri = googleMapsUri;
        this.photoUrl = photoUrl;
        this.vibeSummary = vibeSummary;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCategoryTag() { return categoryTag; }
    public void setCategoryTag(String categoryTag) { this.categoryTag = categoryTag; }

    public String getPrimaryType() { return primaryType; }
    public void setPrimaryType(String primaryType) { this.primaryType = primaryType; }

    public String getFormattedAddress() { return formattedAddress; }
    public void setFormattedAddress(String formattedAddress) { this.formattedAddress = formattedAddress; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getUserRatingCount() { return userRatingCount; }
    public void setUserRatingCount(Integer userRatingCount) { this.userRatingCount = userRatingCount; }

    public String getGoogleMapsUri() { return googleMapsUri; }
    public void setGoogleMapsUri(String googleMapsUri) { this.googleMapsUri = googleMapsUri; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getVibeSummary() { return vibeSummary; }
    public void setVibeSummary(String vibeSummary) { this.vibeSummary = vibeSummary; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

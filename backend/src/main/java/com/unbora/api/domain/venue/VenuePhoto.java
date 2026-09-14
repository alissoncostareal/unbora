package com.unbora.api.domain.venue;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "venue_photos",
        indexes = {
                @Index(name = "idx_venue_photos_normalized", columnList = "venue_normalized", unique = true),
                @Index(name = "idx_venue_photos_city", columnList = "city")
        }
)
public class VenuePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "venue_normalized", nullable = false, unique = true, length = 200)
    private String venueNormalized;

    @Column(name = "display_name", nullable = false, length = 250)
    private String displayName;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "photo_url", nullable = false, length = 2000)
    private String photoUrl;

    @Column(length = 50)
    private String source; // "google_places", "brave_search", "curated"

    @Column(name = "category_tag", length = 50)
    private String categoryTag;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public VenuePhoto() {}

    public VenuePhoto(String venueNormalized, String displayName, String city, String photoUrl, String source, String categoryTag) {
        this.venueNormalized = venueNormalized;
        this.displayName = displayName;
        this.city = city;
        this.photoUrl = photoUrl;
        this.source = source;
        this.categoryTag = categoryTag;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getVenueNormalized() {
        return venueNormalized;
    }

    public void setVenueNormalized(String venueNormalized) {
        this.venueNormalized = venueNormalized;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getCategoryTag() {
        return categoryTag;
    }

    public void setCategoryTag(String categoryTag) {
        this.categoryTag = categoryTag;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

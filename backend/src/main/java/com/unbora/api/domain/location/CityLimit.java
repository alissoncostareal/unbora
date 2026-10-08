package com.unbora.api.domain.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "city_limits")
public class CityLimit {

    @Id
    @Column(nullable = false, length = 120)
    private String id; // normalized slug, e.g. "toquio", "sao-paulo", "fortaleza"

    @Column(name = "city_name", nullable = false, length = 120)
    private String cityName; // Display name, e.g. "Tóquio"

    @Column(name = "max_results", nullable = false)
    private int maxResults = 24;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public CityLimit() {}

    public CityLimit(String id, String cityName, int maxResults, boolean active) {
        this.id = id;
        this.cityName = cityName;
        this.maxResults = maxResults;
        this.active = active;
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }

    public int getMaxResults() {
        return maxResults;
    }

    public void setMaxResults(int maxResults) {
        this.maxResults = maxResults;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

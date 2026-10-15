package com.unbora.api.domain.testimonial;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "testimonial_settings")
public class TestimonialSettings {

    public static final String ID = "default";

    @Id
    private String id = ID;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "kicker", length = 120)
    private String kicker = "Perspectivas reais";

    @Column(name = "headline", length = 300)
    private String headline = "A cidade redigida por quem caminha nela";

    @Column(name = "description", length = 1000)
    private String description = "Nossos correspondentes e leitores ativos compartilham a percepção sensorial de suas rotinas semanais por Fortaleza.";

    @Column(name = "items_json", columnDefinition = "TEXT")
    private String itemsJson;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public TestimonialSettings() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getKicker() {
        return kicker;
    }

    public void setKicker(String kicker) {
        this.kicker = kicker;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getItemsJson() {
        return itemsJson;
    }

    public void setItemsJson(String itemsJson) {
        this.itemsJson = itemsJson;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

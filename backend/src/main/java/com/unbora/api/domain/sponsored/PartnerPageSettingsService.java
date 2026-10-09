package com.unbora.api.domain.sponsored;

import com.unbora.api.common.security.InputSanitizer;
import com.unbora.api.domain.sponsored.dto.PartnerPageSettingsDto;
import com.unbora.api.domain.sponsored.dto.UpdatePartnerPageSettingsDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class PartnerPageSettingsService {

    private final PartnerPageSettingsRepository repository;

    public PartnerPageSettingsService(PartnerPageSettingsRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PartnerPageSettingsDto getSettings() {
        PartnerPageSettings settings = repository.findById(PartnerPageSettings.ID)
                .orElseGet(PartnerPageSettings::new);
        return toDto(settings);
    }

    @Transactional
    public PartnerPageSettingsDto updateSettings(UpdatePartnerPageSettingsDto dto) {
        PartnerPageSettings settings = repository.findById(PartnerPageSettings.ID)
                .orElseGet(PartnerPageSettings::new);

        if (dto != null) {
            if (dto.badgeText() != null && !dto.badgeText().isBlank()) {
                settings.setBadgeText(InputSanitizer.sanitizeText(dto.badgeText(), 120));
            }
            if (dto.headline() != null && !dto.headline().isBlank()) {
                settings.setHeadline(InputSanitizer.sanitizeText(dto.headline(), 300));
            }
            if (dto.subheadline() != null && !dto.subheadline().isBlank()) {
                settings.setSubheadline(InputSanitizer.sanitizeText(dto.subheadline(), 800));
            }
            if (dto.feature1Title() != null && !dto.feature1Title().isBlank()) {
                settings.setFeature1Title(InputSanitizer.sanitizeText(dto.feature1Title(), 150));
            }
            if (dto.feature1Description() != null && !dto.feature1Description().isBlank()) {
                settings.setFeature1Description(InputSanitizer.sanitizeText(dto.feature1Description(), 500));
            }
            if (dto.feature2Title() != null && !dto.feature2Title().isBlank()) {
                settings.setFeature2Title(InputSanitizer.sanitizeText(dto.feature2Title(), 150));
            }
            if (dto.feature2Description() != null && !dto.feature2Description().isBlank()) {
                settings.setFeature2Description(InputSanitizer.sanitizeText(dto.feature2Description(), 500));
            }
            if (dto.feature3Title() != null && !dto.feature3Title().isBlank()) {
                settings.setFeature3Title(InputSanitizer.sanitizeText(dto.feature3Title(), 150));
            }
            if (dto.feature3Description() != null && !dto.feature3Description().isBlank()) {
                settings.setFeature3Description(InputSanitizer.sanitizeText(dto.feature3Description(), 500));
            }
            if (dto.ctaPrimaryText() != null && !dto.ctaPrimaryText().isBlank()) {
                settings.setCtaPrimaryText(InputSanitizer.sanitizeText(dto.ctaPrimaryText(), 100));
            }
            if (dto.ctaSecondaryText() != null && !dto.ctaSecondaryText().isBlank()) {
                settings.setCtaSecondaryText(InputSanitizer.sanitizeText(dto.ctaSecondaryText(), 100));
            }
        }

        settings.setUpdatedAt(Instant.now());
        PartnerPageSettings saved = repository.save(settings);
        return toDto(saved);
    }

    private PartnerPageSettingsDto toDto(PartnerPageSettings entity) {
        return new PartnerPageSettingsDto(
                entity.getBadgeText(),
                entity.getHeadline(),
                entity.getSubheadline(),
                entity.getFeature1Title(),
                entity.getFeature1Description(),
                entity.getFeature2Title(),
                entity.getFeature2Description(),
                entity.getFeature3Title(),
                entity.getFeature3Description(),
                entity.getCtaPrimaryText(),
                entity.getCtaSecondaryText(),
                entity.getUpdatedAt()
        );
    }
}

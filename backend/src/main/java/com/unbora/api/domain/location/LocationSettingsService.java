package com.unbora.api.domain.location;

import com.unbora.api.common.exception.ApiException;
import com.unbora.api.common.security.InputSanitizer;
import com.unbora.api.domain.guide.GuideSettings;
import com.unbora.api.domain.guide.GuideSettingsRepository;
import com.unbora.api.domain.location.dto.CityLimitDto;
import com.unbora.api.domain.location.dto.LocationSettingsDto;
import com.unbora.api.domain.location.dto.SaveCityLimitDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class LocationSettingsService {

    public static final int FALLBACK_DEFAULT_MAX_RESULTS = 24;

    private final CityLimitRepository cityLimitRepository;
    private final GuideSettingsRepository guideSettingsRepository;

    public LocationSettingsService(
            CityLimitRepository cityLimitRepository,
            GuideSettingsRepository guideSettingsRepository
    ) {
        this.cityLimitRepository = cityLimitRepository;
        this.guideSettingsRepository = guideSettingsRepository;
    }

    /**
     * Retorna o limite efetivo de resultados para uma cidade específica.
     * Se houver regra ativa cadastrada para a cidade, utiliza o valor customizado (ex: 40 para Tóquio).
     * Caso contrário, utiliza o valor padrão global configurado.
     */
    @Transactional(readOnly = true)
    public int getEffectiveMaxResults(String city) {
        if (city == null || city.isBlank()) {
            return getDefaultMaxResults();
        }

        String slug = normalizeCitySlug(city);
        return cityLimitRepository.findById(slug)
                .filter(CityLimit::isActive)
                .map(CityLimit::getMaxResults)
                .orElseGet(this::getDefaultMaxResults);
    }

    @Transactional(readOnly = true)
    public int getDefaultMaxResults() {
        return guideSettingsRepository.findById(GuideSettings.ID)
                .map(GuideSettings::getDefaultMaxResults)
                .filter(limit -> limit >= 6 && limit <= 60)
                .orElse(FALLBACK_DEFAULT_MAX_RESULTS);
    }

    @Transactional(readOnly = true)
    public LocationSettingsDto getLocationSettings() {
        int defaultMax = getDefaultMaxResults();
        List<CityLimitDto> list = cityLimitRepository.findAllByOrderByCityNameAsc().stream()
                .map(c -> new CityLimitDto(
                        c.getId(),
                        c.getCityName(),
                        c.getMaxResults(),
                        c.isActive(),
                        c.getUpdatedAt()
                ))
                .toList();
        return new LocationSettingsDto(defaultMax, list);
    }

    @Transactional
    public LocationSettingsDto updateGlobalSettings(int defaultMaxResults) {
        if (defaultMaxResults < 6 || defaultMaxResults > 60) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O número padrão de resultados deve estar entre 6 e 60.");
        }

        GuideSettings settings = guideSettingsRepository.findById(GuideSettings.ID)
                .orElseGet(GuideSettings::new);
        settings.setId(GuideSettings.ID);
        settings.setDefaultMaxResults(defaultMaxResults);
        guideSettingsRepository.save(settings);

        return getLocationSettings();
    }

    @Transactional
    public LocationSettingsDto saveCityLimit(SaveCityLimitDto dto) {
        if (dto == null || dto.cityName() == null || dto.cityName().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O nome da cidade é obrigatório.");
        }

        String sanitizedName = InputSanitizer.sanitizeCityOrCountry(dto.cityName(), 120);
        if (sanitizedName == null || sanitizedName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nome da cidade inválido.");
        }

        int max = Math.max(6, Math.min(60, dto.maxResults()));
        String slug = normalizeCitySlug(sanitizedName);

        CityLimit cityLimit = cityLimitRepository.findById(slug)
                .orElseGet(() -> new CityLimit(slug, sanitizedName, max, true));

        cityLimit.setCityName(sanitizedName);
        cityLimit.setMaxResults(max);
        if (dto.active() != null) {
            cityLimit.setActive(dto.active());
        }
        cityLimit.setUpdatedAt(Instant.now());

        cityLimitRepository.save(cityLimit);
        return getLocationSettings();
    }

    @Transactional
    public LocationSettingsDto deleteCityLimit(String id) {
        if (id == null || id.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ID da cidade inválido.");
        }
        String cleanId = id.trim().toLowerCase(Locale.ROOT);
        if (cityLimitRepository.existsById(cleanId)) {
            cityLimitRepository.deleteById(cleanId);
        }
        return getLocationSettings();
    }

    public static String normalizeCitySlug(String city) {
        if (city == null) return "";
        String normalized = Normalizer.normalize(city.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}

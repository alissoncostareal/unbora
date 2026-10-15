package com.unbora.api.domain.testimonial;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unbora.api.domain.testimonial.dto.TestimonialItemDto;
import com.unbora.api.domain.testimonial.dto.TestimonialSettingsDto;
import com.unbora.api.domain.testimonial.dto.UpdateTestimonialSettingsDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TestimonialSettingsService {

    private static final Logger log = LoggerFactory.getLogger(TestimonialSettingsService.class);

    private final TestimonialSettingsRepository repository;
    private final ObjectMapper objectMapper;

    public TestimonialSettingsService(TestimonialSettingsRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public TestimonialSettingsDto getSettings() {
        TestimonialSettings entity = repository.findById(TestimonialSettings.ID)
                .orElseGet(this::createDefaultSettings);
        return toDto(entity, false);
    }

    @Transactional(readOnly = true)
    public TestimonialSettingsDto getPublicSettings() {
        TestimonialSettings entity = repository.findById(TestimonialSettings.ID)
                .orElseGet(this::buildDefaultTransient);
        return toDto(entity, true);
    }

    @Transactional
    public TestimonialSettingsDto updateSettings(UpdateTestimonialSettingsDto dto) {
        TestimonialSettings entity = repository.findById(TestimonialSettings.ID)
                .orElseGet(this::createDefaultSettings);

        if (dto.enabled() != null) {
            entity.setEnabled(dto.enabled());
        }
        if (dto.kicker() != null) {
            entity.setKicker(dto.kicker().trim());
        }
        if (dto.headline() != null) {
            entity.setHeadline(dto.headline().trim());
        }
        if (dto.description() != null) {
            entity.setDescription(dto.description().trim());
        }
        if (dto.items() != null) {
            List<TestimonialItemDto> sanitized = sanitizeItems(dto.items());
            try {
                entity.setItemsJson(objectMapper.writeValueAsString(sanitized));
            } catch (Exception e) {
                log.error("Failed to serialize testimonial items", e);
            }
        }

        entity.setUpdatedAt(Instant.now());
        TestimonialSettings saved = repository.save(entity);
        return toDto(saved, false);
    }

    private TestimonialSettings createDefaultSettings() {
        TestimonialSettings entity = buildDefaultTransient();
        return repository.save(entity);
    }

    private TestimonialSettings buildDefaultTransient() {
        TestimonialSettings entity = new TestimonialSettings();
        entity.setId(TestimonialSettings.ID);
        entity.setEnabled(true);
        entity.setKicker("Perspectivas reais");
        entity.setHeadline("A cidade redigida por quem caminha nela");
        entity.setDescription("Nossos correspondentes e leitores ativos compartilham a percepção sensorial de suas rotinas semanais por Fortaleza.");

        List<TestimonialItemDto> defaultItems = List.of(
                new TestimonialItemDto(
                        UUID.randomUUID().toString(),
                        "Lívia Vasconcelos",
                        "Arquiteta",
                        "Fortaleza",
                        "No Unbora encontrei cafés e refúgios com acústica e iluminação perfeitas para debater projetos sem disputar volume.",
                        "L",
                        5,
                        true
                ),
                new TestimonialItemDto(
                        UUID.randomUUID().toString(),
                        "Matheus Alencar",
                        "Designer gráfico",
                        "Fortaleza",
                        "O filtro por intenção mudou minhas noites. Quando quero apenas vinho e conversa sem pressa, a curadoria é certeira.",
                        "M",
                        5,
                        true
                ),
                new TestimonialItemDto(
                        UUID.randomUUID().toString(),
                        "Dra. Clara Mendes",
                        "Pesquisadora",
                        "Fortaleza",
                        "O ritmo das recomendações foge do óbvio comercial. É uma curadoria editorial com alma e contexto local.",
                        "C",
                        5,
                        true
                )
        );

        try {
            entity.setItemsJson(objectMapper.writeValueAsString(defaultItems));
        } catch (Exception e) {
            log.error("Failed to serialize default testimonial items", e);
        }

        return entity;
    }

    private List<TestimonialItemDto> sanitizeItems(List<TestimonialItemDto> items) {
        List<TestimonialItemDto> list = new ArrayList<>();
        for (TestimonialItemDto item : items) {
            if (item == null) continue;
            String id = (item.id() == null || item.id().isBlank()) ? UUID.randomUUID().toString() : item.id();
            String name = item.name() != null ? item.name().trim() : "";
            String mark = (item.mark() != null && !item.mark().isBlank())
                    ? item.mark().trim().substring(0, Math.min(2, item.mark().trim().length()))
                    : (name.isEmpty() ? "U" : name.substring(0, 1).toUpperCase());
            list.add(new TestimonialItemDto(
                    id,
                    name,
                    item.role() != null ? item.role().trim() : "",
                    item.city() != null && !item.city().isBlank() ? item.city().trim() : "Fortaleza",
                    item.text() != null ? item.text().trim() : "",
                    mark,
                    item.rating() != null ? Math.max(1, Math.min(5, item.rating())) : 5,
                    item.active() != null ? item.active() : true
            ));
        }
        return list;
    }

    private TestimonialSettingsDto toDto(TestimonialSettings entity, boolean publicViewOnly) {
        List<TestimonialItemDto> items = new ArrayList<>();
        if (entity.getItemsJson() != null && !entity.getItemsJson().isBlank()) {
            try {
                List<TestimonialItemDto> parsed = objectMapper.readValue(
                        entity.getItemsJson(),
                        new TypeReference<List<TestimonialItemDto>>() {}
                );
                if (parsed != null) {
                    for (TestimonialItemDto item : parsed) {
                        if (!publicViewOnly || Boolean.TRUE.equals(item.active())) {
                            items.add(item);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to parse testimonial items JSON", e);
            }
        }

        boolean isEnabled = Boolean.TRUE.equals(entity.getEnabled());
        if (publicViewOnly && items.isEmpty()) {
            isEnabled = false;
        }

        return new TestimonialSettingsDto(
                entity.getId(),
                isEnabled,
                entity.getKicker(),
                entity.getHeadline(),
                entity.getDescription(),
                items
        );
    }
}

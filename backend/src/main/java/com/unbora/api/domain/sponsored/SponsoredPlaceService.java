package com.unbora.api.domain.sponsored;

import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.sponsored.dto.SaveSponsoredPlaceDto;
import com.unbora.api.domain.sponsored.dto.SponsoredPlaceDto;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class SponsoredPlaceService {

    private static final Logger log = LoggerFactory.getLogger(SponsoredPlaceService.class);
    private final SponsoredPlaceRepository repository;

    public SponsoredPlaceService(SponsoredPlaceRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    @Transactional
    public void seedInitialData() {
        if (repository.count() > 0) return;

        SponsoredPlace p1 = new SponsoredPlace();
        p1.setId(UUID.randomUUID().toString());
        p1.setName("Brava Wine & Bistro");
        p1.setCity("Fortaleza");
        p1.setRegion("Grande Fortaleza");
        p1.setCountry("Brasil");
        p1.setType("Bistrô & Wine Bar");
        p1.setDescription("Experiência enogastronômica refinada com mais de 300 rótulos selecionados e cardápio autoral.");
        p1.setBenefitText("15% de desconto no jantar ou 1 taça de espumante de boas-vindas mencionando o Unbora.");
        p1.setCategoryTags("gastronomia, romance, relaxar, comida, vinho, jantar");
        p1.setImageUrl("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80");
        p1.setMapsUrl("https://maps.google.com/?q=Brava+Wine+Fortaleza");
        p1.setAddress("Av. Padre Antônio Tomás, 850 - Aldeota, Fortaleza - CE");
        p1.setRating(4.9);
        p1.setPriceLevel("EXPENSIVE");
        p1.setSlotBoost(true);
        p1.setHomeHighlight(true);
        p1.setActive(true);
        p1.setSortOrder(0);
        repository.save(p1);

        SponsoredPlace p2 = new SponsoredPlace();
        p2.setId(UUID.randomUUID().toString());
        p2.setName("Café Viriato Aldeota");
        p2.setCity("Fortaleza");
        p2.setRegion("Grande Fortaleza");
        p2.setCountry("Brasil");
        p2.setType("Café Especial");
        p2.setDescription("Ambiente sofisticado e acolhedor ideal para encontros, trabalho remoto e confeitaria artesanal.");
        p2.setBenefitText("Na compra de qualquer sobremesa ou brunch, ganhe 1 café espresso especial.");
        p2.setCategoryTags("café, cafeteria, relaxar, brunch, comida, doces");
        p2.setImageUrl("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80");
        p2.setMapsUrl("https://maps.google.com/?q=Cafe+Viriato+Fortaleza");
        p2.setAddress("R. Osvaldo Cruz, 2828 - Dionísio Torres, Fortaleza - CE");
        p2.setRating(4.8);
        p2.setPriceLevel("MODERATE");
        p2.setSlotBoost(true);
        p2.setHomeHighlight(true);
        p2.setActive(true);
        p2.setSortOrder(1);
        repository.save(p2);
    }

    public List<SponsoredPlaceDto> listAll() {
        return repository.findAllByOrderBySortOrderAscCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    public SponsoredPlaceDto getById(String id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));
    }

    @Transactional
    public SponsoredPlaceDto create(SaveSponsoredPlaceDto dto) {
        if (dto.name() == null || dto.name().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O nome do estabelecimento é obrigatório.");
        }
        if (dto.city() == null || dto.city().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A cidade é obrigatória.");
        }

        SponsoredPlace entity = new SponsoredPlace();
        entity.setId(UUID.randomUUID().toString());
        applyDto(entity, dto);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());

        return toDto(repository.save(entity));
    }

    @Transactional
    public SponsoredPlaceDto update(String id, SaveSponsoredPlaceDto dto) {
        SponsoredPlace entity = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));

        applyDto(entity, dto);
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    @Transactional
    public SponsoredPlaceDto toggleActive(String id) {
        SponsoredPlace entity = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));
        entity.setActive(!Boolean.TRUE.equals(entity.getActive()));
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        SponsoredPlace entity = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));
        repository.delete(entity);
    }

    @Transactional
    public void trackImpression(String id) {
        if (id == null || id.isBlank()) return;
        repository.findById(id).ifPresent(p -> {
            p.setImpressionsCount(p.getImpressionsCount() != null ? p.getImpressionsCount() + 1 : 1L);
            repository.save(p);
        });
    }

    @Transactional
    public void trackClick(String id) {
        if (id == null || id.isBlank()) return;
        repository.findById(id).ifPresent(p -> {
            p.setClicksCount(p.getClicksCount() != null ? p.getClicksCount() + 1 : 1L);
            repository.save(p);
        });
    }

    /**
     * Retorna os locais patrocinados elegíveis para injeção no Slot de Ouro (Método A)
     */
    public List<SponsoredPlace> getMatchingSponsoredForSearch(
            String city,
            String humor,
            List<String> activities,
            String query
    ) {
        if (city == null || city.isBlank()) return List.of();
        String targetCity = city.trim();
        List<SponsoredPlace> candidates = repository.findByActiveTrueAndSlotBoostTrueAndCityIgnoreCase(targetCity);
        if (candidates.isEmpty()) {
            // Tenta busca com normalização de cidade caso não encontre direto
            String normTarget = normalize(targetCity);
            candidates = repository.findAll().stream()
                    .filter(p -> Boolean.TRUE.equals(p.getActive()) && Boolean.TRUE.equals(p.getSlotBoost()))
                    .filter(p -> normalize(p.getCity()).equals(normTarget))
                    .toList();
        }

        if (candidates.isEmpty()) return List.of();

        // Se houver tags específicas de interesse / busca, pontuamos por relevância
        List<String> searchTerms = new ArrayList<>();
        if (humor != null) searchTerms.add(normalize(humor));
        if (activities != null) {
            for (String a : activities) searchTerms.add(normalize(a));
        }
        if (query != null && !query.isBlank()) {
            searchTerms.addAll(Arrays.stream(normalize(query).split("\\s+")).filter(s -> s.length() >= 3).toList());
        }

        if (searchTerms.isEmpty()) {
            // Se a busca for genérica, retorna até 2 patrocinados com maior prioridade
            return candidates.stream().limit(2).toList();
        }

        // Ordenar candidatos pelo grau de correspondência de tags/tipo/nome
        List<SponsoredPlace> matching = new ArrayList<>();
        List<SponsoredPlace> others = new ArrayList<>();

        for (SponsoredPlace sp : candidates) {
            String hay = normalize(sp.getName() + " " + sp.getType() + " " + sp.getCategoryTags() + " " + sp.getDescription());
            boolean matched = searchTerms.stream().anyMatch(t -> hay.contains(t) || isTagCompatible(t, hay));
            if (matched) {
                matching.add(sp);
            } else {
                others.add(sp);
            }
        }

        if (!matching.isEmpty()) {
            return matching.stream().limit(2).toList();
        }

        // Se não houver match exato de tags mas temos patrocinados na cidade, podemos sugerir até 1
        return others.stream().limit(1).toList();
    }

    public List<SponsoredPlace> getActiveHomeHighlights(String city) {
        if (city == null || city.isBlank()) return List.of();
        return repository.findByActiveTrueAndHomeHighlightTrueAndCityIgnoreCase(city.trim());
    }

    private boolean isTagCompatible(String term, String text) {
        if (term.contains("cafe") && (text.contains("cafe") || text.contains("bistro") || text.contains("brunch"))) return true;
        if (term.contains("gastro") && (text.contains("restaurante") || text.contains("comida") || text.contains("bar") || text.contains("bistro"))) return true;
        if (term.contains("musica") && (text.contains("bar") || text.contains("pub") || text.contains("show"))) return true;
        if (term.contains("relax") && (text.contains("parque") || text.contains("cafe") || text.contains("spa") || text.contains("bistro"))) return true;
        return false;
    }

    private void applyDto(SponsoredPlace entity, SaveSponsoredPlaceDto dto) {
        if (dto.name() != null) entity.setName(dto.name().trim());
        if (dto.city() != null) entity.setCity(dto.city().trim());
        if (dto.region() != null) entity.setRegion(dto.region().trim());
        if (dto.country() != null && !dto.country().isBlank()) entity.setCountry(dto.country().trim());
        if (dto.type() != null) entity.setType(dto.type().trim());
        if (dto.description() != null) entity.setDescription(dto.description().trim());
        if (dto.benefitText() != null) entity.setBenefitText(dto.benefitText().trim());
        if (dto.categoryTags() != null) entity.setCategoryTags(dto.categoryTags().trim());
        if (dto.imageUrl() != null) entity.setImageUrl(dto.imageUrl().trim());
        if (dto.mapsUrl() != null) entity.setMapsUrl(dto.mapsUrl().trim());
        if (dto.address() != null) entity.setAddress(dto.address().trim());
        if (dto.placeId() != null) entity.setPlaceId(dto.placeId().trim());
        if (dto.rating() != null) entity.setRating(dto.rating());
        if (dto.priceLevel() != null) entity.setPriceLevel(dto.priceLevel().trim());
        if (dto.slotBoost() != null) entity.setSlotBoost(dto.slotBoost());
        if (dto.homeHighlight() != null) entity.setHomeHighlight(dto.homeHighlight());
        if (dto.active() != null) entity.setActive(dto.active());
        if (dto.sortOrder() != null) entity.setSortOrder(dto.sortOrder());
    }

    private SponsoredPlaceDto toDto(SponsoredPlace p) {
        return new SponsoredPlaceDto(
                p.getId(),
                p.getName(),
                p.getCity(),
                p.getRegion(),
                p.getCountry(),
                p.getType(),
                p.getDescription(),
                p.getBenefitText(),
                p.getCategoryTags(),
                p.getImageUrl(),
                p.getMapsUrl(),
                p.getAddress(),
                p.getPlaceId(),
                p.getRating(),
                p.getPriceLevel(),
                p.getSlotBoost(),
                p.getHomeHighlight(),
                p.getActive(),
                p.getSortOrder(),
                p.getImpressionsCount(),
                p.getClicksCount(),
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : "",
                p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : ""
        );
    }

    private static String normalize(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return Pattern.compile("\\p{InCombiningDiacriticalMarks}+")
                .matcher(normalized)
                .replaceAll("")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}

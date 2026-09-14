package com.unbora.api.domain.event;

import com.unbora.api.common.PasswordUtil;
import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.event.dto.CreateEventDto;
import com.unbora.api.domain.event.dto.EventRecordDto;
import com.unbora.api.domain.event.dto.UpdateEventDto;
import com.unbora.api.domain.user.User;
import com.unbora.api.domain.user.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventsService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public EventsService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @PostConstruct
    @Transactional
    public void seedInitialData() {
        List<Event> existing = eventRepository.findAll();
        for (Event e : existing) {
            boolean dirty = false;
            String url = e.getImageUrl();
            if (url != null && !url.isBlank() && (isStockPhotoUrl(url) || isMisleadingVenuePhoto(e.getTitle(), e.getVenue(), url))) {
                e.setImageUrl("");
                dirty = true;
            }
            if (e.getStatus() == null || e.getStatus().isBlank()) {
                e.setStatus(Event.STATUS_APPROVED);
                dirty = true;
            }
            if (e.getCategory() == null || e.getCategory().isBlank()) {
                e.setCategory(EventCategories.normalize(e.getTitle()));
                dirty = true;
            }
            if (dirty) eventRepository.save(e);
        }

        if (eventRepository.count() > 0) return;

        String seedMerchantId = "seed-merchant-unbora";
        User merchant = userRepository.findById(seedMerchantId).orElse(null);
        if (merchant == null) {
            merchant = new User();
            merchant.setId(seedMerchantId);
            merchant.setName("Casa Unbora");
            merchant.setEmail("lojista@unbora.com");
            merchant.setGuest(false);
            merchant.setPasswordHash(PasswordUtil.hashPassword("unbora123"));
            merchant.setPlatform("seed");
            merchant.setRole("merchant");
            merchant.setBusinessName("Casa Unbora");
            merchant.setCreatedAt(Instant.now());
            merchant.setLastSeenAt(Instant.now());
            userRepository.save(merchant);
        }

        List<Event> seedEvents = List.of(
                createSeedEvent("seed-event-1", "Sessão Sonora no Dragão", "Música instrumental e shows autorais na praça verde do Centro Dragão do Mar.", "", "Fortaleza", "Grande Fortaleza", "Centro Dragão do Mar de Arte e Cultura, Praia de Iracema", "Shows", 1, 19, seedMerchantId),
                createSeedEvent("seed-event-2", "Chorinho no Mercado dos Pinhões", "Tradicional roda de choro com gastronomia regional e chopp artesanal.", "", "Fortaleza", "Grande Fortaleza", "Mercado dos Pinhões, Centro", "Gastronomia", 2, 18, seedMerchantId),
                createSeedEvent("seed-event-3", "Yoga & Pôr do Sol no Cocó", "Prática aberta de yoga e meditação ao entardecer no anfiteatro do parque.", "", "Fortaleza", "Grande Fortaleza", "Parque Estadual do Cocó, Cocó", "Esportes", 3, 16, seedMerchantId),
                createSeedEvent("seed-event-4", "Temporada Clássica no Theatro José de Alencar", "Concertos e espetáculos cênicos na joia arquitetônica de Fortaleza.", "", "Fortaleza", "Grande Fortaleza", "Theatro José de Alencar, Centro", "Cultura", 4, 20, seedMerchantId),
                createSeedEvent("seed-event-5", "Feira Criativa da Beira-Mar", "Artesanato autoral, moda cearense, doces típicos e música à beira-mar.", "", "Fortaleza", "Grande Fortaleza", "Feirinha da Beira-Mar, Meireles", "Feiras", 5, 17, seedMerchantId),
                createSeedEvent("seed-event-6", "Cinema & Debate no Cineteatro São Luiz", "Exibição de clássicos e lançamentos do cinema nacional com entrada franca.", "", "Fortaleza", "Grande Fortaleza", "Cineteatro São Luiz, Centro", "Cultura", 6, 19, seedMerchantId)
        );

        eventRepository.saveAll(seedEvents);
    }

    private static boolean isStockPhotoUrl(String url) {
        String lower = url.toLowerCase();
        return lower.contains("images.unsplash.com")
                || lower.contains("picsum.photos")
                || lower.contains("placehold")
                || lower.contains("via.placeholder");
    }

    private static boolean isMisleadingVenuePhoto(String title, String venue, String url) {
        if (url == null || !url.toLowerCase().contains("places.googleapis.com")) return false;
        String hay = ((title != null ? title : "") + " " + (venue != null ? venue : "")).toLowerCase();
        boolean music = hay.contains("reggae") || hay.contains("show") || hay.contains("festival")
                || hay.contains("concerto") || hay.contains("música") || hay.contains("musica")
                || hay.contains("jazz") || hay.contains("samba") || hay.contains("forró") || hay.contains("forro");
        boolean multi = hay.contains("cuca") || hay.contains("ginásio") || hay.contains("ginasio")
                || hay.contains("quadra") || hay.contains("arena") || hay.contains("estádio") || hay.contains("estadio");
        return music && multi;
    }

    private Event createSeedEvent(String id, String title, String description, String imageUrl, String city, String region, String venue, String category, int daysAhead, int hour, String merchantId) {
        Event event = new Event();
        event.setId(id);
        event.setTitle(title);
        event.setDescription(description);
        event.setImageUrl(imageUrl);
        event.setCity(city);
        event.setRegion(region);
        event.setVenue(venue);
        event.setCategory(category);
        event.setStatus(Event.STATUS_APPROVED);
        event.setStartsAt(Instant.now().plus(daysAhead, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS).plus(hour, ChronoUnit.HOURS));
        event.setActive(true);
        event.setMerchantId(merchantId);
        event.setCreatedAt(Instant.now());
        event.setUpdatedAt(Instant.now());
        return event;
    }

    public EventRecordDto toRecord(Event event, Map<String, User> merchantMap) {
        User merchant = merchantMap.get(event.getMerchantId());
        String imageUrl = event.getImageUrl();
        if (imageUrl != null && isMisleadingVenuePhoto(event.getTitle(), event.getVenue(), imageUrl)) {
            imageUrl = "";
        }
        return new EventRecordDto(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                imageUrl,
                event.getCity(),
                event.getRegion(),
                event.getVenue(),
                event.getStartsAt() != null ? event.getStartsAt().toString() : "",
                event.getActive(),
                event.getMerchantId(),
                merchant != null ? merchant.getName() : null,
                merchant != null ? merchant.getBusinessName() : null,
                event.getCreatedAt() != null ? event.getCreatedAt().toString() : "",
                event.getUpdatedAt() != null ? event.getUpdatedAt().toString() : "",
                event.getCategory() != null ? event.getCategory() : "Outros",
                event.getStatus() != null ? event.getStatus() : Event.STATUS_PENDING,
                event.getRejectionReason()
        );
    }

    private Map<String, User> userMap() {
        return userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
    }

    /** Public feed: APPROVED (+ optional active/city/region/category). */
    public List<EventRecordDto> list(String city, String region, boolean activeOnly, String category) {
        return listInternal(city, region, activeOnly, category, Event.STATUS_APPROVED);
    }

    public List<EventRecordDto> listAdmin(String city, String region, String status, String category) {
        String normalizedStatus = status == null || status.isBlank() ? null : status.trim().toUpperCase(Locale.ROOT);
        return listInternal(city, region, false, category, normalizedStatus);
    }

    private List<EventRecordDto> listInternal(
            String city,
            String region,
            boolean activeOnly,
            String category,
            String status
    ) {
        List<Event> events = eventRepository.findAllByOrderByStartsAtDesc();
        Map<String, User> merchantMap = userMap();
        String categoryFilter = category != null && !category.isBlank()
                ? EventCategories.normalize(category)
                : null;

        return events.stream()
                .filter(e -> !activeOnly || Boolean.TRUE.equals(e.getActive()))
                .filter(e -> {
                    if (status == null || status.isBlank()) return true;
                    String s = e.getStatus() != null ? e.getStatus() : Event.STATUS_PENDING;
                    return status.equalsIgnoreCase(s);
                })
                .filter(e -> {
                    if (categoryFilter == null) return true;
                    return categoryFilter.equalsIgnoreCase(
                            e.getCategory() != null ? e.getCategory() : "Outros"
                    );
                })
                .filter(e -> {
                    if (city != null && !city.isBlank()) {
                        return e.getCity() != null && e.getCity().equalsIgnoreCase(city.trim());
                    }
                    if (region != null && !region.isBlank()) {
                        return e.getRegion() != null && (
                                e.getRegion().equalsIgnoreCase(region.trim()) ||
                                e.getRegion().toLowerCase().contains(region.trim().toLowerCase()) ||
                                region.trim().toLowerCase().contains(e.getRegion().toLowerCase())
                        );
                    }
                    return true;
                })
                .map(e -> toRecord(e, merchantMap))
                .toList();
    }

    public List<EventRecordDto> listByMerchant(String merchantId) {
        List<Event> events = eventRepository.findByMerchantIdOrderByStartsAtDesc(merchantId);
        Map<String, User> merchantMap = userMap();
        return events.stream().map(e -> toRecord(e, merchantMap)).toList();
    }

    public long countPending() {
        return eventRepository.countByStatus(Event.STATUS_PENDING);
    }

    @Transactional
    public EventRecordDto create(CreateEventDto dto) {
        User creator = userRepository.findById(dto.merchantId()).orElse(null);
        if (creator == null || Boolean.TRUE.equals(creator.getGuest())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Faça login para criar um evento.");
        }

        Event event = new Event();
        event.setId(UUID.randomUUID().toString());
        event.setTitle(dto.title().trim());
        event.setDescription(dto.description().trim());
        event.setImageUrl(dto.imageUrl().trim());
        event.setCity(dto.city().trim());
        event.setRegion(dto.region().trim());
        event.setVenue(dto.venue() != null ? dto.venue().trim() : "");
        event.setCategory(EventCategories.normalize(dto.category()));
        event.setStatus(Event.STATUS_PENDING);
        event.setRejectionReason(null);
        try {
            event.setStartsAt(Instant.parse(dto.startsAt()));
        } catch (Exception e) {
            event.setStartsAt(Instant.now());
        }
        event.setActive(true);
        event.setMerchantId(dto.merchantId());
        event.setCreatedAt(Instant.now());
        event.setUpdatedAt(Instant.now());

        Event saved = eventRepository.save(event);
        return toRecord(saved, Map.of(creator.getId(), creator));
    }

    @Transactional
    public EventRecordDto update(String id, String merchantId, UpdateEventDto dto) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento não encontrado."));

        if (!event.getMerchantId().equals(merchantId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Você só pode editar seus próprios eventos.");
        }

        if (dto.title() != null && !dto.title().isBlank()) event.setTitle(dto.title().trim());
        if (dto.description() != null && !dto.description().isBlank()) event.setDescription(dto.description().trim());
        if (dto.imageUrl() != null && !dto.imageUrl().isBlank()) event.setImageUrl(dto.imageUrl().trim());
        if (dto.city() != null && !dto.city().isBlank()) event.setCity(dto.city().trim());
        if (dto.region() != null && !dto.region().isBlank()) event.setRegion(dto.region().trim());
        if (dto.venue() != null) event.setVenue(dto.venue().trim());
        if (dto.category() != null && !dto.category().isBlank()) {
            event.setCategory(EventCategories.normalize(dto.category()));
        }
        if (dto.startsAt() != null && !dto.startsAt().isBlank()) {
            try {
                event.setStartsAt(Instant.parse(dto.startsAt()));
            } catch (Exception ignored) {}
        }
        if (dto.active() != null) event.setActive(dto.active());
        // Edits from author re-queue for moderation
        if (!Event.STATUS_PENDING.equals(event.getStatus())) {
            event.setStatus(Event.STATUS_PENDING);
            event.setRejectionReason(null);
        }
        event.setUpdatedAt(Instant.now());

        Event saved = eventRepository.save(event);
        User merchant = userRepository.findById(event.getMerchantId()).orElse(null);
        return toRecord(saved, merchant != null ? Map.of(merchant.getId(), merchant) : Map.of());
    }

    @Transactional
    public EventRecordDto approve(String id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento não encontrado."));
        event.setStatus(Event.STATUS_APPROVED);
        event.setRejectionReason(null);
        event.setActive(true);
        event.setUpdatedAt(Instant.now());
        Event saved = eventRepository.save(event);
        return toRecord(saved, userMap());
    }

    @Transactional
    public EventRecordDto reject(String id, String reason) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento não encontrado."));
        event.setStatus(Event.STATUS_REJECTED);
        event.setRejectionReason(reason != null && !reason.isBlank() ? reason.trim() : null);
        event.setUpdatedAt(Instant.now());
        Event saved = eventRepository.save(event);
        return toRecord(saved, userMap());
    }

    @Transactional
    public Map<String, Object> remove(String id, String merchantId) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento não encontrado."));

        if (!event.getMerchantId().equals(merchantId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Você só pode remover seus próprios eventos.");
        }

        eventRepository.delete(event);
        return Map.of("deleted", true, "id", id);
    }
}

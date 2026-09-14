package com.unbora.api.domain.event;

import com.unbora.api.ai.GroqClient;
import com.unbora.api.ai.ImageEnrichmentService;
import com.unbora.api.ai.PromptTemplateService;
import com.unbora.api.ai.dto.AiEventDto;
import com.unbora.api.ai.dto.DiscoverEventsResult;
import com.unbora.api.common.PasswordUtil;
import com.unbora.api.domain.event.dto.EventRecordDto;
import com.unbora.api.domain.user.User;
import com.unbora.api.domain.user.UserRepository;
import com.unbora.api.kafka.KafkaEventPublisher;
import com.unbora.api.kafka.event.RecommendationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RealEventSyncService {

    private static final Logger log = LoggerFactory.getLogger(RealEventSyncService.class);

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventsService eventsService;
    private final GroqClient groqClient;
    private final ImageEnrichmentService imageEnrichmentService;
    private final PromptTemplateService promptTemplateService;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final jakarta.persistence.EntityManager entityManager;

    public RealEventSyncService(
            EventRepository eventRepository,
            UserRepository userRepository,
            EventsService eventsService,
            GroqClient groqClient,
            ImageEnrichmentService imageEnrichmentService,
            PromptTemplateService promptTemplateService,
            KafkaEventPublisher kafkaEventPublisher,
            jakarta.persistence.EntityManager entityManager
    ) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.eventsService = eventsService;
        this.groqClient = groqClient;
        this.imageEnrichmentService = imageEnrichmentService;
        this.promptTemplateService = promptTemplateService;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.entityManager = entityManager;
    }

    @Transactional
    public List<EventRecordDto> syncLiveEvents(String city, boolean clearExisting) {
        String effectiveCity = (city != null && !city.isBlank()) ? city.trim() : "Fortaleza";

        if (clearExisting) {
            long previousCount = eventRepository.count();
            eventRepository.deleteAll();
            log.info("[RealEventSync] Banco de dados de eventos limpo com sucesso. {} registros anteriores removidos.", previousCount);
        }

        // Garante o usuário curador padrão
        String curatorId = "curadoria-unbora";
        User curator = userRepository.findById(curatorId).orElse(null);
        if (curator == null) {
            curator = new User();
            curator.setId(curatorId);
            curator.setName("Curadoria Unbora");
            curator.setEmail("curadoria@unbora.com");
            curator.setGuest(false);
            curator.setPasswordHash(PasswordUtil.hashPassword("unbora123"));
            curator.setPlatform("system");
            curator.setRole("curator");
            curator.setBusinessName("Agendas & Instagram Oficial");
            curator.setCreatedAt(Instant.now());
            curator.setLastSeenAt(Instant.now());
            userRepository.save(curator);
        }

        LocalDate now = LocalDate.now();
        String dateLabel = now.format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));
        String mesAno = now.format(DateTimeFormatter.ofPattern("MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));

        // 1. Busca web ao vivo e no Instagram
        String webContext = groqClient.fetchWebContext(
                effectiveCity,
                List.of("shows agenda cultural eventos sympla instagram feiras gastronomia teatro festival"),
                mesAno
        );

        // 2. Extração estruturada via IA com prompt enriquecido
        String systemPrompt = promptTemplateService.getTemplate("system-prompt");
        String userPrompt = promptTemplateService.render("events-user-prompt", Map.of(
                "city", effectiveCity,
                "dateLabel", dateLabel,
                "webContext", webContext != null ? webContext : ""
        ));

        DiscoverEventsResult result = groqClient.callGroqJson(systemPrompt, userPrompt, DiscoverEventsResult.class, 0.3, 1600);

        List<Event> savedEvents = new ArrayList<>();
        ImageEnrichmentService.BatchSession batch = new ImageEnrichmentService.BatchSession();

        if (result != null && result.getEventos() != null && !result.getEventos().isEmpty()) {
            for (int i = 0; i < result.getEventos().size(); i++) {
                AiEventDto dto = result.getEventos().get(i);
                if (dto.getTitulo() == null || dto.getTitulo().isBlank()) continue;

                String venue = (dto.getLocal() != null && !dto.getLocal().isBlank())
                        ? dto.getLocal()
                        : effectiveCity;

                // 3. Enriquecimento de foto — URLs únicas no lote
                String photoUrl = imageEnrichmentService.fetchEventImage(
                        dto.getTitulo(),
                        venue,
                        effectiveCity,
                        dto.getTipo(),
                        dto.getVisualQuery(),
                        dto.getCategoryTag(),
                        batch
                );

                Instant startsAt = Instant.now()
                        .plus(i / 2, ChronoUnit.DAYS)
                        .truncatedTo(ChronoUnit.DAYS)
                        .plus(18 + (i % 4), ChronoUnit.HOURS);

                Event event = new Event();
                event.setId(UUID.randomUUID().toString());
                event.setTitle(dto.getTitulo().trim());
                event.setDescription(dto.getDescricao() != null ? dto.getDescricao().trim() : "Programação em " + effectiveCity);
                event.setImageUrl(photoUrl != null ? photoUrl : "");
                event.setCity(effectiveCity);
                event.setRegion("Grande " + effectiveCity);
                event.setVenue(venue);
                event.setStartsAt(startsAt);
                event.setActive(true);
                event.setMerchantId(curatorId);
                event.setCategory(EventCategories.normalize(
                        dto.getCategoryTag() != null ? dto.getCategoryTag() : dto.getTipo()
                ));
                event.setStatus(Event.STATUS_APPROVED);
                event.setCreatedAt(Instant.now());
                event.setUpdatedAt(Instant.now());

                savedEvents.add(event);
            }

            eventRepository.saveAll(savedEvents);
            log.info("[RealEventSync] {} eventos reais sincronizados e salvos no PostgreSQL para {}", savedEvents.size(), effectiveCity);
        }

        kafkaEventPublisher.publishRecommendation(new RecommendationEvent(
                "REAL_EVENTS_SYNCED",
                null,
                null,
                List.of("live_sync"),
                "Sincronização de eventos reais ao vivo",
                effectiveCity,
                savedEvents.size(),
                !savedEvents.isEmpty() ? savedEvents.get(0).getTitle() : "none",
                Instant.now()
        ));

        Map<String, User> merchantMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return savedEvents.stream()
                .map(e -> eventsService.toRecord(e, merchantMap))
                .toList();
    }
}

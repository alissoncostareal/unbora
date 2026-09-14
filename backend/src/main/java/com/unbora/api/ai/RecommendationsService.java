package com.unbora.api.ai;

import com.unbora.api.ai.dto.*;
import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.place.PlaceEmbeddingProjection;
import com.unbora.api.domain.place.PlaceEmbeddingRepository;
import com.unbora.api.kafka.KafkaEventPublisher;
import com.unbora.api.kafka.event.RecommendationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class RecommendationsService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationsService.class);

    private final GroqClient groqClient;
    private final ImageEnrichmentService imageEnrichmentService;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final GooglePlacesDiscoveryService googlePlacesDiscoveryService;
    private final PromptTemplateService promptTemplateService;
    private final PlaceEmbeddingRepository placeEmbeddingRepository;
    private final EmbeddingService embeddingService;
    private final ImageSubjectClassifier imageSubjectClassifier;
    private final PlacePhotoLinkService placePhotoLinkService;
    private final ExecutorService vectorIndexExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread thread = new Thread(r, "place-vector-index");
        thread.setDaemon(true);
        return thread;
    });

    public RecommendationsService(
            GroqClient groqClient,
            ImageEnrichmentService imageEnrichmentService,
            KafkaEventPublisher kafkaEventPublisher,
            GooglePlacesDiscoveryService googlePlacesDiscoveryService,
            PromptTemplateService promptTemplateService,
            PlaceEmbeddingRepository placeEmbeddingRepository,
            EmbeddingService embeddingService,
            ImageSubjectClassifier imageSubjectClassifier,
            PlacePhotoLinkService placePhotoLinkService
    ) {
        this.groqClient = groqClient;
        this.imageEnrichmentService = imageEnrichmentService;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.googlePlacesDiscoveryService = googlePlacesDiscoveryService;
        this.promptTemplateService = promptTemplateService;
        this.placeEmbeddingRepository = placeEmbeddingRepository;
        this.embeddingService = embeddingService;
        this.imageSubjectClassifier = imageSubjectClassifier;
        this.placePhotoLinkService = placePhotoLinkService;
    }

    public RecommendationResult recommend(RecommendDto dto) {
        String city = (dto.city() != null && !dto.city().isBlank()) ? dto.city().trim() : "Brasil";
        String country = (dto.country() != null && !dto.country().isBlank()) ? dto.country().trim() : "Brasil";
        Double lat = dto.latitude();
        Double lng = dto.longitude();
        Double radiusKm = dto.radiusKm() != null ? dto.radiusKm() : 25.0;

        LocalDate now = LocalDate.now();
        String dateLabel = now.format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));
        String mesAno = now.format(DateTimeFormatter.ofPattern("MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));

        List<String> labels = dto.activities() != null
                ? dto.activities().stream().map(ActivityItemDto::label).toList()
                : List.of();

        Map<String, GooglePlacesDiscoveryService.DiscoveredPlace> placeMap = new LinkedHashMap<>();

        // 1. RAG Semântico Híbrido no pgvector (Neon)
        try {
            String semanticQuery = (dto.humor() != null ? dto.humor() : "") + " "
                    + (dto.sentir() != null ? dto.sentir() : "") + " "
                    + String.join(" ", labels) + " " + city;
            String queryVector = embeddingService.getEmbeddingVectorString(semanticQuery);

            List<PlaceEmbeddingProjection> vectorMatches = placeEmbeddingRepository.findSimilarPlaces(city, queryVector, 25);
            if (vectorMatches.isEmpty()) {
                vectorMatches = placeEmbeddingRepository.findSimilarPlacesGlobal(queryVector, 25);
            }

            for (PlaceEmbeddingProjection vp : vectorMatches) {
                String key = vp.getId() != null ? vp.getId() : imageEnrichmentService.normalizeText(vp.getName());
                placeMap.put(key, new GooglePlacesDiscoveryService.DiscoveredPlace(
                        vp.getName(),
                        vp.getName(),
                        vp.getFormattedAddress(),
                        vp.getId(),
                        vp.getLatitude(),
                        vp.getLongitude(),
                        vp.getRating(),
                        vp.getUserRatingCount(),
                        true,
                        vp.getPrimaryType(),
                        List.of(vp.getCategoryTag() != null ? vp.getCategoryTag() : "gastronomia"),
                        vp.getGoogleMapsUri(),
                        vp.getVibeSummary(),
                        vp.getPhotoUrl()
                ));
            }
            log.info("[RAG pgvector] {} lugares recuperados por similaridade vetorial para '{}'", vectorMatches.size(), city);
        } catch (Exception e) {
            log.debug("[RAG pgvector] Erro na busca vetorial (usando fallback): {}", e.getMessage());
        }

        // 2. Descoberta Dinâmica no Google Places ao redor das Coordenadas do Usuário
        if (googlePlacesDiscoveryService.isConfigured()) {
            List<String> queries = buildTargetedPlacesQueries(dto, city);
            for (String query : queries) {
                List<GooglePlacesDiscoveryService.DiscoveredPlace> found =
                        googlePlacesDiscoveryService.searchPlaces(query, lat, lng, radiusKm, city, country, 20);
                for (GooglePlacesDiscoveryService.DiscoveredPlace p : found) {
                    String key = p.placeId() != null && !p.placeId().isBlank()
                            ? p.placeId()
                            : imageEnrichmentService.normalizeText(p.displayName());
                    placeMap.putIfAbsent(key, p);

                    // Auto-aprendizado contínuo no pgvector
                    asyncIndexPlaceVector(p, city);
                }
            }
        }

        List<GooglePlacesDiscoveryService.DiscoveredPlace> livePlaces = new ArrayList<>(placeMap.values());

        // 2. Contexto da Web (Agenda local e Instagram ao vivo)
        String webContext = groqClient.fetchWebContext(city, labels, mesAno);

        // 3. Grounding amplo — lista completa para a IA (e para merge posterior)
        StringBuilder groundingContext = new StringBuilder();
        if (!livePlaces.isEmpty()) {
            groundingContext.append("\n=== CANDIDATOS VIVOS DO GOOGLE MAPS (Use preferencialmente estes) ===\n");
            int count = 0;
            for (GooglePlacesDiscoveryService.DiscoveredPlace p : livePlaces) {
                if (count++ >= 24) break;
                groundingContext.append("- Nome: ").append(p.displayName())
                        .append(" | Endereço: ").append(p.formattedAddress())
                        .append(" | Nota: ").append(p.rating() != null ? p.rating() : 4.7)
                        .append(" | Avaliações: ").append(p.userRatingCount() != null ? p.userRatingCount() : 0)
                        .append(" | Tipo: ").append(p.primaryType())
                        .append("\n");
            }
            groundingContext.append("=== FIM DOS CANDIDATOS DO GOOGLE MAPS ===\n");
            groundingContext.append("INSTRUÇÃO: inclua TODOS estes candidatos na lista de lugares.\n");
        }

        StringBuilder activitiesText = new StringBuilder();
        if (dto.activities() != null) {
            for (ActivityItemDto a : dto.activities()) {
                activitiesText.append("- ").append(a.label()).append(": ").append(a.searchHint()).append("\n");
            }
        }

        // 4. Renderização do Prompt desacoplado
        String systemPrompt = promptTemplateService.getTemplate("system-prompt");
        String userPrompt = promptTemplateService.render("recommendation-user-prompt", Map.of(
                "city", city,
                "country", country,
                "latitude", lat != null ? lat.toString() : "N/A",
                "longitude", lng != null ? lng.toString() : "N/A",
                "dateLabel", dateLabel,
                "humor", dto.humor() != null ? dto.humor() : "Animado",
                "sentir", dto.sentir() != null ? dto.sentir() : "Alegre",
                "activitiesText", activitiesText.toString(),
                "groundingContext", groundingContext.toString(),
                "webContext", webContext != null ? webContext : ""
        ));

        RecommendationResult result;
        try {
            boolean hasLive = !livePlaces.isEmpty();
            result = groqClient.callGroqJson(
                    systemPrompt,
                    userPrompt,
                    RecommendationResult.class,
                    0.3,
                    hasLive ? 1200 : 3500,
                    hasLive ? Duration.ofSeconds(12) : Duration.ofSeconds(40),
                    hasLive ? 1 : Integer.MAX_VALUE
            );
        } catch (Exception e) {
            log.warn("[Recommend] Groq falhou — lista completa via Google Places: {}", e.getMessage());
            result = recommendationFromLivePlaces(
                    "Sugestões para o seu humor",
                    "Lista completa em " + city,
                    livePlaces
            );
        }
        if (result == null || result.getLugares() == null || result.getLugares().isEmpty()) {
            result = recommendationFromLivePlaces(
                    "Sugestões para o seu humor",
                    "Lista completa em " + city,
                    livePlaces
            );
        }
        RecommendationResult enriched = enrichPlaces(result, city, country, lat, lng, livePlaces);
        enriched = appendMissingLivePlaces(enriched, livePlaces, city);
        fillMissingMapsPhotos(enriched, city, lat, lng);

        String topPlace = enriched.getLugares() != null && !enriched.getLugares().isEmpty()
                ? enriched.getLugares().get(0).getNome()
                : "none";

        resolveOutgoingPhotos(enriched);

        kafkaEventPublisher.publishRecommendation(new RecommendationEvent(
                "RECOMMENDATION_GENERATED",
                dto.humor(),
                dto.sentir(),
                labels,
                null,
                city,
                enriched.getLugares() != null ? enriched.getLugares().size() : 0,
                topPlace,
                Instant.now()
        ));

        return enriched;
    }

    public RecommendationResult search(SearchDto dto) {
        String city = (dto.city() != null && !dto.city().isBlank()) ? dto.city().trim() : "Brasil";
        String country = (dto.country() != null && !dto.country().isBlank()) ? dto.country().trim() : "Brasil";
        Double lat = dto.latitude();
        Double lng = dto.longitude();

        LocalDate now = LocalDate.now();
        String dateLabel = now.format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));
        String mesAno = now.format(DateTimeFormatter.ofPattern("MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));

        Map<String, GooglePlacesDiscoveryService.DiscoveredPlace> placeMap = new LinkedHashMap<>();

        // 1. RAG Semântico Híbrido no pgvector (Neon)
        try {
            String queryVector = embeddingService.getEmbeddingVectorString(dto.query() + " " + city);
            List<PlaceEmbeddingProjection> vectorMatches = placeEmbeddingRepository.findSimilarPlaces(city, queryVector, 25);
            if (vectorMatches.isEmpty()) {
                vectorMatches = placeEmbeddingRepository.findSimilarPlacesGlobal(queryVector, 25);
            }
            for (PlaceEmbeddingProjection vp : vectorMatches) {
                String key = vp.getId() != null ? vp.getId() : imageEnrichmentService.normalizeText(vp.getName());
                placeMap.put(key, new GooglePlacesDiscoveryService.DiscoveredPlace(
                        vp.getName(),
                        vp.getName(),
                        vp.getFormattedAddress(),
                        vp.getId(),
                        vp.getLatitude(),
                        vp.getLongitude(),
                        vp.getRating(),
                        vp.getUserRatingCount(),
                        true,
                        vp.getPrimaryType(),
                        List.of(vp.getCategoryTag() != null ? vp.getCategoryTag() : "gastronomia"),
                        vp.getGoogleMapsUri(),
                        vp.getVibeSummary(),
                        vp.getPhotoUrl()
                ));
            }
            log.info("[RAG pgvector Search] {} lugares recuperados para '{}'", vectorMatches.size(), dto.query());
        } catch (Exception e) {
            log.debug("[RAG pgvector Search] Erro na busca vetorial: {}", e.getMessage());
        }

        // 2. Google Places Discovery — queries amplas (ex.: restaurante)
        if (googlePlacesDiscoveryService.isConfigured()) {
            List<String> searchQueries = buildSearchPlacesQueries(dto.query(), city);
            for (String q : searchQueries) {
                List<GooglePlacesDiscoveryService.DiscoveredPlace> found =
                        googlePlacesDiscoveryService.searchPlaces(q, lat, lng, 35.0, city, country, 20);
                for (GooglePlacesDiscoveryService.DiscoveredPlace p : found) {
                    String key = p.placeId() != null && !p.placeId().isBlank()
                            ? p.placeId()
                            : imageEnrichmentService.normalizeText(p.displayName());
                    placeMap.putIfAbsent(key, p);
                    asyncIndexPlaceVector(p, city);
                }
            }
        }
        List<GooglePlacesDiscoveryService.DiscoveredPlace> livePlaces = new ArrayList<>(placeMap.values());

        String webContext = groqClient.fetchWebContext(city, List.of(dto.query()), mesAno);
        if (webContext != null && webContext.length() > 900) {
            webContext = webContext.substring(0, 900);
        }

        StringBuilder groundingContext = new StringBuilder();
        if (!livePlaces.isEmpty()) {
            groundingContext.append("\n=== CANDIDATOS VIVOS DO GOOGLE MAPS ===\n");
            int count = 0;
            for (GooglePlacesDiscoveryService.DiscoveredPlace p : livePlaces) {
                if (count++ >= 8) break;
                groundingContext.append("- ").append(p.displayName()).append(" (").append(p.formattedAddress()).append(")")
                        .append(" | Nota: ").append(p.rating() != null ? p.rating() : 4.7)
                        .append(" | Avaliações: ").append(p.userRatingCount() != null ? p.userRatingCount() : 0)
                        .append("\n");
            }
            groundingContext.append("=== FIM DOS CANDIDATOS ===\n");
            groundingContext.append("INSTRUÇÃO: inclua estes candidatos na lista de lugares.\n");
        }

        String systemPrompt = promptTemplateService.getTemplate("system-prompt");
        String userPrompt = promptTemplateService.render("search-user-prompt", Map.of(
                "city", city,
                "country", country,
                "dateLabel", dateLabel,
                "query", dto.query(),
                "groundingContext", groundingContext.toString(),
                "webContext", webContext != null ? webContext : ""
        ));

        RecommendationResult result;
        try {
            // Com lugares reais, um modelo e orçamento curto. A cadeia completa estoura o timeout do app.
            boolean hasLive = !livePlaces.isEmpty();
            result = groqClient.callGroqJson(
                    systemPrompt,
                    userPrompt,
                    RecommendationResult.class,
                    0.3,
                    hasLive ? 1200 : 3500,
                    hasLive ? Duration.ofSeconds(12) : Duration.ofSeconds(40),
                    hasLive ? 1 : Integer.MAX_VALUE
            );
        } catch (Exception e) {
            log.warn("[Search] Groq falhou — lista completa via Google Places: {}", e.getMessage());
            result = recommendationFromLivePlaces(
                    "Busca: " + dto.query(),
                    "Lista completa em " + city,
                    livePlaces
            );
        }
        if (result == null || result.getLugares() == null || result.getLugares().isEmpty()) {
            result = recommendationFromLivePlaces(
                    "Busca: " + dto.query(),
                    "Lista completa em " + city,
                    livePlaces
            );
        }
        RecommendationResult enriched = enrichPlaces(result, city, country, lat, lng, livePlaces);
        enriched = appendMissingLivePlaces(enriched, livePlaces, city);
        fillMissingMapsPhotos(enriched, city, lat, lng);

        String topPlace = enriched.getLugares() != null && !enriched.getLugares().isEmpty()
                ? enriched.getLugares().get(0).getNome()
                : "none";

        resolveOutgoingPhotos(enriched);

        kafkaEventPublisher.publishRecommendation(new RecommendationEvent(
                "SEARCH_PERFORMED",
                null,
                null,
                List.of(),
                dto.query(),
                city,
                enriched.getLugares() != null ? enriched.getLugares().size() : 0,
                topPlace,
                Instant.now()
        ));

        return enriched;
    }

    public DiscoverEventsResult discoverEvents(DiscoverEventsDto dto) {
        String city = (dto != null && dto.city() != null && !dto.city().isBlank()) ? dto.city().trim() : "Fortaleza";
        LocalDate now = LocalDate.now();
        String dateLabel = now.format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));
        String mesAno = now.format(DateTimeFormatter.ofPattern("MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));

        String webContext = groqClient.fetchWebContext(city, List.of("agenda cultural shows eventos feiras gastronomia festival"), mesAno);

        String systemPrompt = promptTemplateService.getTemplate("system-prompt");
        String userPrompt = promptTemplateService.render("events-user-prompt", Map.of(
                "city", city,
                "dateLabel", dateLabel,
                "webContext", webContext != null ? webContext : ""
        ));

        DiscoverEventsResult result = groqClient.callGroqJson(systemPrompt, userPrompt, DiscoverEventsResult.class, 0.35, 1600);
        DiscoverEventsResult enriched = enrichEvents(result, city);

        String topEvent = enriched.getEventos() != null && !enriched.getEventos().isEmpty()
                ? enriched.getEventos().get(0).getTitulo()
                : "none";

        kafkaEventPublisher.publishRecommendation(new RecommendationEvent(
                "EVENTS_DISCOVERED",
                null,
                null,
                List.of(),
                null,
                city,
                enriched.getEventos() != null ? enriched.getEventos().size() : 0,
                topEvent,
                Instant.now()
        ));

        return enriched;
    }

    public void processFeedback(RecommendationFeedbackDto feedback) {
        Integer stars = feedback.stars();
        if ("RATE".equalsIgnoreCase(feedback.action()) && (stars == null || stars < 1 || stars > 5)) {
            throw ApiException.badRequest("Avaliação deve ter de 1 a 5 estrelas");
        }

        log.info("[AI Feedback] Feedback recebido para '{}': Ação={}, Estrelas={}, Humor={}, Sentir={}, PlaceId={}",
                feedback.placeName(), feedback.action(), stars, feedback.humor(), feedback.sentir(), feedback.placeId());

        String comment = feedback.comment();
        if (stars != null) {
            String starTag = "stars=" + stars;
            comment = comment == null || comment.isBlank() ? starTag : starTag + " | " + comment;
        }
        if (feedback.placeId() != null && !feedback.placeId().isBlank()) {
            String idTag = "placeId=" + feedback.placeId();
            comment = comment == null || comment.isBlank() ? idTag : comment + " | " + idTag;
        }

        kafkaEventPublisher.publishRecommendation(new RecommendationEvent(
                "FEEDBACK_" + (feedback.action() != null ? feedback.action().toUpperCase() : "LIKE"),
                feedback.humor(),
                feedback.sentir(),
                List.of(feedback.categoryTag() != null ? feedback.categoryTag() : ""),
                comment,
                "Global",
                1,
                feedback.placeName(),
                Instant.now()
        ));
    }

    private RecommendationResult enrichPlaces(
            RecommendationResult result,
            String city,
            String country,
            Double latitude,
            Double longitude,
            List<GooglePlacesDiscoveryService.DiscoveredPlace> livePlaces
    ) {
        if (result == null || result.getLugares() == null) {
            return new RecommendationResult("Destaques para você", "Sugestões para seu momento", List.of());
        }

        List<PlaceDto> enriched = new ArrayList<>();
        ImageEnrichmentService.BatchSession batch = new ImageEnrichmentService.BatchSession();
        for (PlaceDto place : result.getLugares()) {
            String address = place.getEndereco() != null ? place.getEndereco() : city + ", " + country;

            GooglePlacesDiscoveryService.DiscoveredPlace matched = null;
            if (livePlaces != null) {
                for (GooglePlacesDiscoveryService.DiscoveredPlace lp : livePlaces) {
                    if (imageEnrichmentService.calculateNameSimilarity(place.getNome(), lp.displayName()) >= 0.4) {
                        matched = lp;
                        break;
                    }
                }
            }

            ImageSubjectClassifier.Kind imageKind = imageSubjectClassifier.classify(
                    place.getNome(),
                    place.getTipo(),
                    place.getCategoryTag()
            );
            // Venue encontrado no Google Maps → sempre foto do Maps (nunca tema/Unsplash).
            boolean culturalEvent = matched == null
                    && imageKind == ImageSubjectClassifier.Kind.CULTURAL_EVENT;

            if (matched != null) {
                if (matched.googleMapsUri() != null && !matched.googleMapsUri().isBlank()) {
                    place.setGoogleMapsUri(matched.googleMapsUri());
                }
                if (matched.placeId() != null) place.setPlaceId(matched.placeId());
                if (matched.latitude() != null) place.setLatitude(matched.latitude());
                if (matched.longitude() != null) place.setLongitude(matched.longitude());
                if (matched.rating() != null && matched.rating() > 0) place.setNota(matched.rating());
                if (matched.openNow() != null) place.setOpenNow(matched.openNow());
                if (matched.userRatingCount() != null) place.setUserRatingCount(matched.userRatingCount());
                if (place.getTipo() == null || place.getTipo().isBlank()) {
                    place.setTipo(humanizePlaceType(matched.primaryType()));
                }
                if (place.getCategoryTag() == null || place.getCategoryTag().isBlank()) {
                    place.setCategoryTag(categoryForPlaceType(matched.primaryType()));
                }
            }

            if (culturalEvent) {
                place.setImagem(null);
                String photo = imageEnrichmentService.fetchEventImage(
                        place.getNome(),
                        address,
                        city,
                        place.getTipo(),
                        place.getVisualQuery(),
                        place.getCategoryTag(),
                        batch
                );
                place.setImagem(photo);
                place.setImagemIlustrativa(
                        photo != null && imageEnrichmentService.isIllustrativeImageUrl(photo)
                );
            } else {
                applyMapsPhoto(place, matched, address, city, latitude, longitude, batch);
            }

            if (place.getNota() == null) place.setNota(4.8);
            if (place.getIcone() == null || place.getIcone().isBlank()) place.setIcone("📍");
            enriched.add(place);
        }

        result.setLugares(enriched);
        return result;
    }

    /** Lugares físicos: só Google Maps. Descarta Unsplash/tema da IA. */
    private void applyMapsPhoto(
            PlaceDto place,
            GooglePlacesDiscoveryService.DiscoveredPlace matched,
            String address,
            String city,
            Double latitude,
            Double longitude,
            ImageEnrichmentService.BatchSession batch
    ) {
        place.setImagemIlustrativa(false);

        String mapsPhoto = null;
        if (matched != null && matched.photoUrl() != null && !matched.photoUrl().isBlank()) {
            batch.claim(matched.photoUrl());
            mapsPhoto = matched.photoUrl();
        }

        if (!isGoogleMapsPhotoUrl(mapsPhoto)) {
            String fetched = imageEnrichmentService.fetchPlaceImage(
                    place.getNome(),
                    address,
                    place.getTipo(),
                    place.getVisualQuery(),
                    place.getCategoryTag(),
                    city,
                    latitude != null ? latitude : place.getLatitude(),
                    longitude != null ? longitude : place.getLongitude(),
                    batch
            );
            if (isGoogleMapsPhotoUrl(fetched)) {
                mapsPhoto = fetched;
            } else {
                mapsPhoto = null;
            }
        }

        place.setImagem(mapsPhoto);
        place.setImagemIlustrativa(false);
    }

    private static boolean isGoogleMapsPhotoUrl(String url) {
        if (url == null || url.isBlank()) return false;
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.contains("images.unsplash.com") || lower.contains("picsum.photos")) return false;
        return lower.contains("places.googleapis.com") || lower.contains("googleusercontent.com");
    }

    /** Completa lugares ainda sem foto do Maps (ex.: anexados depois do enrich). */
    private void fillMissingMapsPhotos(
            RecommendationResult result,
            String city,
            Double latitude,
            Double longitude
    ) {
        if (result == null || result.getLugares() == null || result.getLugares().isEmpty()) return;
        ImageEnrichmentService.BatchSession batch = new ImageEnrichmentService.BatchSession();
        for (PlaceDto place : result.getLugares()) {
            if (isGoogleMapsPhotoUrl(place.getImagem())) {
                batch.claim(place.getImagem());
            }
        }
        for (PlaceDto place : result.getLugares()) {
            if (isGoogleMapsPhotoUrl(place.getImagem())) continue;

            ImageSubjectClassifier.Kind kind = imageSubjectClassifier.classify(
                    place.getNome(), place.getTipo(), place.getCategoryTag());
            // Eventos com arte temática já resolvida — não sobrescreve com Maps.
            if (kind == ImageSubjectClassifier.Kind.CULTURAL_EVENT
                    && Boolean.TRUE.equals(place.getImagemIlustrativa())) {
                continue;
            }
            if (kind == ImageSubjectClassifier.Kind.CULTURAL_EVENT
                    && place.getPlaceId() == null
                    && !isGoogleMapsPhotoUrl(place.getImagem())
                    && place.getImagem() != null
                    && !place.getImagem().isBlank()) {
                continue;
            }

            String address = place.getEndereco() != null ? place.getEndereco() : city;
            applyMapsPhoto(place, null, address, city, latitude, longitude, batch);
        }
    }

    private DiscoverEventsResult enrichEvents(DiscoverEventsResult result, String city) {
        if (result == null || result.getEventos() == null) {
            return new DiscoverEventsResult("Agenda em " + city, "Sugestões da IA", List.of());
        }

        ImageEnrichmentService.BatchSession batch = new ImageEnrichmentService.BatchSession();
        List<AiEventDto> enriched = new ArrayList<>();
        for (AiEventDto event : result.getEventos()) {
            String photo = imageEnrichmentService.fetchEventImage(
                    event.getTitulo(),
                    event.getLocal(),
                    city,
                    event.getTipo(),
                    event.getVisualQuery(),
                    event.getCategoryTag(),
                    batch
            );
            event.setImagem(photo);
            event.setImagemIlustrativa(
                    photo != null && imageEnrichmentService.isIllustrativeImageUrl(photo)
            );
            enriched.add(event);
        }

        result.setEventos(enriched);
        return result;
    }

    private List<String> buildTargetedPlacesQueries(RecommendDto dto, String city) {
        List<String> queries = new ArrayList<>();

        if (dto.activities() != null && !dto.activities().isEmpty()) {
            for (ActivityItemDto act : dto.activities()) {
                String label = act.label() != null ? act.label().toLowerCase() : "";
                if (label.contains("restaurante") || label.contains("gastronomia") || label.contains("comida")) {
                    queries.add("melhores restaurantes em " + city);
                    queries.add("restaurantes mais famosos e tradicionais em " + city);
                    queries.add("restaurantes bem avaliados em " + city);
                    queries.add("bistrôs e restaurantes contemporâneos em " + city);
                } else if (label.contains("bar") || label.contains("drink") || label.contains("pub")) {
                    queries.add("melhores bares pubs e gastrobares em " + city);
                    queries.add("bares bem avaliados em " + city);
                } else if (label.contains("café") || label.contains("cafe") || label.contains("brunch")) {
                    queries.add("melhores cafeterias e cafés especiais em " + city);
                    queries.add("cafés bem avaliados em " + city);
                } else if (label.contains("praia") || label.contains("beach")) {
                    queries.add("melhores barracas de praia e beach clubs em " + city);
                } else if (label.contains("cultura") || label.contains("arte") || label.contains("show")) {
                    queries.add("principais pontos turisticos centros culturais e teatros em " + city);
                } else if (label.contains("ar livre") || label.contains("parque") || label.contains("natureza")) {
                    queries.add("melhores parques praças e passeios em " + city);
                } else if (act.searchHint() != null && !act.searchHint().isBlank()) {
                    queries.add(act.searchHint() + " em " + city);
                } else {
                    queries.add(act.label() + " em " + city);
                }
            }
        }

        if (queries.isEmpty()) {
            queries.add("melhores restaurantes e bares em " + city);
            queries.add("restaurantes mais famosos e tradicionais em " + city);
            queries.add("restaurantes bem avaliados em " + city);
        } else if (queries.stream().noneMatch(q -> q.contains("famosos e tradicionais"))) {
            queries.add("restaurantes mais famosos e tradicionais em " + city);
        }

        String sentir = dto.sentir() != null ? dto.sentir().toLowerCase() : "";
        if (sentir.contains("romance") || sentir.contains("intimista")) {
            queries.add("restaurantes romanticos intimistas em " + city);
        } else if (sentir.contains("energia") || sentir.contains("agito") || sentir.contains("festa")) {
            queries.add("bares com musica ao vivo e agito em " + city);
        }

        return queries.stream().distinct().limit(8).toList();
    }

    private List<String> buildSearchPlacesQueries(String query, String city) {
        String q = query != null ? query.trim() : "";
        String lower = q.toLowerCase(Locale.ROOT);
        List<String> queries = new ArrayList<>();
        queries.add(q);
        queries.add(q + " em " + city);
        queries.add("melhores " + q + " em " + city);
        queries.add(q + " bem avaliados em " + city);
        queries.add(q + " famosos em " + city);

        if (lower.contains("restaurante") || lower.equals("comida") || lower.contains("gastronom")) {
            queries.add("restaurantes em " + city);
            queries.add("restaurantes tradicionais em " + city);
            queries.add("bistrôs em " + city);
            queries.add("restaurantes contemporâneos em " + city);
        } else if (lower.contains("bar") || lower.contains("pub")) {
            queries.add("bares em " + city);
            queries.add("pubs e gastrobares em " + city);
        } else if (lower.contains("café") || lower.contains("cafe")) {
            queries.add("cafeterias em " + city);
            queries.add("cafés especiais em " + city);
        }

        return queries.stream().distinct().limit(8).toList();
    }

    /** Monta resultado só com Places quando a IA falha ou devolve lista vazia. */
    private RecommendationResult recommendationFromLivePlaces(
            String title,
            String subtitle,
            List<GooglePlacesDiscoveryService.DiscoveredPlace> livePlaces
    ) {
        List<PlaceDto> lugares = new ArrayList<>();
        if (livePlaces != null) {
            int i = 0;
            for (GooglePlacesDiscoveryService.DiscoveredPlace p : livePlaces) {
                if (i >= 24) break;
                lugares.add(toPlaceDto(p, i == 0));
                i++;
            }
        }
        return new RecommendationResult(title, subtitle, lugares);
    }

    /**
     * Completa a lista da IA com candidatos do Google Places que faltaram
     * (JSON truncado / modelo resumiu demais).
     */
    private RecommendationResult appendMissingLivePlaces(
            RecommendationResult result,
            List<GooglePlacesDiscoveryService.DiscoveredPlace> livePlaces,
            String city
    ) {
        if (result == null) {
            return recommendationFromLivePlaces("Sugestões", "Lista em " + city, livePlaces);
        }
        if (livePlaces == null || livePlaces.isEmpty()) {
            return result;
        }

        List<PlaceDto> current = result.getLugares() != null
                ? new ArrayList<>(result.getLugares())
                : new ArrayList<>();

        for (GooglePlacesDiscoveryService.DiscoveredPlace lp : livePlaces) {
            if (current.size() >= 24) break;
            boolean already = false;
            for (PlaceDto existing : current) {
                if (imageEnrichmentService.calculateNameSimilarity(existing.getNome(), lp.displayName()) >= 0.45) {
                    already = true;
                    break;
                }
            }
            if (!already) {
                current.add(toPlaceDto(lp, false));
            }
        }

        if (current.size() > 24) {
            current = new ArrayList<>(current.subList(0, 24));
        }

        result.setLugares(current);
        if (result.getSubtitulo() == null || result.getSubtitulo().isBlank()) {
            result.setSubtitulo(current.size() + " opções em " + city);
        }
        log.info("[Places] Lista completa: {} lugares (IA + Google Maps)", current.size());
        return result;
    }

    private PlaceDto toPlaceDto(GooglePlacesDiscoveryService.DiscoveredPlace p, boolean destaque) {
        PlaceDto place = new PlaceDto();
        place.setNome(p.displayName());
        place.setTipo(humanizePlaceType(p.primaryType()));
        place.setIcone(emojiForPlaceType(p.primaryType()));
        place.setEndereco(p.formattedAddress());
        place.setNota(p.rating() != null && p.rating() > 0 ? p.rating() : 4.5);
        place.setDescricao(p.editorialSummary() != null && !p.editorialSummary().isBlank()
                ? p.editorialSummary()
                : "Opção real encontrada no Google Maps.");
        place.setDestaque(destaque);
        place.setImagem(p.photoUrl());
        place.setVisualQuery(p.displayName());
        place.setCategoryTag(categoryForPlaceType(p.primaryType()));
        place.setGoogleMapsUri(p.googleMapsUri());
        place.setPlaceId(p.placeId());
        place.setLatitude(p.latitude());
        place.setLongitude(p.longitude());
        place.setOpenNow(p.openNow());
        place.setUserRatingCount(p.userRatingCount());
        return place;
    }

    private static String humanizePlaceType(String primaryType) {
        if (primaryType == null || primaryType.isBlank()) return "Lugar";
        String t = primaryType.toLowerCase(Locale.ROOT);
        if (t.contains("restaurant")) return "Restaurante";
        if (t.contains("cafe") || t.contains("coffee")) return "Café";
        if (t.contains("bar") || t.contains("pub")) return "Bar";
        if (t.contains("park")) return "Parque";
        if (t.contains("museum") || t.contains("cultural")) return "Cultural";
        if (t.contains("beach")) return "Praia";
        return primaryType.replace('_', ' ');
    }

    private static String emojiForPlaceType(String primaryType) {
        if (primaryType == null) return "📍";
        String t = primaryType.toLowerCase(Locale.ROOT);
        if (t.contains("restaurant")) return "🍽️";
        if (t.contains("cafe") || t.contains("coffee")) return "☕";
        if (t.contains("bar") || t.contains("pub")) return "🍸";
        if (t.contains("park")) return "🌳";
        if (t.contains("beach")) return "🏖️";
        return "📍";
    }

    private static String categoryForPlaceType(String primaryType) {
        if (primaryType == null) return "gastronomia";
        String t = primaryType.toLowerCase(Locale.ROOT);
        if (t.contains("bar") || t.contains("pub") || t.contains("night")) return "bar";
        if (t.contains("park") || t.contains("natural")) return "natureza";
        if (t.contains("beach")) return "praia";
        if (t.contains("museum") || t.contains("cultural") || t.contains("theater")) return "cultura";
        return "gastronomia";
    }

    private void resolveOutgoingPhotos(RecommendationResult result) {
        if (result == null || result.getLugares() == null || result.getLugares().isEmpty()) return;
        List<CompletableFuture<Void>> jobs = new ArrayList<>();
        for (PlaceDto place : result.getLugares()) {
            String url = place.getImagem();
            if (url == null || url.isBlank()) continue;
            if (!url.contains("places.googleapis.com")) continue;
            jobs.add(CompletableFuture.runAsync(() -> {
                String direct = googlePlacesDiscoveryService.resolveDirectPhotoUrl(url);
                if (direct != null && !direct.isBlank() && !direct.contains("places.googleapis.com")) {
                    place.setImagem(direct);
                }
            }));
        }
        if (!jobs.isEmpty()) {
            try {
                CompletableFuture.allOf(jobs.toArray(CompletableFuture[]::new)).get(8, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("[Photos] Tempo esgotado ao resolver fotos do Google Places: {}", e.getMessage());
            }
        }
        // URLs curtas para o app Android (evita Image falhar em ?src= gigante)
        for (PlaceDto place : result.getLugares()) {
            String url = place.getImagem();
            if (url == null || url.isBlank()) continue;
            if (url.startsWith("/api/media/p/")) continue;
            if (isGoogleMapsPhotoUrl(url) || url.contains("images.unsplash.com")) {
                place.setImagem(placePhotoLinkService.toAppPath(url));
            }
        }
    }

    private void asyncIndexPlaceVector(GooglePlacesDiscoveryService.DiscoveredPlace p, String city) {
        if (p == null || p.displayName() == null || p.displayName().isBlank()) return;
        vectorIndexExecutor.submit(() -> indexPlaceVector(p, city));
    }

    private void indexPlaceVector(GooglePlacesDiscoveryService.DiscoveredPlace p, String city) {
        try {
            String dna = p.displayName() + " em " + city + ". "
                    + (p.editorialSummary() != null ? p.editorialSummary() : (p.primaryType() != null ? p.primaryType() : "Lugar"))
                    + " " + (p.formattedAddress() != null ? p.formattedAddress() : "");
            String vector = embeddingService.getEmbeddingVectorString(dna);
            placeEmbeddingRepository.upsertPlaceVector(
                    p.placeId() != null && !p.placeId().isBlank() ? p.placeId() : imageEnrichmentService.normalizeText(p.displayName()),
                    p.displayName(),
                    city,
                    p.primaryType(),
                    p.primaryType(),
                    p.formattedAddress(),
                    p.latitude(),
                    p.longitude(),
                    p.rating(),
                    p.userRatingCount(),
                    p.googleMapsUri(),
                    p.photoUrl(),
                    dna,
                    vector
            );
        } catch (Exception ignored) {}
    }
}

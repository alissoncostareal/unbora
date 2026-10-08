package com.unbora.api.ai;

import com.unbora.api.ai.dto.*;
import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.place.DismissedPlace;
import com.unbora.api.domain.place.DismissedPlaceRepository;
import com.unbora.api.domain.place.PlaceEmbeddingProjection;
import com.unbora.api.domain.place.PlaceEmbeddingRepository;
import com.unbora.api.kafka.KafkaEventPublisher;
import com.unbora.api.kafka.event.RecommendationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
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
    private final CityAnchor cityAnchor;
    private final DismissedPlaceRepository dismissedPlaceRepository;
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
            PlacePhotoLinkService placePhotoLinkService,
            CityAnchor cityAnchor,
            DismissedPlaceRepository dismissedPlaceRepository
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
        this.cityAnchor = cityAnchor;
        this.dismissedPlaceRepository = dismissedPlaceRepository;
    }

    public RecommendationResult recommend(RecommendDto dto) {
        String city = (dto.city() != null && !dto.city().isBlank()) ? dto.city().trim() : "Brasil";
        String country = (dto.country() != null && !dto.country().isBlank()) ? dto.country().trim() : "Brasil";
        Double radiusKm = dto.radiusKm() != null ? dto.radiusKm() : 8.0;
        CityAnchor.Center center = cityAnchor.resolve(city, dto.region(), country, dto.latitude(), dto.longitude());
        Double lat = center != null ? center.latitude() : dto.latitude();
        Double lng = center != null ? center.longitude() : dto.longitude();
        Set<String> dismissed = loadDismissed(dto.userId());

        LocalDate now = LocalDate.now();
        String dateLabel = now.format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));
        String mesAno = now.format(DateTimeFormatter.ofPattern("MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));

        List<String> labels = dto.activities() != null
                ? dto.activities().stream().map(ActivityItemDto::label).toList()
                : List.of();

        Map<String, GooglePlacesDiscoveryService.DiscoveredPlace> placeMap = new LinkedHashMap<>();
        Double budgetReais = budgetCeiling(dto.sentir());

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
                }
            }
        }

        keepInCity(placeMap, center, radiusKm, city, dismissed, dto.activities(), budgetReais);
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
            groundingContext.append("INSTRUÇÃO: use somente estes candidatos. Eles já estão em ")
                    .append(city)
                    .append(", no raio e no filtro escolhidos. Não acrescente outra categoria nem outra cidade.\n");
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
        retainInCity(enriched, center, radiusKm, city, dismissed, dto.activities(), budgetReais);
        fillMissingMapsPhotos(enriched, city, lat, lng);
        ensurePhotographedPlaces(enriched, livePlaces);

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
        CityAnchor.Center center = cityAnchor.resolve(city, dto.region(), country, dto.latitude(), dto.longitude());
        Double lat = center != null ? center.latitude() : dto.latitude();
        Double lng = center != null ? center.longitude() : dto.longitude();
        double radiusKm = 25.0;
        Set<String> dismissed = loadDismissed(dto.userId());

        LocalDate now = LocalDate.now();
        String dateLabel = now.format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));
        String mesAno = now.format(DateTimeFormatter.ofPattern("MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR")));

        Map<String, GooglePlacesDiscoveryService.DiscoveredPlace> placeMap = new LinkedHashMap<>();

        if (googlePlacesDiscoveryService.isConfigured()) {
            List<String> searchQueries = buildSearchPlacesQueries(dto.query(), city);
            for (String q : searchQueries) {
                List<GooglePlacesDiscoveryService.DiscoveredPlace> found =
                        googlePlacesDiscoveryService.searchPlaces(q, lat, lng, radiusKm, city, country, 20);
                for (GooglePlacesDiscoveryService.DiscoveredPlace p : found) {
                    String key = p.placeId() != null && !p.placeId().isBlank()
                            ? p.placeId()
                            : imageEnrichmentService.normalizeText(p.displayName());
                    placeMap.putIfAbsent(key, p);
                }
            }
        }
        keepInCity(placeMap, center, radiusKm, city, dismissed, null, null);
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
        retainInCity(enriched, center, radiusKm, city, dismissed, null, null);
        fillMissingMapsPhotos(enriched, city, lat, lng);
        ensurePhotographedPlaces(enriched, livePlaces);

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
        if ("DISLIKE".equalsIgnoreCase(feedback.action())) {
            rememberDismissal(feedback.userId(), feedback.placeId(), feedback.placeName());
        }

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

    public List<String> dismissedKeys(String userId) {
        return new ArrayList<>(loadDismissed(userId));
    }

    private Set<String> loadDismissed(String userId) {
        if (userId == null || userId.isBlank()) return Set.of();
        Set<String> keys = new HashSet<>();
        for (DismissedPlace row : dismissedPlaceRepository.findByUserId(userId.trim())) {
            if (row.getPlaceKey() != null && !row.getPlaceKey().isBlank()) keys.add(row.getPlaceKey());
        }
        return keys;
    }

    private void rememberDismissal(String userId, String placeId, String placeName) {
        if (userId == null || userId.isBlank()) return;
        String owner = userId.trim();
        if (placeId != null && !placeId.isBlank()) saveDismissal(owner, placeId.trim(), placeName);
        if (placeName != null && !placeName.isBlank()) saveDismissal(owner, placeName.trim().toLowerCase(Locale.ROOT), placeName);
    }

    private void saveDismissal(String userId, String placeKey, String placeName) {
        if (dismissedPlaceRepository.existsByUserIdAndPlaceKey(userId, placeKey)) return;
        DismissedPlace row = new DismissedPlace();
        row.setId(UUID.randomUUID().toString());
        row.setUserId(userId);
        row.setPlaceKey(placeKey);
        row.setPlaceName(placeName);
        row.setCreatedAt(Instant.now());
        dismissedPlaceRepository.save(row);
    }

    private void keepInCity(
            Map<String, GooglePlacesDiscoveryService.DiscoveredPlace> placeMap,
            CityAnchor.Center center,
            double radiusKm,
            String city,
            Set<String> dismissed,
            List<ActivityItemDto> activities,
            Double budgetReais
    ) {
        placeMap.entrySet().removeIf(entry -> {
            GooglePlacesDiscoveryService.DiscoveredPlace place = entry.getValue();
            if (isDismissed(dismissed, place.placeId(), place.displayName())) return true;
            if (!cityAnchor.contains(center, radiusKm, place.latitude(), place.longitude(), place.formattedAddress(), city)) {
                return true;
            }
            if (!matchesActivities(placeHaystack(place), activities)) return true;
            return !fitsBudget(place.priceLevel(), budgetReais);
        });
    }

    private void retainInCity(
            RecommendationResult result,
            CityAnchor.Center center,
            double radiusKm,
            String city,
            Set<String> dismissed,
            List<ActivityItemDto> activities,
            Double budgetReais
    ) {
        if (result == null || result.getLugares() == null) return;
        List<PlaceDto> kept = new ArrayList<>();
        for (PlaceDto place : result.getLugares()) {
            if (isDismissed(dismissed, place.getPlaceId(), place.getNome())) continue;
            if (!cityAnchor.contains(center, radiusKm, place.getLatitude(), place.getLongitude(), place.getEndereco(), city)) continue;
            String hay = fold((place.getNome() == null ? "" : place.getNome()) + " "
                    + (place.getTipo() == null ? "" : place.getTipo()) + " "
                    + (place.getCategoryTag() == null ? "" : place.getCategoryTag()));
            if (!matchesActivities(hay, activities)) continue;
            if (!fitsBudget(place.getPriceLevel(), budgetReais)) continue;
            kept.add(place);
        }
        result.setLugares(kept);
    }

    private static String placeHaystack(GooglePlacesDiscoveryService.DiscoveredPlace place) {
        String types = place.types() == null ? "" : String.join(" ", place.types());
        return fold((place.displayName() == null ? "" : place.displayName()) + " "
                + (place.primaryType() == null ? "" : place.primaryType()) + " " + types);
    }

    private static boolean matchesActivities(String haystack, List<ActivityItemDto> activities) {
        if (activities == null || activities.isEmpty()) return true;
        String hay = haystack == null ? "" : haystack;
        for (ActivityItemDto activity : activities) {
            String label = fold((activity.label() == null ? "" : activity.label()) + " "
                    + (activity.searchHint() == null ? "" : activity.searchHint()));
            if (label.contains("caf") && containsAny(hay, "cafe", "coffee", "padaria", "brunch", "bakery")) return true;
            if ((label.contains("mus") || label.contains("show")) && containsAny(hay, "bar", "pub", "music", "show", "night", "live")) return true;
            if (label.contains("natureza") && containsAny(hay, "parque", "park", "trilha", "jardim", "natureza", "mirante")) return true;
            if ((label.contains("gastro") || label.contains("comida")) && containsAny(hay, "restaur", "bistr", "food", "meal")) return true;
            if (label.contains("cultura") && containsAny(hay, "museu", "museum", "teatro", "theater", "cultur", "galeria", "art")) return true;
            if (label.contains("game") && containsAny(hay, "game", "jogo", "boliche", "bowling", "fliper")) return true;
            if (label.contains("praia") && containsAny(hay, "praia", "beach", "orla")) return true;
            if (label.contains("cinema") && containsAny(hay, "cinema", "movie", "filme")) return true;
        }
        return false;
    }

    private static boolean containsAny(String hay, String... needles) {
        for (String needle : needles) {
            if (hay.contains(needle)) return true;
        }
        return false;
    }

    private static String fold(String value) {
        if (value == null || value.isBlank()) return "";
        return java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    private static Double budgetCeiling(String sentir) {
        if (sentir == null || sentir.isBlank() || sentir.toLowerCase(Locale.ROOT).contains("sem teto")) return null;
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("gastar até (\\d+) reais").matcher(sentir);
        if (!matcher.find()) return null;
        return Double.parseDouble(matcher.group(1));
    }

    private static boolean fitsBudget(String priceLevel, Double budgetReais) {
        if (budgetReais == null || budgetReais >= 300 || priceLevel == null || priceLevel.isBlank()) return true;
        String level = priceLevel.toUpperCase(Locale.ROOT);
        int ceiling = 400;
        if (level.contains("FREE") || level.contains("INEXPENSIVE")) ceiling = 50;
        else if (level.contains("MODERATE")) ceiling = 120;
        else if (level.contains("VERY")) ceiling = 400;
        else if (level.contains("EXPENSIVE")) ceiling = 220;
        return ceiling <= budgetReais + 40;
    }

    private static boolean isDismissed(Set<String> dismissed, String placeId, String name) {
        if (dismissed == null || dismissed.isEmpty()) return false;
        if (placeId != null && dismissed.contains(placeId)) return true;
        return name != null && dismissed.contains(name.trim().toLowerCase(Locale.ROOT));
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
                if (matched.priceLevel() != null) place.setPriceLevel(matched.priceLevel());
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

    /**
     * A IA pode devolver 24 nomes sem foto e impedir a entrada dos lugares do mapa.
     * Copia a foto do candidato correspondente e abre espaço para os que já têm imagem.
     */
    private void ensurePhotographedPlaces(
            RecommendationResult result,
            List<GooglePlacesDiscoveryService.DiscoveredPlace> livePlaces
    ) {
        if (result == null) return;
        List<PlaceDto> current = result.getLugares() != null
                ? new ArrayList<>(result.getLugares())
                : new ArrayList<>();
        if (livePlaces != null) {
            for (PlaceDto place : current) {
                if (hasPhoto(place)) continue;
                for (GooglePlacesDiscoveryService.DiscoveredPlace live : livePlaces) {
                    if (live.photoUrl() == null || live.photoUrl().isBlank() || !samePlace(place, live)) continue;
                    place.setImagem(live.photoUrl());
                    if (place.getPlaceId() == null || place.getPlaceId().isBlank()) place.setPlaceId(live.placeId());
                    if (place.getGoogleMapsUri() == null || place.getGoogleMapsUri().isBlank()) {
                        place.setGoogleMapsUri(live.googleMapsUri());
                    }
                    break;
                }
            }
            for (GooglePlacesDiscoveryService.DiscoveredPlace live : livePlaces) {
                if (live.photoUrl() == null || live.photoUrl().isBlank()) continue;
                boolean present = false;
                for (PlaceDto place : current) {
                    if (samePlace(place, live)) {
                        present = true;
                        break;
                    }
                }
                if (!present) current.add(toPlaceDto(live, current.isEmpty()));
            }
        }
        current.sort((left, right) -> Boolean.compare(hasPhoto(right), hasPhoto(left)));
        if (current.size() > 24) current = new ArrayList<>(current.subList(0, 24));
        result.setLugares(current);
    }

    private boolean samePlace(PlaceDto place, GooglePlacesDiscoveryService.DiscoveredPlace live) {
        if (place.getPlaceId() != null && live.placeId() != null
                && !place.getPlaceId().isBlank() && place.getPlaceId().equals(live.placeId())) {
            return true;
        }
        return imageEnrichmentService.calculateNameSimilarity(place.getNome(), live.displayName()) >= 0.45;
    }

    private static boolean hasPhoto(PlaceDto place) {
        return place.getImagem() != null && !place.getImagem().isBlank();
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
        String mood = fold(dto.humor());
        String company = fold(dto.sentir());
        if (dto.activities() != null) {
            for (ActivityItemDto activity : dto.activities()) {
                String hint = activity.searchHint() != null && !activity.searchHint().isBlank()
                        ? activity.searchHint()
                        : activity.label();
                if (hint == null || hint.isBlank()) continue;
                queries.add(hint + " em " + city);
                if (mood.contains("relax") || mood.contains("paz")) {
                    queries.add(hint + " tranquilos em " + city);
                } else if (mood.contains("animad") || mood.contains("energia")) {
                    queries.add(hint + " movimentados em " + city);
                } else if (company.contains("a dois") || company.contains("encontro")) {
                    queries.add(hint + " para dois em " + city);
                }
            }
        }
        if (queries.isEmpty()) {
            queries.add("lugares para sair em " + city);
        }
        return queries.stream().distinct().limit(6).toList();
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
        place.setPriceLevel(p.priceLevel());
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

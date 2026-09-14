package com.unbora.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unbora.api.domain.venue.VenuePhoto;
import com.unbora.api.domain.venue.VenuePhotoRepository;
import com.unbora.api.kafka.KafkaEventPublisher;
import com.unbora.api.kafka.event.ImageEnrichmentEvent;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ImageEnrichmentService {

    private static final Logger log = LoggerFactory.getLogger(ImageEnrichmentService.class);

    private final String googlePlacesKey;
    private final String braveKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final VenuePhotoRepository venuePhotoRepository;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final GooglePlacesDiscoveryService googlePlacesDiscoveryService;
    private final Map<String, String> l1Cache = new ConcurrentHashMap<>(512);

    /**
     * Sessão de lote: garante URLs únicas dentro de um mesmo feed/resultado.
     * Econômico (sem API extra) e evita cards repetidos na UI.
     */
    public static final class BatchSession {
        private final Set<String> used = ConcurrentHashMap.newKeySet();

        public boolean isUsed(String url) {
            if (url == null || url.isBlank()) return true;
            return used.contains(canonicalUrl(url));
        }

        /** Reserva a URL no lote. Retorna false se já estava em uso. */
        public boolean claim(String url) {
            if (url == null || url.isBlank()) return false;
            return used.add(canonicalUrl(url));
        }

        private static String canonicalUrl(String url) {
            int q = url.indexOf('?');
            String base = q > 0 ? url.substring(0, q) : url;
            // Places media URLs: chave na query muda, path identifica a foto
            return base.toLowerCase(Locale.ROOT);
        }
    }


    // Chain blacklist to prevent fast-food / gas station / pharmacy photo hijacking for beaches/parks/cultural venues
    private static final Set<String> CHAIN_BLACKLIST = Set.of(
            "mcdonald", "mc donald", "mcdonalds", "burger king", "burgerking", "subway",
            "habibs", "bobs", "giraffas", "pague menos", "drogasil", "drogaria",
            "extrafarma", "posto", "ipiranga", "petrobras", "shell", "banco do brasil",
            "bradesco", "itau", "santander", "caixa economica", "loterica", "carrefour", "assai", "atacadao"
    );

    /** Termos esportivos / infraestrutura — incompatíveis com shows e cultura. */
    private static final Set<String> SPORTS_MISMATCH_TERMS = Set.of(
            "quadra", "futsal", "futebol", "futevolei", "basquete", "volei", "vôlei",
            "esporte", "poliesportivo", "ginasio", "ginásio", "estadio", "estádio",
            "campo", "arquibancada", "vestiario", "vestiário", "academia", "crossfit",
            "estacionamento", "parking", "playground esportivo"
    );

    private static final String BRAVE_MUSIC_EXCLUSIONS =
            " -quadra -futsal -futebol -esporte -ginasio -ginásio -estadio -estádio -poliesportivo -meme -flyer -vetor";

    // Curated high quality atmospheric photography fallback (No paintbrushes or mismatched themes)
    private static final Map<String, List<String>> THEMATIC_FALLBACKS = Map.ofEntries(
            Map.entry("reggae", List.of(
                    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1459749411175-04bf529277ce?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("jazz", List.of(
                    "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1514320291840-30921256a119?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("samba_forro", List.of(
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("rock_indie", List.of(
                    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1459749411175-04bf529277ce?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("eletronica", List.of(
                    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1571266028241-dc9a5c6185bf?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("teatro_danca", List.of(
                    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("gastronomia", List.of(
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("gastronomia_festival", List.of(
                    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("praia", List.of(
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1495954484750-af469f2f9be5?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=70"
            )),
            Map.entry("show", List.of(
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1459749411175-04bf529277ce?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("cultura", List.of(
                    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1499781350541-7783f73bbe20?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("infantil", List.of(
                    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("bar", List.of(
                    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=1200&auto=format&fit=crop&q=80"
            )),
            Map.entry("natureza", List.of(
                    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop&q=80"
            ))
    );

    public ImageEnrichmentService(
            @Value("${unbora.google.places-api-key:}") String googlePlacesKey,
            @Value("${unbora.brave.api-key:}") String braveKey,
            VenuePhotoRepository venuePhotoRepository,
            KafkaEventPublisher kafkaEventPublisher,
            GooglePlacesDiscoveryService googlePlacesDiscoveryService
    ) {
        this.googlePlacesKey = googlePlacesKey != null ? googlePlacesKey.trim() : "";
        this.braveKey = braveKey != null ? braveKey.trim() : "";
        this.venuePhotoRepository = venuePhotoRepository;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.googlePlacesDiscoveryService = googlePlacesDiscoveryService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Fallbacks curados não devem viver no DB — envenenam o feed com a mesma URL.
     * Limpa residuos de versões anteriores (curated / curated_thematic).
     */
    @PostConstruct
    @Transactional
    public void purgeNonAuthoritativePhotoCache() {
        if (venuePhotoRepository == null) return;
        try {
            long a = venuePhotoRepository.deleteBySource("curated_thematic");
            long b = venuePhotoRepository.deleteBySource("curated");
            long c = venuePhotoRepository.deleteBySourceStartingWith("fallback");
            long total = a + b + c;
            if (total > 0) {
                log.info("[Image] Removidas {} fotos de cache não-autoritativo (curated/fallback)", total);
            }
            l1Cache.clear();
        } catch (Exception e) {
            log.warn("[Image] Não foi possível limpar cache curated: {}", e.getMessage());
        }
    }

    /**
     * Enriquecimento inteligente para Eventos com Query Crafting e Cache Persistente.
     * Eventos musicais/culturais em complexos multiuso (ex.: Festival de Reggae no Cuca)
     * NÃO usam fotos de quadra/ginásio do local físico.
     */
    public String fetchEventImage(
            String title,
            String venue,
            String city,
            String eventType,
            String visualQuery,
            String categoryTag,
            Double latitude,
            Double longitude
    ) {
        return fetchEventImage(title, venue, city, eventType, visualQuery, categoryTag, latitude, longitude, null);
    }

    public String fetchEventImage(
            String title,
            String venue,
            String city,
            String eventType,
            String visualQuery,
            String categoryTag,
            Double latitude,
            Double longitude,
            BatchSession batch
    ) {
        String effectiveCity = (city != null && !city.isBlank()) ? city : "Brasil";
        String effectiveVenue = (venue != null && !venue.isBlank()) ? venue : (title != null ? title : effectiveCity);
        String normKey = normalizeText((title != null ? title : effectiveVenue) + " " + effectiveCity);
        boolean isMusicOrArts = isMusicOrArtsEvent(title, categoryTag, eventType);
        boolean isMultiUseVenue = isMultiUseOrSportsComplex(effectiveVenue);
        boolean preferThematicOverVenue = isMusicOrArts && isMultiUseVenue;

        // 1. Cache L1 (Memória) — invalida mismatch esportivo / duplicata no lote
        String cachedL1 = l1Cache.get(normKey);
        if (cachedL1 != null
                && !isInvalidPhoto(cachedL1)
                && !isSportsMismatchForEvent(cachedL1, null, isMusicOrArts)) {
            String accepted = acceptOrContinue(cachedL1, batch);
            if (accepted != null) return accepted;
        }
        if (cachedL1 != null && (batch == null || !batch.isUsed(cachedL1))) {
            l1Cache.remove(normKey);
        }

        // 2. Cache L2 (PostgreSQL) — rejeita google_places de complexo multiuso em evento artístico
        try {
            if (venuePhotoRepository != null) {
                Optional<VenuePhoto> dbPhoto = venuePhotoRepository.findByVenueNormalized(normKey);
                if (dbPhoto.isPresent()) {
                    VenuePhoto photo = dbPhoto.get();
                    String url = photo.getPhotoUrl();
                    if (!shouldPersistSource(photo.getSource())) {
                        log.info("[Image] Ignorando cache não-autoritativo de '{}' (source={})",
                                title, photo.getSource());
                    } else {
                        boolean badSource = preferThematicOverVenue
                                && "google_places".equalsIgnoreCase(photo.getSource());
                        boolean sportsMismatch = isSportsMismatchForEvent(url, photo.getDisplayName(), isMusicOrArts);
                        if (!isInvalidPhoto(url) && !badSource && !sportsMismatch) {
                            String accepted = acceptOrContinue(url, batch);
                            if (accepted != null) {
                                l1Cache.put(normKey, accepted);
                                return accepted;
                            }
                        }
                        log.info("[Image] Invalidando cache de '{}' (source={}, mismatch esportivo ou local multiuso)",
                                title, photo.getSource());
                    }
                }
            }
        } catch (Exception e) {
            log.debug("DB lookup error for event {}: {}", normKey, e.getMessage());
        }

        // Eventos:
        // • Show em complexo multiuso (Cuca etc.): sem Places → Brave → tema ilustrativo
        // • Demais: Places do local → Brave → tema só se for música/arte
        // (Lugares físicos usam fetchPlaceImage — sempre Google Places.)
        if (preferThematicOverVenue) {
            log.info("[Image] Pulando Google Places para '{}' em '{}' (evento artístico em complexo multiuso)",
                    title, effectiveVenue);
            if (!braveKey.isBlank() && title != null && !title.isBlank()) {
                String braveSearchTerm = (visualQuery != null && !visualQuery.isBlank())
                        ? visualQuery + " " + effectiveCity
                        : title + " show palco ao vivo festival concerto música " + effectiveCity
                        + BRAVE_MUSIC_EXCLUSIONS;
                String braveImage = searchBraveImage(braveSearchTerm, title, true);
                String acceptedBrave = acceptOrContinue(braveImage, batch);
                if (acceptedBrave != null) {
                    saveToCache(normKey, title, effectiveCity, acceptedBrave, "brave_search",
                            categoryTag != null ? categoryTag : eventType);
                    return acceptedBrave;
                }
            }
            return thematicIllustrative(title, effectiveVenue, eventType, categoryTag, normKey, batch);
        }

        if (!googlePlacesKey.isBlank() && venue != null && !venue.isBlank()) {
            String venuePhoto = searchGooglePlacePhoto(
                    venue + " " + effectiveCity, venue, latitude, longitude, isMusicOrArts);
            if (venuePhoto != null && !isSportsMismatchForEvent(venuePhoto, venue, isMusicOrArts)) {
                String acceptedVenue = acceptOrContinue(venuePhoto, batch);
                if (acceptedVenue != null) {
                    saveToCache(normKey, title != null ? title : venue, effectiveCity, acceptedVenue,
                            "google_places", categoryTag != null ? categoryTag : eventType);
                    return acceptedVenue;
                }
            }
        }

        if (!braveKey.isBlank() && title != null && !title.isBlank()) {
            String braveSearchTerm;
            if (visualQuery != null && !visualQuery.isBlank()) {
                braveSearchTerm = visualQuery + " " + effectiveCity;
            } else if (isMusicOrArts) {
                braveSearchTerm = title + " show palco ao vivo festival concerto música " + effectiveCity
                        + BRAVE_MUSIC_EXCLUSIONS;
            } else {
                braveSearchTerm = title + " " + effectiveVenue + " " + effectiveCity + " evento";
            }

            String braveImage = searchBraveImage(braveSearchTerm, title, isMusicOrArts);
            String acceptedBrave = acceptOrContinue(braveImage, batch);
            if (acceptedBrave != null) {
                saveToCache(normKey, title, effectiveCity, acceptedBrave, "brave_search",
                        categoryTag != null ? categoryTag : eventType);
                return acceptedBrave;
            }
        }

        if (isMusicOrArts) {
            return thematicIllustrative(title, effectiveVenue, eventType, categoryTag, normKey, batch);
        }

        log.debug("[Image] Sem foto confiável para evento '{}' — card sem imagem", title);
        return null;
    }

    private String thematicIllustrative(
            String title,
            String venue,
            String eventType,
            String categoryTag,
            String normKey,
            BatchSession batch
    ) {
        String thematic = getCuratedFallback(
                categoryTag != null ? categoryTag : eventType,
                (title != null ? title : "") + " " + venue,
                batch);
        l1Cache.put(normKey, thematic);
        log.info("[Image] Usando imagem ilustrativa temática para '{}'", title);
        return thematic;
    }

    boolean isMultiUseOrSportsComplex(String venue) {
        if (venue == null || venue.isBlank()) return false;
        String lower = normalizeText(venue);
        return lower.contains("cuca") || lower.contains("ginasio") || lower.contains("estadio")
                || lower.contains("arena") || lower.contains("quadra") || lower.contains("poliesportivo")
                || lower.contains("centro urbano de cultura") || lower.contains("parque da cidade")
                || (lower.contains("sesc") && (lower.contains("esporte") || lower.contains("clube")));
    }

    boolean isMusicOrArtsEvent(String title, String categoryTag, String eventType) {
        String combined = normalizeText(
                (title != null ? title : "") + " "
                        + (categoryTag != null ? categoryTag : "") + " "
                        + (eventType != null ? eventType : ""));
        return combined.contains("show") || combined.contains("musica") || combined.contains("reggae")
                || combined.contains("jazz") || combined.contains("rock") || combined.contains("samba")
                || combined.contains("forro") || combined.contains("festival") || combined.contains("teatro")
                || combined.contains("danca") || combined.contains("espetaculo") || combined.contains("cultura")
                || combined.contains("dj") || combined.contains("eletronica") || combined.contains("concerto")
                || combined.contains("banda") || combined.contains("palco") || combined.contains("pagode")
                || combined.contains("blues") || combined.contains("mpb");
    }

    /**
     * Detecta URLs/títulos que indicam foto esportiva incompatível com evento artístico.
     */
    boolean isSportsMismatchForEvent(String urlOrTitle, String extraContext, boolean musicOrArts) {
        if (!musicOrArts) return false;
        String haystack = normalizeText(
                (urlOrTitle != null ? urlOrTitle : "") + " " + (extraContext != null ? extraContext : ""));
        for (String term : SPORTS_MISMATCH_TERMS) {
            if (haystack.contains(normalizeText(term))) {
                return true;
            }
        }
        return false;
    }

    public String fetchEventImage(String title, String venue, String city, String eventType, String visualQuery, String categoryTag) {
        return fetchEventImage(title, venue, city, eventType, visualQuery, categoryTag, null, null, null);
    }

    public String fetchEventImage(String title, String venue, String city, String eventType, String visualQuery, String categoryTag, BatchSession batch) {
        return fetchEventImage(title, venue, city, eventType, visualQuery, categoryTag, null, null, batch);
    }

    public String fetchEventImage(String title, String venue, String city, String eventType) {
        return fetchEventImage(title, venue, city, eventType, null, null, null, null, null);
    }

    /**
     * Enriquecimento para Lugares e Estabelecimentos Físicos em qualquer cidade do mundo.
     */
    public String fetchPlaceImage(
            String placeName,
            String address,
            String type,
            String visualQuery,
            String categoryTag,
            String city,
            Double latitude,
            Double longitude
    ) {
        return fetchPlaceImage(placeName, address, type, visualQuery, categoryTag, city, latitude, longitude, null);
    }

    /**
     * Lugares físicos (recomendar/buscar): sempre prioriza foto do Google Places / Maps.
     * Sem stock temático — se não houver Places/Brave, retorna null (placeholder no app).
     */
    public String fetchPlaceImage(
            String placeName,
            String address,
            String type,
            String visualQuery,
            String categoryTag,
            String city,
            Double latitude,
            Double longitude,
            BatchSession batch
    ) {
        if (placeName == null || placeName.isBlank()) {
            return null;
        }

        String effectiveCity = (city != null && !city.isBlank()) ? city : "Brasil";
        String cleanAddress = address != null ? address : effectiveCity;
        String normKey = normalizeText(placeName + " " + effectiveCity);

        // 1. Cache L1 — só URLs autoritativas (Places/Brave), nunca Unsplash
        String cachedL1 = l1Cache.get(normKey);
        if (cachedL1 != null && !isInvalidPhoto(cachedL1) && !isIllustrativeImageUrl(cachedL1)) {
            String accepted = acceptOrContinue(cachedL1, batch);
            if (accepted != null) return accepted;
        }

        // 2. Cache L2 PostgreSQL
        try {
            if (venuePhotoRepository != null) {
                Optional<VenuePhoto> dbPhoto = venuePhotoRepository.findByVenueNormalized(normKey);
                if (dbPhoto.isPresent()) {
                    VenuePhoto photo = dbPhoto.get();
                    String url = photo.getPhotoUrl();
                    if (shouldPersistSource(photo.getSource())
                            && !isInvalidPhoto(url)
                            && !isIllustrativeImageUrl(url)) {
                        String accepted = acceptOrContinue(url, batch);
                        if (accepted != null) {
                            l1Cache.put(normKey, accepted);
                            return accepted;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("DB lookup error for place {}: {}", normKey, e.getMessage());
        }

        // 3. Google Places (fonte principal para lugares)
        if (!googlePlacesKey.isBlank()) {
            String query = (visualQuery != null && !visualQuery.isBlank())
                    ? visualQuery + " " + cleanAddress
                    : placeName + ", " + cleanAddress;

            String photo = searchGooglePlacePhoto(query, placeName, latitude, longitude);
            String accepted = acceptOrContinue(photo, batch);
            if (accepted != null) {
                saveToCache(normKey, placeName, effectiveCity, accepted, "google_places",
                        categoryTag != null ? categoryTag : type);
                return accepted;
            }

            photo = searchGooglePlacePhoto(placeName + " " + effectiveCity, placeName, latitude, longitude);
            accepted = acceptOrContinue(photo, batch);
            if (accepted != null) {
                saveToCache(normKey, placeName, effectiveCity, accepted, "google_places",
                        categoryTag != null ? categoryTag : type);
                return accepted;
            }
        }

        // 4. Brave só como fallback de fachada/ambiente (ainda foto “real”, não tema)
        if (!braveKey.isBlank()) {
            String braveImage = searchBraveImage(
                    "\"" + placeName + "\" " + effectiveCity + " fachada OR ambiente", placeName);
            String accepted = acceptOrContinue(braveImage, batch);
            if (accepted != null) {
                saveToCache(normKey, placeName, effectiveCity, accepted, "brave_search",
                        categoryTag != null ? categoryTag : type);
                return accepted;
            }
        }

        log.info("[Image] Sem foto Google Places para lugar '{}' — sem imagem", placeName);
        return null;
    }

    public String fetchPlaceImage(String placeName, String address, String type, String visualQuery, String categoryTag) {
        return fetchPlaceImage(placeName, address, type, visualQuery, categoryTag, null, null, null, null);
    }

    public String fetchPlaceImage(String placeName, String address, String type) {
        return fetchPlaceImage(placeName, address, type, null, null, null, null, null, null);
    }

    public double calculateNameSimilarity(String queryName, String candidateName) {
        if (queryName == null || candidateName == null) return 0.0;
        String n1 = normalizeText(queryName);
        String n2 = normalizeText(candidateName);
        if (n1.isBlank() || n2.isBlank()) return 0.0;
        if (n1.equals(n2) || n1.contains(n2) || n2.contains(n1)) return 1.0;

        Set<String> tokens1 = new HashSet<>(Arrays.asList(n1.split("\\s+")));
        Set<String> tokens2 = new HashSet<>(Arrays.asList(n2.split("\\s+")));

        Set<String> stopwords = Set.of("de", "do", "da", "dos", "das", "e", "em", "o", "a", "restaurante", "bar", "cafe", "rua", "av", "avenida");
        tokens1.removeAll(stopwords);
        tokens2.removeAll(stopwords);

        if (tokens1.isEmpty() || tokens2.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(tokens1);
        intersection.retainAll(tokens2);

        Set<String> union = new HashSet<>(tokens1);
        union.addAll(tokens2);

        return (double) intersection.size() / union.size();
    }

    public void saveToCache(String normKey, String displayName, String city, String photoUrl, String source, String categoryTag) {
        if (photoUrl == null || photoUrl.isBlank()) return;
        l1Cache.put(normKey, photoUrl);
        // Não persiste fallbacks temáticos/picsum — evita poluir o feed com a mesma stock photo
        if (venuePhotoRepository == null || !shouldPersistSource(source)) return;
        try {
            VenuePhoto entity = new VenuePhoto(normKey, displayName, city != null ? city : "Geral", photoUrl, source, categoryTag);
            venuePhotoRepository.save(entity);
            log.info("[Image Cache] Novo local cacheado no PostgreSQL: '{}' ({}) -> {}", displayName, city, source);
        } catch (Exception e) {
            log.debug("Erro ao salvar cache no DB para {}: {}", normKey, e.getMessage());
        }
    }

    private String searchGooglePlacePhoto(String textQuery, String preferredName, Double latitude, Double longitude) {
        return searchGooglePlacePhoto(textQuery, preferredName, latitude, longitude, false);
    }

    private String searchGooglePlacePhoto(String textQuery, String preferredName, Double latitude, Double longitude, boolean rejectSportsResults) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("textQuery", textQuery);
            requestBody.put("languageCode", "pt-BR");
            requestBody.put("maxResultCount", 4);

            if (latitude != null && longitude != null && !latitude.isNaN() && !longitude.isNaN()) {
                requestBody.put("locationBias", Map.of(
                        "circle", Map.of(
                                "center", Map.of("latitude", latitude, "longitude", longitude),
                                "radius", 30000.0
                        )
                ));
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://places.googleapis.com/v1/places:searchText"))
                    .header("Content-Type", "application/json")
                    .header("X-Goog-Api-Key", googlePlacesKey)
                    .header("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.photos")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode places = root.path("places");
            if (!places.isArray() || places.isEmpty()) return null;

            JsonNode bestPlace = null;
            double bestScore = -1.0;

            String normPreferred = normalizeText(preferredName != null ? preferredName : "");

            for (JsonNode place : places) {
                String displayName = place.path("displayName").path("text").asText("");
                String normDisplay = normalizeText(displayName);

                if (rejectSportsResults && isSportsMismatchForEvent(normDisplay, null, true)) {
                    log.debug("[Places Filter] Ignorando resultado esportivo '{}' para evento artístico", displayName);
                    continue;
                }

                // Anti-Hijack Check: Se for rede de fast-food / posto / banco e o usuário não buscou por isso, ignora
                boolean isBlacklistedChain = false;
                for (String chain : CHAIN_BLACKLIST) {
                    if (normDisplay.contains(chain) && !normPreferred.contains(chain)) {
                        isBlacklistedChain = true;
                        break;
                    }
                }
                if (isBlacklistedChain) {
                    log.debug("[Places Filter] Ignorando rede '{}' para busca de '{}'", displayName, preferredName);
                    continue;
                }

                double score = calculateNameSimilarity(preferredName, displayName);
                if (score > bestScore) {
                    bestScore = score;
                    bestPlace = place;
                }
            }

            if (preferredName != null && preferredName.length() >= 3 && bestScore < 0.35) {
                log.debug("[Places Filter] Score de similaridade insuficiente ({}) para '{}' vs Places", bestScore, preferredName);
                return null;
            }

            if (bestPlace == null) {
                return null;
            }

            JsonNode photos = bestPlace.path("photos");
            if (photos.isArray() && !photos.isEmpty()) {
                String selectedPhotoName = null;
                for (JsonNode photo : photos) {
                    int width = photo.path("widthPx").asInt(0);
                    int height = photo.path("heightPx").asInt(0);
                    String name = photo.path("name").asText(null);

                    if (name != null && !name.isBlank()) {
                        if (width >= height && width >= 600) {
                            selectedPhotoName = name;
                            break;
                        }
                    }
                }

                if (selectedPhotoName == null) {
                    selectedPhotoName = photos.get(0).path("name").asText(null);
                }

                if (selectedPhotoName != null && !selectedPhotoName.isBlank()) {
                    return "https://places.googleapis.com/v1/" + selectedPhotoName + "/media?maxHeightPx=1080&maxWidthPx=1920&key=" + URLEncoder.encode(googlePlacesKey, StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            log.debug("Google Places search failed for {}: {}", textQuery, e.getMessage());
        }
        return null;
    }

    private String searchBraveImage(String query, String placeName) {
        return searchBraveImage(query, placeName, false);
    }

    private String searchBraveImage(String query, String placeName, boolean musicOrArtsMode) {
        try {
            String sanitizedQuery = query + " -meme -flyer -vetor -desenho -clipart -itunes -mcdonalds -hamburguer";
            if (musicOrArtsMode && !sanitizedQuery.contains("-quadra")) {
                sanitizedQuery += BRAVE_MUSIC_EXCLUSIONS;
            }
            String url = "https://api.search.brave.com/res/v1/images/search?q="
                    + URLEncoder.encode(sanitizedQuery, StandardCharsets.UTF_8)
                    + "&count=10&search_lang=pt&safesearch=strict";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .header("X-Subscription-Token", braveKey)
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode results = root.path("results");
            if (!results.isArray()) return null;

            String targetTokens = normalizeText(placeName);

            for (JsonNode item : results) {
                String imgUrl = item.path("properties").path("url").asText(item.path("url").asText(""));
                if (imgUrl.isBlank() || !imgUrl.startsWith("http")) continue;
                if (isStockOrBadHost(imgUrl)) continue;

                int width = item.path("properties").path("width").asInt(0);
                int height = item.path("properties").path("height").asInt(0);
                if (width > 0 && height > 0 && width < 400) continue;

                String title = normalizeText(item.path("title").asText(""));
                if (musicOrArtsMode && isSportsMismatchForEvent(imgUrl + " " + title, null, true)) {
                    continue;
                }

                if (title.contains(targetTokens)
                        || calculateNameSimilarity(targetTokens, title) >= 0.4
                        || targetTokens.length() < 4
                        || musicOrArtsMode) {
                    return imgUrl;
                }
            }
        } catch (Exception e) {
            log.debug("Brave Image search failed for {}: {}", query, e.getMessage());
        }
        return null;
    }

    private boolean isInvalidPhoto(String url) {
        if (url == null || url.isBlank()) return true;
        String lower = url.toLowerCase();
        if (lower.contains("photo-1460661419201-fd4cecdf8a8b")) return true;
        for (String chain : CHAIN_BLACKLIST) {
            if (lower.contains(chain)) return true;
        }
        return false;
    }

    private boolean isStockOrBadHost(String url) {
        String lower = url.toLowerCase();
        return lower.contains("unsplash.com") || lower.contains("pexels.com") || lower.contains("pixabay.com")
                || lower.contains("shutterstock.com") || lower.contains("freepik.com") || lower.contains("alamy.com")
                || lower.contains("lookaside.fbsbx.com") || lower.contains("gstatic.com") || lower.contains("tripadvisor.com/img/icon")
                || lower.contains("1.1.1.1") || lower.contains("avatar") || lower.contains("logo")
                || lower.contains("mcdonalds") || lower.contains("mcdonald");
    }

    public String normalizeText(String text) {
        if (text == null) return "";
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public String getCuratedFallback(String category, String name) {
        return getCuratedFallback(category, name, null);
    }

    /**
     * Escolhe fallback temático evitando URLs já usadas no lote.
     * Se o pool esgotar, usa Picsum com seed estável do título (grátis, único, sem API key).
     */
    public String getCuratedFallback(String category, String name, BatchSession batch) {
        String combined = ((category != null ? category : "") + " " + (name != null ? name : "")).toLowerCase();
        List<String> pool = resolveFallbackPool(combined);
        if (pool == null || pool.isEmpty()) {
            pool = THEMATIC_FALLBACKS.get("show");
        }

        int startIdx = Math.floorMod(combined.hashCode(), pool.size());
        for (int i = 0; i < pool.size(); i++) {
            String candidate = pool.get((startIdx + i) % pool.size());
            if (batch == null || batch.claim(candidate)) {
                return candidate;
            }
        }

        // Pool esgotado no lote — imagem única e gratuita por seed
        String unique = uniqueSeedImage(combined);
        if (batch != null) {
            batch.claim(unique);
        }
        return unique;
    }

    private List<String> resolveFallbackPool(String combined) {
        if (combined.contains("reggae")) return THEMATIC_FALLBACKS.get("reggae");
        if (combined.contains("jazz") || combined.contains("blues") || combined.contains("sax")) return THEMATIC_FALLBACKS.get("jazz");
        if (combined.contains("forro") || combined.contains("forró") || combined.contains("samba") || combined.contains("pagode") || combined.contains("chorinho") || combined.contains("choro")) return THEMATIC_FALLBACKS.get("samba_forro");
        if (combined.contains("rock") || combined.contains("indie") || combined.contains("metal") || combined.contains("punk") || combined.contains("jovem guarda")) return THEMATIC_FALLBACKS.get("rock_indie");
        if (combined.contains("eletronica") || combined.contains("eletrônica") || combined.contains("dj") || combined.contains("rave") || combined.contains("tribal") || combined.contains("after")) return THEMATIC_FALLBACKS.get("eletronica");
        if (combined.contains("teatro") || combined.contains("dança") || combined.contains("danca") || combined.contains("espetaculo") || combined.contains("espetáculo") || combined.contains("comedia") || combined.contains("comédia") || combined.contains("stand-up") || combined.contains("standup")) return THEMATIC_FALLBACKS.get("teatro_danca");
        if (combined.contains("beatles") || combined.contains("infantil") || combined.contains("criança") || combined.contains("crianca") || combined.contains("kids")) return THEMATIC_FALLBACKS.get("infantil");
        if (combined.contains("sunset") || combined.contains("pôr do sol") || combined.contains("por do sol") || combined.contains("praia") || combined.contains("mar") || combined.contains("litoral") || combined.contains("beira-mar") || combined.contains("aterro") || combined.contains("espigão") || combined.contains("espigao") || combined.contains("beach")) return THEMATIC_FALLBACKS.get("praia");
        if (combined.contains("feira gastron") || combined.contains("festival gastron") || combined.contains("gastronomia_festival")) return THEMATIC_FALLBACKS.get("gastronomia_festival");
        if (combined.contains("show") || combined.contains("música") || combined.contains("musica") || combined.contains("banda") || combined.contains("festival") || combined.contains("festa")) return THEMATIC_FALLBACKS.get("show");
        if (combined.contains("gastronomia") || combined.contains("restaurante") || combined.contains("café") || combined.contains("cafe") || combined.contains("comida") || combined.contains("bistrô") || combined.contains("bistro") || combined.contains("culinária") || combined.contains("culinaria") || combined.contains("vinho") || combined.contains("wine")) return THEMATIC_FALLBACKS.get("gastronomia");
        if (combined.contains("bar") || combined.contains("pub") || combined.contains("boteco") || combined.contains("chopp") || combined.contains("cervejaria") || combined.contains("balada") || combined.contains("drinks")) return THEMATIC_FALLBACKS.get("bar");
        if (combined.contains("natureza") || combined.contains("parque") || combined.contains("esporte") || combined.contains("yoga") || combined.contains("trilha") || combined.contains("corrida")) return THEMATIC_FALLBACKS.get("natureza");
        return THEMATIC_FALLBACKS.get("cultura");
    }

    /** Fallback único e gratuito — seed estável por título/categoria. */
    public String uniqueSeedImage(String seedText) {
        String seed = normalizeText(seedText);
        if (seed.isBlank()) seed = "unbora";
        seed = seed.replace(' ', '-');
        if (seed.length() > 64) seed = seed.substring(0, 64);
        return "https://picsum.photos/seed/unbora-" + seed + "/1200/900";
    }

    private String acceptOrContinue(String url, BatchSession batch) {
        if (url == null || url.isBlank() || isInvalidPhoto(url)) return null;
        if (batch == null) return url;
        if (batch.isUsed(url)) return null;
        if (!batch.claim(url)) return null;
        return url;
    }

    private boolean shouldPersistSource(String source) {
        if (source == null) return false;
        return "google_places".equals(source) || "brave_search".equals(source);
    }

    /** Unsplash curado / Picsum seed = ilustrativa, não foto oficial do evento. */
    public boolean isIllustrativeImageUrl(String url) {
        if (url == null || url.isBlank()) return false;
        String lower = url.toLowerCase(Locale.ROOT);
        return lower.contains("images.unsplash.com")
                || lower.contains("picsum.photos/seed/unbora");
    }
}

package com.unbora.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GooglePlacesDiscoveryService {

    private static final Logger log = LoggerFactory.getLogger(GooglePlacesDiscoveryService.class);

    private final String googlePlacesKey;
    private final JdbcTemplate jdbcTemplate;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Map<String, String> directPhotoCache = new ConcurrentHashMap<>();

    public record DiscoveredPlace(
            String name,
            String displayName,
            String formattedAddress,
            String placeId,
            Double latitude,
            Double longitude,
            Double rating,
            Integer userRatingCount,
            Boolean openNow,
            String primaryType,
            List<String> types,
            String googleMapsUri,
            String editorialSummary,
            String photoUrl,
            String priceLevel
    ) {}

    @Autowired
    public GooglePlacesDiscoveryService(
            @Value("${unbora.google.places-api-key:}") String googlePlacesKey,
            @Autowired(required = false) JdbcTemplate jdbcTemplate
    ) {
        this.googlePlacesKey = googlePlacesKey != null ? googlePlacesKey.trim() : "";
        this.jdbcTemplate = jdbcTemplate;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public GooglePlacesDiscoveryService(String googlePlacesKey) {
        this(googlePlacesKey, null);
    }

    public boolean isConfigured() {
        return !googlePlacesKey.isBlank();
    }

    /**
     * Busca dinâmica no Google Places para qualquer cidade do Brasil e do mundo.
     */
    public List<DiscoveredPlace> searchPlaces(
            String textQuery,
            Double latitude,
            Double longitude,
            Double radiusKm,
            String city,
            String country,
            int maxResults
    ) {
        if (!isConfigured()) {
            return List.of();
        }

        try {
            String effectiveQuery = textQuery;
            if (city != null && !city.isBlank() && !effectiveQuery.toLowerCase().contains(city.toLowerCase())) {
                effectiveQuery = effectiveQuery + " em " + city;
                if (country != null && !country.isBlank()) {
                    effectiveQuery = effectiveQuery + ", " + country;
                }
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("textQuery", effectiveQuery);
            requestBody.put("languageCode", "pt-BR");
            requestBody.put("maxResultCount", Math.min(maxResults > 0 ? maxResults : 20, 20));

            if (latitude != null && longitude != null && !latitude.isNaN() && !longitude.isNaN()) {
                double km = radiusKm != null && radiusKm > 0 ? radiusKm : 8.0;
                double dLat = km / 111.0;
                double dLng = km / (111.0 * Math.max(0.2, Math.cos(Math.toRadians(latitude))));
                requestBody.put("locationRestriction", Map.of(
                        "rectangle", Map.of(
                                "low", Map.of("latitude", latitude - dLat, "longitude", longitude - dLng),
                                "high", Map.of("latitude", latitude + dLat, "longitude", longitude + dLng)
                        )
                ));
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://places.googleapis.com/v1/places:searchText"))
                    .header("Content-Type", "application/json")
                    .header("X-Goog-Api-Key", googlePlacesKey)
                    .header("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.primaryType,places.types,places.googleMapsUri,places.editorialSummary,places.photos,places.priceLevel")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .timeout(Duration.ofSeconds(6))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.debug("Google Places searchText returned HTTP {}: {}", response.statusCode(), response.body());
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode places = root.path("places");
            if (!places.isArray() || places.isEmpty()) {
                return List.of();
            }

            List<DiscoveredPlace> results = new ArrayList<>();
            for (JsonNode p : places) {
                String placeId = p.path("id").asText("");
                String displayName = p.path("displayName").path("text").asText("");
                String formattedAddress = p.path("formattedAddress").asText("");
                Double lat = p.path("location").has("latitude") ? p.path("location").path("latitude").asDouble() : null;
                Double lng = p.path("location").has("longitude") ? p.path("location").path("longitude").asDouble() : null;
                Double rating = p.has("rating") ? p.path("rating").asDouble() : 4.6;
                Integer userRatingCount = p.has("userRatingCount") ? p.path("userRatingCount").asInt() : 0;
                Boolean openNow = p.path("currentOpeningHours").has("openNow") ? p.path("currentOpeningHours").path("openNow").asBoolean() : null;
                String primaryType = p.path("primaryType").asText("");
                String googleMapsUri = p.path("googleMapsUri").asText("");
                String editorialSummary = p.path("editorialSummary").path("text").asText("");
                String priceLevel = p.path("priceLevel").asText("");
                if (priceLevel.isBlank()) priceLevel = null;

                List<String> types = new ArrayList<>();
                if (p.path("types").isArray()) {
                    for (JsonNode t : p.path("types")) {
                        types.add(t.asText());
                    }
                }

                // Seleciona a melhor foto real do estabelecimento
                String photoUrl = null;
                JsonNode photos = p.path("photos");
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
                        // Verifica se já está em cache persistente (PostgreSQL / RAM)
                        String cachedDirectUri = getCachedPhotoUri(selectedPhotoName);
                        if (cachedDirectUri != null && !cachedDirectUri.isBlank()) {
                            photoUrl = cachedDirectUri;
                        } else {
                            photoUrl = "https://places.googleapis.com/v1/" + selectedPhotoName + "/media?maxHeightPx=720&maxWidthPx=960&key=" + URLEncoder.encode(googlePlacesKey, StandardCharsets.UTF_8);
                        }
                    }
                }

                if (displayName != null && !displayName.isBlank()) {
                    results.add(new DiscoveredPlace(
                            displayName,
                            displayName,
                            formattedAddress,
                            placeId,
                            lat,
                            lng,
                            rating,
                            userRatingCount,
                            openNow,
                            primaryType,
                            types,
                            googleMapsUri,
                            editorialSummary,
                            photoUrl,
                            priceLevel
                    ));
                }
            }

            return results;
        } catch (Exception e) {
            log.warn("Erro ao buscar locais no Google Places: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Resolve a URL de foto do Google Places para a URL final direta (lh3.googleusercontent.com).
     * Aplica arquitetura Fetch-Once-Serve-Forever com cache persistente no PostgreSQL.
     */
    public String resolveDirectPhotoUrl(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank() || !mediaUrl.contains("places.googleapis.com")) {
            return mediaUrl;
        }

        String photoKey = extractPhotoKey(mediaUrl);

        // 1. Verifica cache rápido em memória
        String memoryCached = directPhotoCache.get(mediaUrl);
        if (memoryCached != null) return memoryCached;
        if (photoKey != null) {
            String keyCached = directPhotoCache.get(photoKey);
            if (keyCached != null) return keyCached;
        }

        // 2. Verifica cache persistente no PostgreSQL
        if (photoKey != null) {
            String dbCached = getCachedPhotoUri(photoKey);
            if (dbCached != null && !dbCached.isBlank()) {
                directPhotoCache.put(mediaUrl, dbCached);
                directPhotoCache.put(photoKey, dbCached);
                return dbCached;
            }
        }

        // 3. Chamada única ao endpoint do Google com skipHttpRedirect
        try {
            String requestUrl = mediaUrl.contains("skipHttpRedirect=")
                    ? mediaUrl
                    : mediaUrl + "&skipHttpRedirect=true";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(requestUrl))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return mediaUrl;
            }
            String photoUri = objectMapper.readTree(response.body()).path("photoUri").asText("");
            if (photoUri.isBlank() || !photoUri.startsWith("http")) {
                return mediaUrl;
            }

            // 4. Salva permanentemente no cache
            directPhotoCache.put(mediaUrl, photoUri);
            if (photoKey != null) {
                saveCachedPhotoUri(photoKey, photoUri);
            }
            return photoUri;
        } catch (Exception e) {
            log.debug("Falha ao resolver foto do Places: {}", e.getMessage());
            return mediaUrl;
        }
    }

    private String extractPhotoKey(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) return null;
        int v1Idx = mediaUrl.indexOf("/v1/");
        int mediaIdx = mediaUrl.indexOf("/media");
        if (v1Idx != -1 && mediaIdx > v1Idx) {
            return mediaUrl.substring(v1Idx + 4, mediaIdx);
        }
        return mediaUrl;
    }

    private String getCachedPhotoUri(String photoKey) {
        if (photoKey == null || photoKey.isBlank()) return null;
        String mem = directPhotoCache.get(photoKey);
        if (mem != null) return mem;

        if (jdbcTemplate == null) return null;
        try {
            List<String> list = jdbcTemplate.query(
                    "SELECT photo_uri FROM place_photo_cache WHERE photo_key = ?",
                    (rs, rowNum) -> rs.getString("photo_uri"),
                    photoKey
            );
            if (!list.isEmpty() && list.get(0) != null && !list.get(0).isBlank()) {
                String uri = list.get(0);
                directPhotoCache.put(photoKey, uri);
                return uri;
            }
        } catch (Exception e) {
            log.debug("[PhotoCache] Falha na leitura DB cache para {}: {}", photoKey, e.getMessage());
        }
        return null;
    }

    private void saveCachedPhotoUri(String photoKey, String photoUri) {
        if (photoKey == null || photoKey.isBlank() || photoUri == null || photoUri.isBlank()) return;
        directPhotoCache.put(photoKey, photoUri);
        if (jdbcTemplate == null) return;
        try {
            jdbcTemplate.update(
                    """
                    INSERT INTO place_photo_cache (photo_key, photo_uri, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT (photo_key) DO UPDATE SET
                        photo_uri = EXCLUDED.photo_uri,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    photoKey, photoUri
            );
        } catch (Exception e) {
            log.debug("[PhotoCache] Falha na gravação DB cache para {}: {}", photoKey, e.getMessage());
        }
    }
}

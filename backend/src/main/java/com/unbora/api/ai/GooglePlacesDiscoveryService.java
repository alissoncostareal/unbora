package com.unbora.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class GooglePlacesDiscoveryService {

    private static final Logger log = LoggerFactory.getLogger(GooglePlacesDiscoveryService.class);

    private final String googlePlacesKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

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
            String photoUrl
    ) {}

    public GooglePlacesDiscoveryService(@Value("${unbora.google.places-api-key:}") String googlePlacesKey) {
        this.googlePlacesKey = googlePlacesKey != null ? googlePlacesKey.trim() : "";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
        this.objectMapper = new ObjectMapper();
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

            // Ancoragem Geográfica por Coordenadas (GPS do usuário)
            if (latitude != null && longitude != null && !latitude.isNaN() && !longitude.isNaN()) {
                double radiusMeters = (radiusKm != null && radiusKm > 0 ? radiusKm : 25.0) * 1000.0;
                requestBody.put("locationBias", Map.of(
                        "circle", Map.of(
                                "center", Map.of("latitude", latitude, "longitude", longitude),
                                "radius", radiusMeters
                        )
                ));
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://places.googleapis.com/v1/places:searchText"))
                    .header("Content-Type", "application/json")
                    .header("X-Goog-Api-Key", googlePlacesKey)
                    .header("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.primaryType,places.types,places.googleMapsUri,places.editorialSummary,places.photos")
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

                List<String> types = new ArrayList<>();
                if (p.path("types").isArray()) {
                    for (JsonNode t : p.path("types")) {
                        types.add(t.asText());
                    }
                }

                // Seleciona a melhor foto (alta resolução e proporção paisagem)
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
                        photoUrl = "https://places.googleapis.com/v1/" + selectedPhotoName + "/media?maxHeightPx=1080&maxWidthPx=1920&key=" + URLEncoder.encode(googlePlacesKey, StandardCharsets.UTF_8);
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
                            photoUrl
                    ));
                }
            }

            return results;
        } catch (Exception e) {
            log.warn("Erro ao buscar locais no Google Places: {}", e.getMessage());
            return List.of();
        }
    }
}

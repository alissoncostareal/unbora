package com.unbora.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CityAnchor {

    private static final Logger log = LoggerFactory.getLogger(CityAnchor.class);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Center> cache = new ConcurrentHashMap<>();

    public record Center(Double latitude, Double longitude) {}

    public Center resolve(String city, String region, String country, Double latitude, Double longitude) {
        Center named = geocode(city, region, country);
        if (latitude != null && longitude != null && !latitude.isNaN() && !longitude.isNaN()) {
            if (named == null || (named.latitude() != null && named.longitude() != null && distanceKm(latitude, longitude, named.latitude(), named.longitude()) <= 40)) {
                return new Center(latitude, longitude);
            }
            log.info("[City] Coordenadas descartadas: estão longe de {}", city);
        }
        return named;
    }

    public boolean contains(Center center, double radiusKm, Double latitude, Double longitude, String address, String city) {
        if (center != null && center.latitude() != null && center.longitude() != null && latitude != null && longitude != null) {
            double limit = Math.max(radiusKm > 0 ? radiusKm : 8, 1) * 1.35;
            return distanceKm(latitude, longitude, center.latitude(), center.longitude()) <= limit;
        }
        if (address != null && !address.isBlank() && city != null && !city.isBlank()) {
            return fold(address).contains(fold(city));
        }
        return true;
    }

    public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private Center geocode(String city, String region, String country) {
        if (city == null || city.isBlank()) return null;
        String key = fold(city) + "|" + fold(region) + "|" + fold(country);
        Center cached = cache.get(key);
        if (cached != null) return cached;
        try {
            String url = "https://geocoding-api.open-meteo.com/v1/search?count=8&language=pt&format=json&name="
                    + URLEncoder.encode(city.trim(), StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;
            JsonNode results = objectMapper.readTree(response.body()).path("results");
            if (!results.isArray()) return null;
            Center best = null;
            int bestScore = -1;
            for (JsonNode item : results) {
                String name = item.path("name").asText("");
                int score = 0;
                if (fold(name).equals(fold(city))) {
                    score += 3;
                } else if (fold(name).contains(fold(city)) || fold(city).contains(fold(name))) {
                    score += 2;
                } else {
                    score += 1;
                }
                String admin = item.path("admin1").asText("");
                if (region != null && !region.isBlank() && fold(admin).equals(fold(region))) score += 3;
                String itemCountry = item.path("country").asText("");
                if (country != null && !country.isBlank()) {
                    String fc = fold(country);
                    String fi = fold(itemCountry);
                    if (fi.equals(fc) || (fc.length() >= 3 && fi.startsWith(fc.substring(0, Math.min(4, fc.length()))))) {
                        score += 5;
                    }
                }
                if (score > bestScore && item.has("latitude") && item.has("longitude")) {
                    bestScore = score;
                    best = new Center(item.path("latitude").asDouble(), item.path("longitude").asDouble());
                }
            }
            if (best != null) cache.put(key, best);
            return best;
        } catch (Exception e) {
            log.warn("[City] Não foi possível localizar {}: {}", city, e.getMessage());
            return null;
        }
    }

    private static String fold(String value) {
        if (value == null) return "";
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }
}

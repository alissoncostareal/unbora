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

    private static final Map<String, Center> KNOWN_CENTERS = Map.ofEntries(
            Map.entry("fortaleza", new Center(-3.7319, -38.5267)),
            Map.entry("sao paulo", new Center(-23.5505, -46.6333)),
            Map.entry("rio de janeiro", new Center(-22.9068, -43.1729)),
            Map.entry("brasilia", new Center(-15.7975, -47.8919)),
            Map.entry("salvador", new Center(-12.9777, -38.5016)),
            Map.entry("belo horizonte", new Center(-19.9167, -43.9345)),
            Map.entry("curitiba", new Center(-25.4284, -49.2733)),
            Map.entry("recife", new Center(-8.0476, -34.8770)),
            Map.entry("porto alegre", new Center(-30.0346, -51.2177)),
            Map.entry("florianopolis", new Center(-27.5954, -48.5480)),
            Map.entry("belem", new Center(-1.4558, -48.4902)),
            Map.entry("manaus", new Center(-3.1190, -60.0217)),
            Map.entry("goiania", new Center(-16.6869, -49.2648)),
            Map.entry("campinas", new Center(-22.9099, -47.0626)),
            Map.entry("santos", new Center(-23.9608, -46.3336)),
            Map.entry("vitoria", new Center(-20.3155, -40.3128)),
            Map.entry("natal", new Center(-5.7945, -35.2110)),
            Map.entry("joao pessoa", new Center(-7.1195, -34.8450)),
            Map.entry("maceio", new Center(-9.6658, -35.7351)),
            Map.entry("aracaju", new Center(-10.9472, -37.0731)),
            Map.entry("teresina", new Center(-5.0920, -42.8038)),
            Map.entry("sao luis", new Center(-2.5307, -44.3068)),
            Map.entry("campo grande", new Center(-20.4697, -54.6201)),
            Map.entry("cuiaba", new Center(-15.6014, -56.0979)),
            Map.entry("porto velho", new Center(-8.7619, -63.9039)),
            Map.entry("boa vista", new Center(2.8235, -60.6758)),
            Map.entry("macapa", new Center(0.0355, -51.0705)),
            Map.entry("palmas", new Center(-10.2491, -48.3243)),
            Map.entry("rio branco", new Center(-9.9753, -67.8249)),
            Map.entry("sobral", new Center(-3.6894, -40.3486)),
            Map.entry("juazeiro do norte", new Center(-7.2131, -39.3153)),
            Map.entry("maracanau", new Center(-3.8767, -38.6256)),
            Map.entry("caucaia", new Center(-3.7361, -38.6531)),
            Map.entry("aquiraz", new Center(-3.9011, -38.3911)),
            Map.entry("brasil", new Center(-14.2350, -51.9253))
    );

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
            double limit = Math.max(radiusKm > 0 ? radiusKm : 35, 1) * 1.35;
            return distanceKm(latitude, longitude, center.latitude(), center.longitude()) <= limit;
        }
        if (address != null && !address.isBlank() && city != null && !city.isBlank()) {
            String fa = fold(address);
            String fc = fold(city);
            if (fa.contains(fc)) return true;
            // Se o endereço omite a cidade (comum em cadastros do Google Maps no Brasil),
            // não descarta sumariamente se já foi buscado no escopo da cidade.
            return true;
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
        String foldedCity = fold(city);
        Center known = KNOWN_CENTERS.get(foldedCity);
        if (known != null) {
            return known;
        }
        String key = foldedCity + "|" + fold(region) + "|" + fold(country);
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

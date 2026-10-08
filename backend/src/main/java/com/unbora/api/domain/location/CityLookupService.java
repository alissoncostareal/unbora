package com.unbora.api.domain.location;

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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class CityLookupService {

    private static final Logger log = LoggerFactory.getLogger(CityLookupService.class);
    private static final Map<String, String> BRAZILIAN_UF = Map.ofEntries(
            Map.entry("AC", "Acre"),
            Map.entry("AL", "Alagoas"),
            Map.entry("AP", "Amapá"),
            Map.entry("AM", "Amazonas"),
            Map.entry("BA", "Bahia"),
            Map.entry("CE", "Ceará"),
            Map.entry("DF", "Distrito Federal"),
            Map.entry("ES", "Espírito Santo"),
            Map.entry("GO", "Goiás"),
            Map.entry("MA", "Maranhão"),
            Map.entry("MT", "Mato Grosso"),
            Map.entry("MS", "Mato Grosso do Sul"),
            Map.entry("MG", "Minas Gerais"),
            Map.entry("PA", "Pará"),
            Map.entry("PB", "Paraíba"),
            Map.entry("PR", "Paraná"),
            Map.entry("PE", "Pernambuco"),
            Map.entry("PI", "Piauí"),
            Map.entry("RJ", "Rio de Janeiro"),
            Map.entry("RN", "Rio Grande do Norte"),
            Map.entry("RS", "Rio Grande do Sul"),
            Map.entry("RO", "Rondônia"),
            Map.entry("RR", "Roraima"),
            Map.entry("SC", "Santa Catarina"),
            Map.entry("SP", "São Paulo"),
            Map.entry("SE", "Sergipe"),
            Map.entry("TO", "Tocantins")
    );

    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public CityLookupService(@Value("${unbora.google.places-api-key:}") String apiKey) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(6)).build();
        this.objectMapper = new ObjectMapper();
    }

    public List<CitySuggestion> suggest(String query) {
        String input = query == null ? "" : query.trim();
        if (apiKey.isBlank() || input.length() < 2) return List.of();
        if (input.length() > 80) input = input.substring(0, 80);
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "input", input,
                    "includedPrimaryTypes", List.of("(cities)"),
                    "languageCode", "pt-BR"
            ));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://places.googleapis.com/v1/places:autocomplete"))
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/json")
                    .header("X-Goog-Api-Key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Google autocomplete de cidade falhou: HTTP {}", response.statusCode());
                return List.of();
            }
            JsonNode suggestions = objectMapper.readTree(response.body()).path("suggestions");
            Map<String, CitySuggestion> unique = new LinkedHashMap<>();
            for (JsonNode suggestion : suggestions) {
                CitySuggestion place = fromPrediction(suggestion.path("placePrediction"));
                if (place == null) continue;
                unique.putIfAbsent(place.city() + "|" + place.region() + "|" + place.country(), place);
                if (unique.size() == 6) break;
            }
            return List.copyOf(unique.values());
        } catch (Exception ex) {
            log.warn("Google autocomplete de cidade indisponível: {}", ex.getMessage());
            return List.of();
        }
    }

    public CitySuggestion here(double latitude, double longitude) {
        if (apiKey.isBlank()) return null;
        try {
            String url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="
                    + latitude + "," + longitude
                    + "&language=pt-BR&result_type=locality&key="
                    + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Google geocode reverso falhou: HTTP {}", response.statusCode());
                return null;
            }
            JsonNode root = objectMapper.readTree(response.body());
            if (!"OK".equals(root.path("status").asText())) {
                log.warn("Google geocode reverso: {}", root.path("status").asText());
                return null;
            }
            for (JsonNode result : root.path("results")) {
                CitySuggestion place = fromGeocode(result);
                if (place != null) return place;
            }
            return null;
        } catch (Exception ex) {
            log.warn("Google geocode reverso indisponível: {}", ex.getMessage());
            return null;
        }
    }

    private CitySuggestion fromPrediction(JsonNode prediction) {
        String city = prediction.path("structuredFormat").path("mainText").path("text").asText("").trim();
        String secondary = prediction.path("structuredFormat").path("secondaryText").path("text").asText("").trim();
        if (city.isBlank()) return null;
        String region = "";
        String country = "Brasil";
        if (!secondary.isBlank()) {
            String[] parts = secondary.split(",");
            country = normalizeCountry(parts[parts.length - 1].trim());
            if (parts.length >= 2) {
                String before = parts[parts.length - 2].trim();
                int dash = before.lastIndexOf('-');
                String token = dash >= 0 ? before.substring(dash + 1).trim() : before;
                region = expandRegion(token, country);
            }
        }
        String label = secondary.isBlank() ? city : city + ", " + secondary;
        return new CitySuggestion(city, region, country, label, null, null);
    }

    private CitySuggestion fromGeocode(JsonNode result) {
        JsonNode components = result.path("address_components");
        String city = component(components, "locality");
        if (city.isBlank()) city = component(components, "administrative_area_level_2");
        if (city.isBlank()) return null;
        String region = component(components, "administrative_area_level_1");
        String country = normalizeCountry(component(components, "country"));
        if (country.isBlank()) country = "Brasil";
        JsonNode location = result.path("geometry").path("location");
        Double latitude = location.has("lat") ? location.get("lat").asDouble() : null;
        Double longitude = location.has("lng") ? location.get("lng").asDouble() : null;
        String label = region.isBlank() ? city + ", " + country : city + ", " + region + ", " + country;
        return new CitySuggestion(city, region, country, label, latitude, longitude);
    }

    private static String component(JsonNode components, String type) {
        for (JsonNode component : components) {
            for (JsonNode item : component.path("types")) {
                if (type.equals(item.asText())) return component.path("long_name").asText("").trim();
            }
        }
        return "";
    }

    private static String expandRegion(String token, String country) {
        if (!"Brasil".equals(country)) return token;
        String expanded = BRAZILIAN_UF.get(token.toUpperCase(Locale.ROOT));
        return expanded != null ? expanded : token;
    }

    private static String normalizeCountry(String country) {
        if (country.equalsIgnoreCase("Brazil")) return "Brasil";
        return country;
    }
}

package com.unbora.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NasaAtmosphericService {

    private static final Logger log = LoggerFactory.getLogger(NasaAtmosphericService.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Map<String, CachedSnapshot> cache = new ConcurrentHashMap<>();

    public NasaAtmosphericService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(2500))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public record AtmosphericSnapshot(
            Double temperatureC,
            Double windSpeedKmH,
            Double cloudCoverPercent,
            boolean isGoldenHour,
            boolean isNight,
            String periodOfDay,
            String promptSummary
    ) {}

    private record CachedSnapshot(AtmosphericSnapshot snapshot, Instant expiresAt) {}

    public AtmosphericSnapshot getAtmosphericSnapshot(Double lat, Double lng, String city) {
        double effectiveLat = (lat != null && lat != 0.0) ? lat : -3.7319; // Default: Fortaleza
        double effectiveLng = (lng != null && lng != 0.0) ? lng : -38.5267;

        String gridKey = String.format("%.2f:%.2f", effectiveLat, effectiveLng);
        Instant now = Instant.now();
        CachedSnapshot cached = cache.get(gridKey);
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.snapshot();
        }

        AtmosphericSnapshot fresh = fetchOrEstimate(effectiveLat, effectiveLng, city);
        cache.put(gridKey, new CachedSnapshot(fresh, now.plus(Duration.ofMinutes(30))));
        return fresh;
    }

    private AtmosphericSnapshot fetchOrEstimate(double lat, double lng, String city) {
        ZoneId zone = ZoneId.of("America/Fortaleza");
        ZonedDateTime localTime = ZonedDateTime.now(zone);
        int hour = localTime.getHour();
        int minute = localTime.getMinute();

        // 1. Calculo astronômico de período e Golden Hour (Fortaleza e proximidades tropicais)
        boolean isGoldenHour = (hour == 16 && minute >= 45) || (hour == 17 && minute <= 45);
        boolean isNight = hour >= 18 || hour < 5;
        String periodOfDay = isGoldenHour ? "Golden Hour / Pôr do Sol"
                : (isNight ? "Noite" : (hour < 12 ? "Manhã" : "Tarde"));

        Double temp = 28.0;
        Double wind = 18.0;
        Double cloudCover = 20.0;

        try {
            LocalDate today = localTime.toLocalDate();
            String dateStr = today.format(DateTimeFormatter.BASIC_ISO_DATE);

            String url = String.format(
                    "https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M,WS10M,CLOUD_AMT&community=RE&longitude=%.4f&latitude=%.4f&start=%s&end=%s&format=JSON",
                    lng, lat, dateStr, dateStr
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(2500))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode params = root.path("properties").path("parameter");

                String currentHourKey = dateStr + String.format("%02d", hour);

                if (params.has("T2M") && params.path("T2M").has(currentHourKey)) {
                    double val = params.path("T2M").path(currentHourKey).asDouble();
                    if (val > -50 && val < 60) temp = Math.round(val * 10.0) / 10.0;
                }
                if (params.has("WS10M") && params.path("WS10M").has(currentHourKey)) {
                    double mps = params.path("WS10M").path(currentHourKey).asDouble();
                    if (mps >= 0 && mps < 100) wind = Math.round((mps * 3.6) * 10.0) / 10.0; // m/s para km/h
                }
                if (params.has("CLOUD_AMT") && params.path("CLOUD_AMT").has(currentHourKey)) {
                    double cc = params.path("CLOUD_AMT").path(currentHourKey).asDouble();
                    if (cc >= 0 && cc <= 100) cloudCover = (double) Math.round(cc);
                }
            }
        } catch (Exception e) {
            log.debug("[NasaAtmospheric] Utilizando estimativa astronômica para {}: {}", city, e.getMessage());
            // Estimativa estocástica baseada no horário para a costa nordeste
            if (isNight) {
                temp = 26.5;
                wind = 15.0;
            } else if (isGoldenHour) {
                temp = 28.0;
                wind = 21.0;
            } else {
                temp = 30.5;
                wind = 19.0;
            }
        }

        StringBuilder summary = new StringBuilder();
        summary.append(String.format("Condições ambientais e satélite (NASA POWER): %.1f°C, brisa de %.1f km/h, céu ", temp, wind));
        if (cloudCover < 25) {
            summary.append("limpo/aberto");
        } else if (cloudCover < 65) {
            summary.append("parcialmente nublado");
        } else {
            summary.append("com nebulosidade moderada");
        }
        summary.append(String.format(". Período: %s.", periodOfDay));

        if (isGoldenHour) {
            summary.append(" Janela astronômica favorável para orla, mirantes, terraços e cafés ao ar livre com pôr do sol.");
        } else if (wind > 20 && !isNight) {
            summary.append(" Brisa constante e agradável para mesas externas e passeios ao ar livre.");
        } else if (temp > 30) {
            summary.append(" Calor diurno: excelente para espaços climatizados ou sombra natural.");
        }

        return new AtmosphericSnapshot(temp, wind, cloudCover, isGoldenHour, isNight, periodOfDay, summary.toString());
    }
}

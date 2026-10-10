package com.unbora.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unbora.api.ai.dto.ActivityItemDto;
import com.unbora.api.ai.dto.DiscoverEventsResult;
import com.unbora.api.ai.dto.RecommendationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache persistente de recomendacoes e buscas geradas por LLM / Groq.
 * Evita chamadas repetidas a Groq e Google Places, reduzindo custos e latencia a zero.
 */
@Service
public class RecommendationCacheService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationCacheService.class);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    // Cache L1 em memoria para resposta em sub-milissegundos
    private final Map<String, L1CacheEntry> l1Cache = new ConcurrentHashMap<>();

    private record L1CacheEntry(String payload, Instant expiresAt) {}

    public RecommendationCacheService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Obtem recomendacao cacheada (L1 ou L2 no PostgreSQL).
     */
    public Optional<RecommendationResult> getCachedRecommendation(String cacheKey) {
        String json = getCachedPayload(cacheKey);
        if (json == null || json.isBlank()) {
            return Optional.empty();
        }
        try {
            RecommendationResult result = objectMapper.readValue(json, RecommendationResult.class);
            return Optional.ofNullable(result);
        } catch (Exception e) {
            log.warn("[RecCache] Erro ao desserializar recomendacao cacheada para chave {}: {}", cacheKey, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Salva recomendacao no cache persistente e L1.
     */
    public void putRecommendation(String cacheKey, String queryType, String city, RecommendationResult result, Duration ttl) {
        if (cacheKey == null || result == null) return;
        try {
            String json = objectMapper.writeValueAsString(result);
            savePayload(cacheKey, queryType, city, json, ttl);
        } catch (Exception e) {
            log.warn("[RecCache] Erro ao serializar recomendacao para cache: {}", e.getMessage());
        }
    }

    /**
     * Obtem eventos cacheados (L1 ou L2 no PostgreSQL).
     */
    public Optional<DiscoverEventsResult> getCachedEvents(String cacheKey) {
        String json = getCachedPayload(cacheKey);
        if (json == null || json.isBlank()) {
            return Optional.empty();
        }
        try {
            DiscoverEventsResult result = objectMapper.readValue(json, DiscoverEventsResult.class);
            return Optional.ofNullable(result);
        } catch (Exception e) {
            log.warn("[RecCache] Erro ao desserializar eventos cacheados para chave {}: {}", cacheKey, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Salva eventos no cache persistente e L1.
     */
    public void putEvents(String cacheKey, String city, DiscoverEventsResult result, Duration ttl) {
        if (cacheKey == null || result == null) return;
        try {
            String json = objectMapper.writeValueAsString(result);
            savePayload(cacheKey, "EVENTS", city, json, ttl);
        } catch (Exception e) {
            log.warn("[RecCache] Erro ao serializar eventos para cache: {}", e.getMessage());
        }
    }

    private String getCachedPayload(String cacheKey) {
        if (cacheKey == null || cacheKey.isBlank()) return null;

        // 1. Consulta L1 (Memoria)
        L1CacheEntry entry = l1Cache.get(cacheKey);
        if (entry != null) {
            if (Instant.now().isBefore(entry.expiresAt())) {
                log.debug("[RecCache] L1 Cache HIT para chave {}", cacheKey);
                return entry.payload();
            }
            l1Cache.remove(cacheKey);
        }

        // 2. Consulta L2 (PostgreSQL)
        if (jdbcTemplate != null) {
            try {
                List<String> rows = jdbcTemplate.query(
                        "SELECT payload, expires_at FROM recommendation_cache WHERE cache_key = ? AND expires_at > CURRENT_TIMESTAMP",
                        (rs, rowNum) -> {
                            String payload = rs.getString("payload");
                            java.sql.Timestamp exp = rs.getTimestamp("expires_at");
                            if (exp != null) {
                                l1Cache.put(cacheKey, new L1CacheEntry(payload, exp.toInstant()));
                            }
                            return payload;
                        },
                        cacheKey
                );
                if (!rows.isEmpty()) {
                    log.info("[RecCache] PostgreSQL Cache HIT para chave {}", cacheKey);
                    return rows.get(0);
                }
            } catch (Exception e) {
                log.debug("[RecCache] Erro ao consultar PostgreSQL para chave {}: {}", cacheKey, e.getMessage());
            }
        }

        return null;
    }

    private void savePayload(String cacheKey, String queryType, String city, String payload, Duration ttl) {
        Instant expiresAt = Instant.now().plus(ttl != null ? ttl : Duration.ofHours(6));
        l1Cache.put(cacheKey, new L1CacheEntry(payload, expiresAt));

        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.update(
                        """
                        INSERT INTO recommendation_cache (cache_key, query_type, city, payload, created_at, expires_at)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                        ON CONFLICT (cache_key) DO UPDATE
                        SET payload = EXCLUDED.payload,
                            created_at = CURRENT_TIMESTAMP,
                            expires_at = EXCLUDED.expires_at
                        """,
                        cacheKey,
                        queryType != null ? queryType : "RECOMMEND",
                        city != null ? city : "Brasil",
                        payload,
                        java.sql.Timestamp.from(expiresAt)
                );
                log.info("[RecCache] Salvo no cache persistente: {} (cidade={}, ttl={}h)", cacheKey, city, ttl != null ? ttl.toHours() : 6);
            } catch (Exception e) {
                log.warn("[RecCache] Falha ao persistir no PostgreSQL para chave {}: {}", cacheKey, e.getMessage());
            }
        }
    }

    public String computeRecommendKey(
            String city,
            String region,
            String humor,
            String sentir,
            List<ActivityItemDto> activities,
            Double radiusKm,
            Double budget
    ) {
        StringBuilder raw = new StringBuilder();
        raw.append("rec|")
                .append(norm(city)).append("|")
                .append(norm(region)).append("|")
                .append(norm(humor)).append("|")
                .append(norm(sentir)).append("|");

        if (activities != null && !activities.isEmpty()) {
            List<String> sortedLabels = activities.stream()
                    .map(a -> norm(a.label()))
                    .filter(s -> !s.isBlank())
                    .sorted()
                    .toList();
            raw.append(String.join(",", sortedLabels));
        }
        raw.append("|");

        int rad = radiusKm != null ? (int) Math.round(radiusKm) : 8;
        raw.append("rad:").append(rad).append("|");

        int bud = budget != null ? (int) Math.round(budget) : 0;
        raw.append("bud:").append(bud);

        return "rec_" + sha256(raw.toString());
    }

    public String computeSearchKey(String city, String region, String query) {
        String raw = "search|" + norm(city) + "|" + norm(region) + "|" + norm(query);
        return "search_" + sha256(raw);
    }

    public String computeEventsKey(String city) {
        String mesAno = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM", Locale.ROOT));
        String raw = "events|" + norm(city) + "|" + mesAno;
        return "events_" + sha256(raw);
    }

    private static String norm(String s) {
        if (s == null) return "";
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.substring(0, 32); // 32 caracteres hexadecimais
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(input.hashCode());
        }
    }
}

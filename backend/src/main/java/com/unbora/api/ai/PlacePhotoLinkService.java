package com.unbora.api.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Troca URLs longas do Google por IDs curtos no proxy HTTPS do app.
 * Ex.: https://api.exemplo.com/api/media/p/{id} (quando APP_PUBLIC_BASE_URL está setado)
 * ou path relativo /api/media/p/{id} (mobile prefixa com EXPO_PUBLIC_API_BASE_URL).
 * Persiste no PostgreSQL (tabela media_photo_link) com cache L1 em memória.
 */
@Service
public class PlacePhotoLinkService {

    private static final Logger log = LoggerFactory.getLogger(PlacePhotoLinkService.class);

    private final ConcurrentHashMap<String, String> idToUrl = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> urlToId = new ConcurrentHashMap<>();
    private final String publicBaseUrl;
    private final JdbcTemplate jdbcTemplate;

    public PlacePhotoLinkService(
            @Value("${unbora.public-base-url:}") String publicBaseUrl,
            @Autowired(required = false) JdbcTemplate jdbcTemplate
    ) {
        String base = publicBaseUrl == null ? "" : publicBaseUrl.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        this.publicBaseUrl = base;
        this.jdbcTemplate = jdbcTemplate;
    }

    public String toAppPath(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) return null;
        if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
            if (photoUrl.contains("/api/media/p/")) return photoUrl;
        }
        if (photoUrl.startsWith("/api/media/p/")) {
            return absoluteOrRelative(photoUrl);
        }
        String id = urlToId.computeIfAbsent(photoUrl, this::newId);
        idToUrl.putIfAbsent(id, photoUrl);
        persistLink(id, photoUrl);
        return absoluteOrRelative("/api/media/p/" + id);
    }

    private void persistLink(String id, String photoUrl) {
        if (jdbcTemplate == null || id == null || photoUrl == null) return;
        try {
            jdbcTemplate.update(
                    """
                    INSERT INTO media_photo_link (id, photo_url, created_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    id, photoUrl
            );
        } catch (Exception e) {
            log.debug("[PhotoLink] Falha ao persistir media link {}: {}", id, e.getMessage());
        }
    }

    private String absoluteOrRelative(String path) {
        if (publicBaseUrl.isBlank()) return path;
        return publicBaseUrl + path;
    }

    public String resolve(String id) {
        if (id == null || id.isBlank()) return null;
        String cached = idToUrl.get(id);
        if (cached != null) return cached;

        // Consulta L2 persistente no PostgreSQL
        if (jdbcTemplate != null) {
            try {
                List<String> rows = jdbcTemplate.query(
                        "SELECT photo_url FROM media_photo_link WHERE id = ?",
                        (rs, rowNum) -> rs.getString("photo_url"),
                        id
                );
                if (!rows.isEmpty() && rows.get(0) != null && !rows.get(0).isBlank()) {
                    String url = rows.get(0);
                    idToUrl.put(id, url);
                    urlToId.put(url, id);
                    return url;
                }
            } catch (Exception e) {
                log.debug("[PhotoLink] Erro ao buscar ID {} no banco: {}", id, e.getMessage());
            }
        }

        return null;
    }

    private String newId(String photoUrl) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(photoUrl.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).substring(0, 20);
        } catch (Exception e) {
            return Integer.toHexString(photoUrl.hashCode());
        }
    }
}

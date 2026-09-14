package com.unbora.api.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Troca URLs longas do Google por IDs curtos no proxy HTTPS do app.
 * Ex.: https://api.exemplo.com/api/media/p/{id} (quando APP_PUBLIC_BASE_URL está setado)
 * ou path relativo /api/media/p/{id} (mobile prefixa com EXPO_PUBLIC_API_BASE_URL).
 */
@Service
public class PlacePhotoLinkService {

    private final ConcurrentHashMap<String, String> idToUrl = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> urlToId = new ConcurrentHashMap<>();
    private final String publicBaseUrl;

    public PlacePhotoLinkService(
            @Value("${unbora.public-base-url:}") String publicBaseUrl
    ) {
        String base = publicBaseUrl == null ? "" : publicBaseUrl.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        this.publicBaseUrl = base;
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
        return absoluteOrRelative("/api/media/p/" + id);
    }

    private String absoluteOrRelative(String path) {
        if (publicBaseUrl.isBlank()) return path;
        return publicBaseUrl + path;
    }

    public String resolve(String id) {
        if (id == null || id.isBlank()) return null;
        return idToUrl.get(id);
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

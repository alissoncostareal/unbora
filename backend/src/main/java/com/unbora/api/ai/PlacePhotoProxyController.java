package com.unbora.api.ai;

import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;

/**
 * Proxy de fotos para o app mobile.
 * Preferir /api/media/p/{id} (URL curta) — o Image do Android quebra em ?src= muito longo.
 */
@RestController
@RequestMapping("/api/media")
public class PlacePhotoProxyController {

    private static final Logger log = LoggerFactory.getLogger(PlacePhotoProxyController.class);

    private static final Set<String> ALLOWED_HOSTS = Set.of(
            "lh3.googleusercontent.com",
            "lh4.googleusercontent.com",
            "lh5.googleusercontent.com",
            "lh6.googleusercontent.com",
            "images.unsplash.com",
            "places.googleapis.com"
    );

    private final PlacePhotoLinkService placePhotoLinkService;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public PlacePhotoProxyController(PlacePhotoLinkService placePhotoLinkService) {
        this.placePhotoLinkService = placePhotoLinkService;
    }

    @GetMapping("/p/{id}")
    public void photoById(@PathVariable("id") String id, HttpServletResponse response) throws IOException {
        String src = placePhotoLinkService.resolve(id);
        if (src == null || src.isBlank()) {
            log.warn("[PhotoProxy] id={} não encontrado no cache", id);
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        log.info("[PhotoProxy] GET /p/{} -> {}", id, src.length() > 80 ? src.substring(0, 80) + "…" : src);
        streamPhoto(src, response);
    }

    @GetMapping("/photo")
    public void photo(@RequestParam("src") String src, HttpServletResponse response) throws IOException {
        streamPhoto(src, response);
    }

    private void streamPhoto(String src, HttpServletResponse response) throws IOException {
        URI uri;
        try {
            uri = URI.create(src);
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        if (!ALLOWED_HOSTS.contains(host) || !"https".equalsIgnoreCase(uri.getScheme())) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(12))
                    .header("User-Agent", "Mozilla/5.0")
                    .header("Accept", "image/avif,image/webp,image/apng,image/*,*/*;q=0.8")
                    .GET()
                    .build();
            HttpResponse<byte[]> upstream = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (upstream.statusCode() < 200 || upstream.statusCode() >= 300 || upstream.body() == null || upstream.body().length == 0) {
                response.sendError(HttpServletResponse.SC_BAD_GATEWAY);
                return;
            }
            String contentType = upstream.headers().firstValue("content-type").orElse("image/jpeg");
            if (contentType.contains(";")) {
                contentType = contentType.substring(0, contentType.indexOf(';')).trim();
            }
            try {
                contentType = MediaType.parseMediaType(contentType).toString();
            } catch (Exception e) {
                contentType = MediaType.IMAGE_JPEG_VALUE;
            }
            response.reset();
            response.setCharacterEncoding(null);
            response.setHeader("Content-Type", contentType);
            // 12h browser/CDN; expo-image também cacheia em memory-disk no app
            response.setHeader("Cache-Control", "public, max-age=43200, immutable");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setContentLength(upstream.body().length);
            response.getOutputStream().write(upstream.body());
            log.debug("[PhotoProxy] ok host={} bytes={} type={}", host, upstream.body().length, contentType);
        } catch (Exception e) {
            log.warn("[PhotoProxy] falha ao buscar {}: {}", src, e.getMessage());
            if (!response.isCommitted()) {
                response.sendError(HttpServletResponse.SC_BAD_GATEWAY);
            }
        }
    }
}

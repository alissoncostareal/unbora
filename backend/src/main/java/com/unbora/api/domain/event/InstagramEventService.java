package com.unbora.api.domain.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unbora.api.ai.GroqClient;
import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.event.dto.EventRecordDto;
import com.unbora.api.domain.event.dto.ImportInstagramEventDto;
import com.unbora.api.domain.user.User;
import com.unbora.api.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class InstagramEventService {

    private static final Logger log = LoggerFactory.getLogger(InstagramEventService.class);

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventsService eventsService;
    private final GroqClient groqClient;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public InstagramEventService(
            EventRepository eventRepository,
            UserRepository userRepository,
            EventsService eventsService,
            GroqClient groqClient
    ) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.eventsService = eventsService;
        this.groqClient = groqClient;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public record ParsedInstagramEvent(
            String title,
            String description,
            String venue,
            String whenText,
            String startsAtIso,
            String category
    ) {}

    @Transactional
    public EventRecordDto importFromInstagram(ImportInstagramEventDto dto) {
        if (dto.url() == null || dto.url().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "URL do post do Instagram é obrigatória.");
        }

        String url = dto.url().trim();
        String city = (dto.city() != null && !dto.city().isBlank()) ? dto.city().trim() : "Fortaleza";
        String region = (dto.region() != null && !dto.region().isBlank()) ? dto.region().trim() : "Grande Fortaleza";
        String merchantId = (dto.merchantId() != null && !dto.merchantId().isBlank()) ? dto.merchantId().trim() : "seed-merchant-unbora";

        String caption = dto.caption();
        String imageUrl = dto.imageUrl();

        // 1. Tentar extrair metadata do Instagram (oEmbed ou OpenGraph) se não fornecidos diretamente
        if (caption == null || caption.isBlank() || imageUrl == null || imageUrl.isBlank()) {
            try {
                InstagramMeta meta = extractInstagramMeta(url);
                if ((caption == null || caption.isBlank()) && meta.caption != null && !meta.caption.isBlank()) {
                    caption = meta.caption;
                }
                if ((imageUrl == null || imageUrl.isBlank()) && meta.imageUrl != null && !meta.imageUrl.isBlank()) {
                    imageUrl = meta.imageUrl;
                }
            } catch (Exception e) {
                log.warn("Não foi possível extrair metadados automáticos do Instagram para {}: {}", url, e.getMessage());
            }
        }

        if (caption == null || caption.isBlank()) {
            caption = "Evento divulgado no Instagram: " + url;
        }

        if (imageUrl == null || imageUrl.isBlank()) {
            // Sem foto confiável — não inventa Unsplash
            imageUrl = "";
        }

        // 2. Extração estruturada de campos via IA
        String systemPrompt = """
                Você é um extrator de eventos para o app Unbora.
                Dado o texto/legenda de um post do Instagram ou anúncio cultural na cidade de %s, extraia os dados estruturados do evento.
                Responda SOMENTE um JSON válido com o seguinte formato estrito:
                {
                  "title": "Nome do Evento ou Show",
                  "description": "1 ou 2 frases curtas destacando a atração principal (máximo 160 caracteres)",
                  "venue": "Nome do local físico e bairro (ex: Teatro José de Alencar, Centro)",
                  "whenText": "Texto descritivo de data e hora (ex: Sábado, 15 de Setembro às 20h)",
                  "startsAtIso": "%s",
                  "category": "Show | Festival | Feira | Gastronomia | Teatro | Cultura"
                }
                """.formatted(city, Instant.now().plus(2, ChronoUnit.DAYS).toString());

        String userPrompt = "Legenda do post no Instagram:\n\"\"\"\n" + caption + "\n\"\"\"\nCidade: " + city;

        ParsedInstagramEvent parsed = null;
        try {
            parsed = groqClient.callGroqJson(systemPrompt, userPrompt, ParsedInstagramEvent.class, 0.2, 1000);
        } catch (Exception e) {
            log.warn("Erro no parsing da IA para o post do Instagram: {}", e.getMessage());
        }

        String finalTitle = (parsed != null && parsed.title() != null && !parsed.title().isBlank())
                ? parsed.title()
                : "Evento Instagram";
        String finalDesc = (parsed != null && parsed.description() != null && !parsed.description().isBlank())
                ? parsed.description()
                : caption.substring(0, Math.min(caption.length(), 160));
        String finalVenue = (parsed != null && parsed.venue() != null && !parsed.venue().isBlank())
                ? parsed.venue()
                : city;

        Instant startsAt = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS).plus(19, ChronoUnit.HOURS);
        if (parsed != null && parsed.startsAtIso() != null && !parsed.startsAtIso().isBlank()) {
            try {
                startsAt = Instant.parse(parsed.startsAtIso());
            } catch (Exception ignored) {}
        }

        // 3. Salvar no banco de dados
        Event event = new Event();
        event.setId(UUID.randomUUID().toString());
        event.setTitle(finalTitle);
        event.setDescription(finalDesc);
        event.setImageUrl(imageUrl);
        event.setCity(city);
        event.setRegion(region);
        event.setVenue(finalVenue);
        event.setStartsAt(startsAt);
        event.setActive(true);
        event.setMerchantId(merchantId);
        event.setCategory(EventCategories.normalize(parsed != null ? parsed.category() : finalTitle));
        event.setStatus(Event.STATUS_APPROVED);
        event.setCreatedAt(Instant.now());
        event.setUpdatedAt(Instant.now());

        Event saved = eventRepository.save(event);
        User merchant = userRepository.findById(merchantId).orElse(null);

        log.info("[Instagram Importer] Evento importado com sucesso: '{}' ({}) via {}",
                saved.getTitle(), saved.getCity(), url);

        return eventsService.toRecord(
                saved,
                merchant != null ? Map.of(merchant.getId(), merchant) : Map.of()
        );
    }

    private static class InstagramMeta {
        String caption;
        String imageUrl;
    }

    private InstagramMeta extractInstagramMeta(String postUrl) {
        InstagramMeta meta = new InstagramMeta();

        // Tentativa 1: oEmbed API do Instagram
        try {
            String oembedUrl = "https://api.instagram.com/oembed?url=" + URLEncoder.encode(postUrl, StandardCharsets.UTF_8) + "&omitscript=true";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(oembedUrl))
                    .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode node = objectMapper.readTree(response.body());
                if (node.has("title")) meta.caption = node.path("title").asText();
                if (node.has("thumbnail_url")) meta.imageUrl = node.path("thumbnail_url").asText();
                if (meta.imageUrl != null && !meta.imageUrl.isBlank()) return meta;
            }
        } catch (Exception ignored) {}

        // Tentativa 2: OpenGraph HTML parser
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(postUrl))
                    .header("User-Agent", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                String html = response.body();
                Matcher imgMatcher = Pattern.compile("property=[\"']og:image[\"']\\s+content=[\"']([^\"']+)[\"']").matcher(html);
                if (imgMatcher.find()) {
                    meta.imageUrl = imgMatcher.group(1);
                }
                Matcher descMatcher = Pattern.compile("property=[\"']og:description[\"']\\s+content=[\"']([^\"']+)[\"']").matcher(html);
                if (descMatcher.find()) {
                    meta.caption = descMatcher.group(1);
                }
            }
        } catch (Exception ignored) {}

        return meta;
    }
}

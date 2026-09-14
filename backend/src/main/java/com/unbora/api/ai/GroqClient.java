package com.unbora.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unbora.api.common.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class GroqClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    private final String groqApiKey;
    private final String configuredModel;
    private final String braveKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    /** Modelos leves primeiro — 120b só como último recurso (consome TPD rápido). */
    private static final List<String> FALLBACK_MODELS = List.of(
            "qwen/qwen3.8-27b",
            "groq/compound-mini",
            "openai/gpt-oss-20b",
            "groq/compound",
            "openai/gpt-oss-120b"
    );

    public GroqClient(
            @Value("${unbora.groq.api-key:}") String groqApiKey,
            @Value("${unbora.groq.model:qwen/qwen3.8-27b}") String configuredModel,
            @Value("${unbora.brave.api-key:}") String braveKey
    ) {
        this.groqApiKey = groqApiKey != null ? groqApiKey.trim() : "";
        String model = configuredModel != null ? configuredModel.trim() : "qwen/qwen3.8-27b";
        // Evita default acidental do .env antigo para 120b em dev
        if (model.isBlank()) model = "qwen/qwen3.8-27b";
        this.configuredModel = model;
        this.braveKey = braveKey != null ? braveKey.trim() : "";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public <T> T callGroqJson(String systemPrompt, String userPrompt, Class<T> responseClass, double temperature, int maxTokens) {
        return callGroqJson(systemPrompt, userPrompt, responseClass, temperature, maxTokens, Duration.ofSeconds(45), Integer.MAX_VALUE);
    }

    /**
     * Orçamento curto: evita a cadeia inteira de fallbacks (cada um ~45s) quando já há lugares reais.
     */
    public <T> T callGroqJson(String systemPrompt, String userPrompt, Class<T> responseClass, double temperature, int maxTokens, Duration budget, int maxModels) {
        if (groqApiKey.isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "GROQ_API_KEY não configurada no backend.");
        }

        List<String> models = buildModelChain();
        if (maxModels > 0 && models.size() > maxModels) {
            models = new ArrayList<>(models.subList(0, maxModels));
        }
        Instant deadline = Instant.now().plus(budget);
        String lastError = "Erro na API do Groq";
        boolean hitDailyLimit = false;

        for (String model : models) {
            if (Instant.now().isAfter(deadline)) {
                break;
            }
            // TPD: 1 tentativa por modelo; RPM: até 2 retries curtos
            int maxAttempts = budget.toSeconds() <= 15 ? 1 : 2;
            for (int attempt = 0; attempt < maxAttempts; attempt++) {
                Duration remaining = Duration.between(Instant.now(), deadline);
                if (remaining.isNegative() || remaining.isZero()) {
                    break;
                }
                try {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("model", model);
                    payload.put("messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    ));
                    payload.put("temperature", attempt == 0 ? temperature : 0.1);
                    // Listas longas de lugares precisam de mais tokens (JSON truncado = poucos resultados)
                    payload.put("max_tokens", Math.min(Math.max(maxTokens, 1), 4096));

                    if (attempt == 0) {
                        payload.put("response_format", Map.of("type", "json_object"));
                    }

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                            .header("Content-Type", "application/json")
                            .header("Authorization", "Bearer " + groqApiKey)
                            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                            .timeout(remaining.compareTo(Duration.ofSeconds(20)) > 0 ? Duration.ofSeconds(20) : remaining)
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                    if (response.statusCode() == 200) {
                        JsonNode json = objectMapper.readTree(response.body());
                        String content = json.path("choices").get(0).path("message").path("content").asText("");
                        T result = parseJsonObject(content, responseClass);
                        if (result != null) {
                            if (!model.equals(configuredModel)) {
                                log.info("[Groq] Resposta OK via fallback model={}", model);
                            }
                            return result;
                        }
                        lastError = "Resposta JSON inválida do modelo " + model;
                    } else {
                        lastError = "Groq HTTP " + response.statusCode();
                        log.warn("Groq attempt {} failed on model {}: {} — {}",
                                attempt + 1, model, lastError, abbreviate(response.body(), 180));

                        if (response.statusCode() == 429) {
                            if (isDailyTokenLimit(response.body())) {
                                hitDailyLimit = true;
                                log.warn("[Groq] Limite diário (TPD) no modelo {} — tentando próximo", model);
                                break; // próximo modelo, sem sleep longo
                            }
                            // Rate limit por minuto: espera curta e retry
                            Thread.sleep(800L * (attempt + 1));
                        } else if (response.statusCode() == 404 || response.statusCode() == 400) {
                            break;
                        }
                    }
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, friendlyUserMessage(true));
                } catch (Exception e) {
                    lastError = e.getMessage();
                    log.warn("Groq exception on model {}: {}", model, e.getMessage());
                }
            }
        }

        log.error("[Groq] Todos os modelos falharam. lastError={} dailyLimit={}", lastError, hitDailyLimit);
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, friendlyUserMessage(hitDailyLimit));
    }

    private List<String> buildModelChain() {
        List<String> models = new ArrayList<>();
        // Se .env pede 120b, ainda tentamos leves primeiro para não queimar a cota
        if (configuredModel.contains("120b")) {
            for (String m : FALLBACK_MODELS) {
                if (!m.contains("120b") && !models.contains(m)) models.add(m);
            }
            models.add(configuredModel);
        } else {
            models.add(configuredModel);
            for (String m : FALLBACK_MODELS) {
                if (!models.contains(m)) models.add(m);
            }
        }
        return models;
    }

    private static boolean isDailyTokenLimit(String body) {
        if (body == null) return false;
        String lower = body.toLowerCase(Locale.ROOT);
        return lower.contains("tokens per day")
                || lower.contains("\"type\":\"tokens\"")
                || lower.contains("tpd");
    }

    private static String friendlyUserMessage(boolean dailyLimit) {
        if (dailyLimit) {
            return "A cota diária da IA esgotou. Aguarde ~30 min ou troque GROQ_MODEL no .env para um modelo mais leve (ex.: qwen/qwen3.8-27b).";
        }
        return "A IA está momentaneamente indisponível. Tente novamente em alguns instantes.";
    }

    private static String abbreviate(String s, int max) {
        if (s == null) return "";
        String t = s.replaceAll("\\s+", " ").trim();
        return t.length() <= max ? t : t.substring(0, max) + "…";
    }

    private <T> T parseJsonObject(String raw, Class<T> responseClass) {
        if (raw == null || raw.isBlank()) return null;
        String clean = raw.replaceAll("```json|```", "").trim();
        int start = clean.indexOf('{');
        int end = clean.lastIndexOf('}');
        if (start == -1 || end <= start) return null;

        String jsonSubstring = clean.substring(start, end + 1);
        try {
            return objectMapper.readValue(jsonSubstring, responseClass);
        } catch (Exception e) {
            try {
                String repaired = jsonSubstring.replaceAll(",\\s*([}\\]])", "$1");
                return objectMapper.readValue(repaired, responseClass);
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    public String fetchWebContext(String city, List<String> queryTerms, String mesAno) {
        if (braveKey.isBlank()) return "";

        String effectiveCity = (city != null && !city.isBlank()) ? city : "Fortaleza";

        try {
            String terms = queryTerms != null && !queryTerms.isEmpty() ? String.join(" ", queryTerms) : "shows cultura feiras gastronomia";
            // Menos queries = menos latência e custo indireto no prompt
            List<String> queries = List.of(
                    "site:sympla.com.br " + effectiveCity + " " + terms,
                    "agenda cultural eventos shows " + effectiveCity + " " + mesAno,
                    "site:instagram.com " + effectiveCity + " (agenda cultural OR shows OR eventos)"
            );

            StringBuilder results = new StringBuilder();
            Set<String> seenSnippets = new HashSet<>();

            for (String q : queries) {
                try {
                    String url = "https://api.search.brave.com/res/v1/web/search?q="
                            + URLEncoder.encode(q, StandardCharsets.UTF_8)
                            + "&count=4&lang=pt&country=BR";

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .header("Accept", "application/json")
                            .header("X-Subscription-Token", braveKey)
                            .timeout(Duration.ofSeconds(4))
                            .GET()
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    if (response.statusCode() == 200) {
                        JsonNode root = objectMapper.readTree(response.body());
                        JsonNode items = root.path("web").path("results");
                        if (items.isArray()) {
                            for (JsonNode item : items) {
                                String title = item.path("title").asText("");
                                String desc = item.path("description").asText("");
                                String snippetKey = (title + " " + desc).toLowerCase().replaceAll("[^a-z0-9]", "");
                                if (!title.isBlank() && !desc.isBlank() && !seenSnippets.contains(snippetKey)) {
                                    seenSnippets.add(snippetKey);
                                    results.append("• ").append(title).append(": ").append(desc).append("\n");
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }

            if (results.length() == 0) return "";
            String clipped = results.length() > 2500 ? results.substring(0, 2500) + "…\n" : results.toString();
            return "\n\n=== CONTEXTO WEB (resumido) ===\n"
                    + clipped
                    + "=== FIM ===\n";
        } catch (Exception e) {
            log.debug("Erro ao buscar contexto web: {}", e.getMessage());
            return "";
        }
    }

    public String fetchWebContext(List<String> queryTerms, String mesAno) {
        return fetchWebContext("Fortaleza", queryTerms, mesAno);
    }
}

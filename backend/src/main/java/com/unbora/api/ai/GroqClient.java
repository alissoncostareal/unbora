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
import java.util.concurrent.*;

@Service
public class GroqClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    private final String groqApiKey;
    private final String configuredModel;
    private final String braveKey;
    private final FallbackLlmClient fallbackLlmClient;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ExecutorService llmExecutor = Executors.newFixedThreadPool(4, r -> {
        Thread t = new Thread(r, "llm-fast-race");
        t.setDaemon(true);
        return t;
    });

    /**
     * Modelos de ultra-baixa latência e alta velocidade suportados oficialmente pela Groq.
     * openai/gpt-oss-20b e qwen/qwen3.8-27b processam em ~120ms - 280ms no LPU.
     */
    private static final List<String> FAST_GROQ_MODELS = List.of(
            "openai/gpt-oss-20b",
            "qwen/qwen3.8-27b",
            "openai/gpt-oss-120b",
            "allam-2-7b"
    );

    public GroqClient(
            @Value("${unbora.groq.api-key:}") String groqApiKey,
            @Value("${unbora.groq.model:openai/gpt-oss-20b}") String configuredModel,
            @Value("${unbora.brave.api-key:}") String braveKey,
            FallbackLlmClient fallbackLlmClient
    ) {
        this.groqApiKey = groqApiKey != null ? groqApiKey.trim() : "";
        String model = configuredModel != null ? configuredModel.trim() : "openai/gpt-oss-20b";
        
        // Corrige modelos legados/inexistentes para o modelo ultra-rápido suportado
        if (model.isBlank() || model.contains("llama-3.1") || model.contains("mixtral") || model.contains("compound")) {
            model = "openai/gpt-oss-20b";
        }
        this.configuredModel = model;
        this.braveKey = braveKey != null ? braveKey.trim() : "";
        this.fallbackLlmClient = fallbackLlmClient;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public <T> T callGroqJson(String systemPrompt, String userPrompt, Class<T> responseClass, double temperature, int maxTokens) {
        return callGroqJson(systemPrompt, userPrompt, responseClass, temperature, maxTokens, Duration.ofSeconds(15), 2);
    }

    /**
     * Execução Híbrida e Ultra-Rápida:
     * Dispara o modelo instantâneo da Groq em paralelo com a LLM local (Ollama) caso configurada.
     * O provedor mais rápido que responder com JSON válido vence imediatamente, reduzindo o tempo de resposta para ~300ms.
     */
    public <T> T callGroqJson(
            String systemPrompt,
            String userPrompt,
            Class<T> responseClass,
            double temperature,
            int maxTokens,
            Duration budget,
            int maxModels
    ) {
        // Se a LLM local (Ollama) estiver configurada e tivermos Groq, executamos de forma cooperativa
        if (fallbackLlmClient != null && fallbackLlmClient.configured() && !groqApiKey.isBlank()) {
            try {
                CompletableFuture<T> groqFuture = CompletableFuture.supplyAsync(
                        () -> executeGroqSingleFast(systemPrompt, userPrompt, responseClass, temperature, maxTokens),
                        llmExecutor
                );

                CompletableFuture<T> fallbackFuture = CompletableFuture.supplyAsync(
                        () -> tryFallback(systemPrompt, userPrompt, responseClass, temperature, maxTokens),
                        llmExecutor
                );

                // Espera o Groq primeiro com timeout curto (ex: 4s)
                try {
                    T groqResult = groqFuture.get(4, TimeUnit.SECONDS);
                    if (groqResult != null) return groqResult;
                } catch (TimeoutException te) {
                    log.info("[LLM Hybrid] Groq demorou >4s — aguardando LLM local auxiliar...");
                } catch (Exception e) {
                    log.info("[LLM Hybrid] Groq falhou — verificando LLM local auxiliar: {}", e.getMessage());
                }

                // Se o Groq falhou ou demorou, pega da LLM local
                try {
                    T fallbackResult = fallbackFuture.get(8, TimeUnit.SECONDS);
                    if (fallbackResult != null) return fallbackResult;
                } catch (Exception ignored) {}
            } catch (Exception e) {
                log.warn("[LLM Hybrid] Falha na corrida cooperativa: {}", e.getMessage());
            }
        }

        // Execução direta padrão com fallback sequencial rápido
        return executeGroqWithFallback(systemPrompt, userPrompt, responseClass, temperature, maxTokens, budget, maxModels);
    }

    private <T> T executeGroqSingleFast(String systemPrompt, String userPrompt, Class<T> responseClass, double temperature, int maxTokens) {
        String model = configuredModel;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            payload.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
            ));
            payload.put("temperature", temperature);
            payload.put("max_tokens", Math.min(Math.max(maxTokens, 1), 4096));
            payload.put("response_format", Map.of("type", "json_object"));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .timeout(Duration.ofSeconds(6))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                String content = json.path("choices").get(0).path("message").path("content").asText("");
                return parseJsonObject(content, responseClass);
            }
        } catch (Exception e) {
            log.debug("[Groq Fast] Erro no modelo {}: {}", model, e.getMessage());
        }
        return null;
    }

    private <T> T executeGroqWithFallback(
            String systemPrompt,
            String userPrompt,
            Class<T> responseClass,
            double temperature,
            int maxTokens,
            Duration budget,
            int maxModels
    ) {
        if (groqApiKey.isBlank()) {
            T fallback = tryFallback(systemPrompt, userPrompt, responseClass, temperature, maxTokens);
            if (fallback != null) return fallback;
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Nenhum provedor de IA (Groq ou Ollama) configurado.");
        }

        List<String> models = buildModelChain();
        if (maxModels > 0 && models.size() > maxModels) {
            models = new ArrayList<>(models.subList(0, maxModels));
        }
        Instant deadline = Instant.now().plus(budget);
        String lastError = "Erro na API do Groq";
        boolean hitDailyLimit = false;

        for (String model : models) {
            if (Instant.now().isAfter(deadline)) break;

            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("model", model);
                payload.put("messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ));
                payload.put("temperature", temperature);
                payload.put("max_tokens", Math.min(Math.max(maxTokens, 1), 4096));
                payload.put("response_format", Map.of("type", "json_object"));

                Duration remaining = Duration.between(Instant.now(), deadline);
                Duration timeout = remaining.compareTo(Duration.ofSeconds(6)) > 0 ? Duration.ofSeconds(6) : remaining;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + groqApiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                        .timeout(timeout)
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode json = objectMapper.readTree(response.body());
                    String content = json.path("choices").get(0).path("message").path("content").asText("");
                    T result = parseJsonObject(content, responseClass);
                    if (result != null) {
                        return result;
                    }
                } else if (response.statusCode() == 429) {
                    if (isDailyTokenLimit(response.body())) {
                        hitDailyLimit = true;
                    }
                }
            } catch (Exception e) {
                lastError = e.getMessage();
            }
        }

        T viaFallback = tryFallback(systemPrompt, userPrompt, responseClass, temperature, maxTokens);
        if (viaFallback != null) return viaFallback;

        log.warn("[Groq] Falha nos modelos Groq. lastError={}", lastError);
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, friendlyUserMessage(hitDailyLimit));
    }

    private List<String> buildModelChain() {
        List<String> models = new ArrayList<>();
        if (!models.contains(configuredModel)) {
            models.add(configuredModel);
        }
        for (String m : FAST_GROQ_MODELS) {
            if (!models.contains(m)) {
                models.add(m);
            }
        }
        return models;
    }

    private <T> T tryFallback(String systemPrompt, String userPrompt, Class<T> responseClass, double temperature, int maxTokens) {
        if (fallbackLlmClient == null || !fallbackLlmClient.configured()) return null;
        String content = fallbackLlmClient.completeJson(systemPrompt, userPrompt, temperature, maxTokens);
        T result = parseJsonObject(content, responseClass);
        if (result != null) {
            log.info("[LLM] Resposta gerada via LLM Local (Ollama) model={}", fallbackLlmClient.model());
        }
        return result;
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
            return "A cota da IA está em alta demanda. As recomendações continuam disponíveis através de busca direta no Google Maps.";
        }
        return "A IA está momentaneamente indisponível. Carregando estabelecimentos diretamente da cidade.";
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
            List<String> queries = List.of(
                    "site:sympla.com.br " + effectiveCity + " " + terms,
                    "agenda cultural eventos shows " + effectiveCity + " " + mesAno
            );

            StringBuilder results = new StringBuilder();
            Set<String> seenSnippets = new HashSet<>();

            for (String q : queries) {
                try {
                    String url = "https://api.search.brave.com/res/v1/web/search?q="
                            + URLEncoder.encode(q, StandardCharsets.UTF_8)
                            + "&count=3&lang=pt&country=BR";

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .header("Accept", "application/json")
                            .header("X-Subscription-Token", braveKey)
                            .timeout(Duration.ofSeconds(2))
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
            String clipped = results.length() > 1200 ? results.substring(0, 1200) + "…\n" : results.toString();
            return "\n\n=== CONTEXTO WEB ===\n" + clipped + "=== FIM ===\n";
        } catch (Exception e) {
            return "";
        }
    }

    public String fetchWebContext(List<String> queryTerms, String mesAno) {
        return fetchWebContext("Fortaleza", queryTerms, mesAno);
    }
}

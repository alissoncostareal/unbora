package com.unbora.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FallbackLlmClient {

    private static final Logger log = LoggerFactory.getLogger(FallbackLlmClient.class);

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public FallbackLlmClient(
            @Value("${unbora.llm-fallback.api-key:}") String apiKey,
            @Value("${unbora.llm-fallback.base-url:}") String baseUrl,
            @Value("${unbora.llm-fallback.model:llama3.2:3b}") String model
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        String url = baseUrl != null ? baseUrl.trim() : "";
        if (url.endsWith("/")) url = url.substring(0, url.length() - 1);
        this.baseUrl = url;
        String chosen = model != null ? model.trim() : "";
        this.model = chosen.isBlank() ? "llama3.2:3b" : chosen;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean configured() {
        return !baseUrl.isBlank();
    }

    public String model() {
        return model;
    }

    public String completeJson(String systemPrompt, String userPrompt, double temperature, int maxTokens) {
        if (!configured()) return null;

        String withFormat = request(systemPrompt, userPrompt, temperature, maxTokens, true);
        if (withFormat != null) return withFormat;
        return request(systemPrompt, userPrompt, temperature, maxTokens, false);
    }

    private String request(String systemPrompt, String userPrompt, double temperature, int maxTokens, boolean jsonMode) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            payload.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
            ));
            payload.put("temperature", temperature);
            payload.put("max_tokens", Math.min(Math.max(maxTokens, 1), 4096));
            if (jsonMode) {
                payload.put("response_format", Map.of("type", "json_object"));
            }

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .timeout(Duration.ofSeconds(120));
            if (!apiKey.isBlank()) {
                builder.header("Authorization", "Bearer " + apiKey);
            }
            HttpRequest httpRequest = builder.build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("[LLM fallback] HTTP {} model={} jsonMode={}", response.statusCode(), model, jsonMode);
                return null;
            }
            JsonNode json = objectMapper.readTree(response.body());
            String content = json.path("choices").path(0).path("message").path("content").asText("");
            return content.isBlank() ? null : content;
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.warn("[LLM fallback] interrompido");
            return null;
        } catch (Exception e) {
            log.warn("[LLM fallback] falhou model={}: {}", model, e.getMessage());
            return null;
        }
    }
}

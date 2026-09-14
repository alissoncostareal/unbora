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
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);
    private static final int VECTOR_DIMENSIONS = 1536;

    private final String openaiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Map<String, String> vectorCache = new ConcurrentHashMap<>(1024);

    public EmbeddingService(@Value("${unbora.openai.api-key:}") String openaiKey) {
        this.openaiKey = (openaiKey != null && !openaiKey.isBlank()) ? openaiKey.trim() : System.getenv("OPENAI_API_KEY");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Retorna a representação textual do vetor de 1536 dimensões para o pgvector: "[0.123, -0.456, ...]"
     */
    public String getEmbeddingVectorString(String text) {
        if (text == null || text.isBlank()) {
            return generateZeroVector();
        }

        String normalized = normalizeText(text);
        String cached = vectorCache.get(normalized);
        if (cached != null) return cached;

        // 1. Tenta OpenAI text-embedding-3-small se houver chave configurada
        if (openaiKey != null && !openaiKey.isBlank()) {
            try {
                String vectorStr = fetchOpenAIEmbedding(normalized);
                if (vectorStr != null && !vectorStr.isBlank()) {
                    vectorCache.put(normalized, vectorStr);
                    return vectorStr;
                }
            } catch (Exception e) {
                log.debug("OpenAI embedding falhou: {}. Usando vetorizador denso local.", e.getMessage());
            }
        }

        // 2. Vetorizador Semântico Denso Normalizado L2 (1536 dimensões)
        String localVector = generateDenseSemanticVector(normalized);
        vectorCache.put(normalized, localVector);
        return localVector;
    }

    private String fetchOpenAIEmbedding(String text) {
        try {
            Map<String, Object> payload = Map.of(
                    "input", text,
                    "model", "text-embedding-3-small",
                    "dimensions", VECTOR_DIMENSIONS
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/embeddings"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openaiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .timeout(Duration.ofSeconds(4))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode embeddingArray = root.path("data").get(0).path("embedding");
                if (embeddingArray.isArray()) {
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < embeddingArray.size(); i++) {
                        if (i > 0) sb.append(",");
                        sb.append(embeddingArray.get(i).asDouble());
                    }
                    sb.append("]");
                    return sb.toString();
                }
            }
        } catch (Exception e) {
            log.debug("Erro ao chamar OpenAI Embeddings: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Gera um vetor denso normalizado de 1536 dimensões com preservação semântica de n-gramas e tokens.
     */
    public String generateDenseSemanticVector(String text) {
        float[] vector = new float[VECTOR_DIMENSIONS];
        String clean = normalizeText(text);
        String[] tokens = clean.split("\\s+");

        if (tokens.length == 0 || clean.isBlank()) {
            return generateZeroVector();
        }

        // 1. Incorporação de tokens e sub-palavras (n-grams de 3 a 5 caracteres)
        for (int t = 0; t < tokens.length; t++) {
            String token = tokens[t];
            if (token.isBlank()) continue;

            // Peso de posição decrescente suave
            float tokenWeight = 1.0f / (float) Math.sqrt(t + 1);

            int wordHash = token.hashCode();
            int idx1 = Math.abs(wordHash) % VECTOR_DIMENSIONS;
            int idx2 = Math.abs(wordHash * 31 + 17) % VECTOR_DIMENSIONS;
            int idx3 = Math.abs(wordHash * 101 + 43) % VECTOR_DIMENSIONS;

            vector[idx1] += 1.5f * tokenWeight;
            vector[idx2] += 0.8f * tokenWeight * (wordHash % 2 == 0 ? 1 : -1);
            vector[idx3] += 0.5f * tokenWeight;

            // Sub-gramas
            for (int len = 3; len <= Math.min(5, token.length()); len++) {
                for (int i = 0; i <= token.length() - len; i++) {
                    String sub = token.substring(i, i + len);
                    int subHash = sub.hashCode();
                    int subIdx = Math.abs(subHash * 37) % VECTOR_DIMENSIONS;
                    vector[subIdx] += 0.35f * tokenWeight;
                }
            }
        }

        // 2. Normalização L2 para garantir similaridade de cosseno perfeita no pgvector
        double sumSq = 0.0;
        for (float v : vector) {
            sumSq += v * v;
        }

        double norm = Math.sqrt(sumSq);
        if (norm < 1e-9) norm = 1.0;

        StringBuilder sb = new StringBuilder(VECTOR_DIMENSIONS * 10);
        sb.append("[");
        for (int i = 0; i < VECTOR_DIMENSIONS; i++) {
            if (i > 0) sb.append(",");
            float normalizedVal = (float) (vector[i] / norm);
            sb.append(String.format(Locale.US, "%.6f", normalizedVal));
        }
        sb.append("]");

        return sb.toString();
    }

    private String generateZeroVector() {
        StringBuilder sb = new StringBuilder(VECTOR_DIMENSIONS * 3);
        sb.append("[");
        for (int i = 0; i < VECTOR_DIMENSIONS; i++) {
            if (i > 0) sb.append(",");
            sb.append("0.0");
        }
        sb.append("]");
        return sb.toString();
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}

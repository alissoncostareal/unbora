package com.unbora.api.domain.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unbora.api.common.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token={idToken}";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final Set<String> allowedClientIds;

    public record GoogleUserProfile(
            String googleId,
            String email,
            String name,
            String avatarUrl
    ) {}

    public GoogleAuthService(
            ObjectMapper objectMapper,
            @Value("${unbora.oauth.google.client-ids:}") String clientIdsConfig
    ) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
        this.allowedClientIds = parseClientIds(clientIdsConfig);
        if (!this.allowedClientIds.isEmpty()) {
            log.info("Google OAuth configurado com {} client ID(s) permitidos", allowedClientIds.size());
        }
    }

    private static Set<String> parseClientIds(String config) {
        if (config == null || config.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(config.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    public GoogleUserProfile verifyIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw ApiException.badRequest("Token do Google ausente.");
        }

        try {
            ResponseEntity<String> response = restClient.get()
                    .uri(GOOGLE_TOKENINFO_URL, idToken.trim())
                    .retrieve()
                    .toEntity(String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Falha na validação do token Google: status {}", response.getStatusCode());
                throw ApiException.unauthorized("Token do Google inválido ou expirado.");
            }

            JsonNode payload = objectMapper.readTree(response.getBody());

            String sub = payload.path("sub").asText(null);
            String email = payload.path("email").asText(null);
            String name = payload.path("name").asText("Usuário Google");
            String picture = payload.path("picture").asText(null);
            String iss = payload.path("iss").asText("");
            String aud = payload.path("aud").asText("");
            long exp = payload.path("exp").asLong(0);

            if (sub == null || email == null || email.isBlank()) {
                throw ApiException.unauthorized("Token do Google não contém dados de e-mail ou identificador.");
            }

            if (!iss.equals("accounts.google.com") && !iss.equals("https://accounts.google.com")) {
                log.warn("Emissor inválido no token Google: {}", iss);
                throw ApiException.unauthorized("Emissor do token Google inválido.");
            }

            if (exp > 0 && Instant.ofEpochSecond(exp).isBefore(Instant.now())) {
                log.warn("Token Google expirado em {}", Instant.ofEpochSecond(exp));
                throw ApiException.unauthorized("Token do Google expirado.");
            }

            if (!allowedClientIds.isEmpty() && !allowedClientIds.contains(aud)) {
                log.warn("Audience '{}' do token Google não está na lista de client IDs permitidos", aud);
                throw ApiException.unauthorized("Client ID do token Google não autorizado.");
            }

            boolean emailVerified = payload.path("email_verified").asBoolean(false) ||
                    "true".equalsIgnoreCase(payload.path("email_verified").asText());

            if (!emailVerified) {
                throw ApiException.badRequest("O e-mail da conta Google não está verificado.");
            }

            return new GoogleUserProfile(sub, email.trim().toLowerCase(), name, picture);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao validar token Google: {}", e.getMessage());
            throw ApiException.unauthorized("Não foi possível validar as credenciais do Google.");
        }
    }
}

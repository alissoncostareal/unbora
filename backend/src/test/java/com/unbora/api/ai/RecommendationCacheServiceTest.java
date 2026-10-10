package com.unbora.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unbora.api.ai.dto.ActivityItemDto;
import com.unbora.api.ai.dto.PlaceDto;
import com.unbora.api.ai.dto.RecommendationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class RecommendationCacheServiceTest {

    private ObjectMapper objectMapper;
    private RecommendationCacheService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new RecommendationCacheService(null, objectMapper);
    }

    @Test
    @DisplayName("Gera chave deterministica e consistente para os mesmos parametros")
    void shouldComputeDeterministicKey() {
        List<ActivityItemDto> activities1 = List.of(
                new ActivityItemDto("natureza", "Natureza", "parque ao ar livre"),
                new ActivityItemDto("gastronomia", "Gastronomia", "restaurante")
        );
        List<ActivityItemDto> activities2 = List.of(
                new ActivityItemDto("gastronomia", "Gastronomia", "restaurante"),
                new ActivityItemDto("natureza", "Natureza", "parque ao ar livre")
        );

        String key1 = service.computeRecommendKey("Ubajara", "Ceará", "Encontro", "A dois", activities1, 8.0, 130.0);
        String key2 = service.computeRecommendKey("  ubajara ", "ceara", "encontro", "a dois", activities2, 8.0, 130.0);

        assertEquals(key1, key2, "Chaves devem ser iguais independente da ordem dos itens ou espacos");
    }

    @Test
    @DisplayName("Salva no cache L1 e recupera com sucesso")
    void shouldHitL1Cache() {
        PlaceDto place = new PlaceDto();
        place.setNome("Parque Nacional de Ubajara");
        place.setTipo("Parque");
        RecommendationResult rec = new RecommendationResult("Passeio em Ubajara", "Natureza e gastronomia", List.of(place));

        String key = "rec_test_123";
        service.putRecommendation(key, "RECOMMEND", "Ubajara", rec, Duration.ofHours(6));

        Optional<RecommendationResult> cached = service.getCachedRecommendation(key);

        assertTrue(cached.isPresent());
        assertEquals("Passeio em Ubajara", cached.get().getTitulo());
        assertEquals(1, cached.get().getLugares().size());
        assertEquals("Parque Nacional de Ubajara", cached.get().getLugares().get(0).getNome());
    }

    @Test
    @DisplayName("Chave de busca textual e consistente")
    void shouldComputeSearchKey() {
        String key1 = service.computeSearchKey("Fortaleza", "Ceará", "Restaurante de frutos do mar");
        String key2 = service.computeSearchKey("  fortaleza ", "ceara", "restaurante de frutos do mar");
        assertEquals(key1, key2);
    }
}

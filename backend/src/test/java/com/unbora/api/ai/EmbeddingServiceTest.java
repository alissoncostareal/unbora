package com.unbora.api.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EmbeddingServiceTest {

    private EmbeddingService embeddingService;

    @BeforeEach
    void setUp() {
        embeddingService = new EmbeddingService("");
    }

    @Test
    @DisplayName("Vetor denso local deve ter 1536 dimensões no formato pgvector")
    void shouldGenerate1536DimPgvectorLiteral() {
        String vector = embeddingService.getEmbeddingVectorString(
                "bistrô romântico com vinho para pedir namorada em casamento Fortaleza");
        assertNotNull(vector);
        assertTrue(vector.startsWith("["));
        assertTrue(vector.endsWith("]"));
        String[] parts = vector.substring(1, vector.length() - 1).split(",");
        assertEquals(1536, parts.length);
    }

    @Test
    @DisplayName("Mesmo texto deve retornar o mesmo vetor (cache L1)")
    void shouldCacheIdenticalQueries() {
        String a = embeddingService.getEmbeddingVectorString("Coco Bambu Meireles frutos do mar");
        String b = embeddingService.getEmbeddingVectorString("Coco Bambu Meireles frutos do mar");
        assertEquals(a, b);
    }

    @Test
    @DisplayName("Textos semanticamente diferentes devem gerar vetores diferentes")
    void differentTextsShouldDiffer() {
        String romantic = embeddingService.generateDenseSemanticVector(
                "bistrô romântico intimista com vinho e luz baixa");
        String beach = embeddingService.generateDenseSemanticVector(
                "barraca de praia com sol e água de coco");
        assertNotEquals(romantic, beach);
    }

    @Test
    @DisplayName("Texto vazio gera vetor zero válido")
    void blankTextYieldsZeroVector() {
        String vector = embeddingService.getEmbeddingVectorString("   ");
        assertTrue(vector.startsWith("["));
        assertTrue(vector.contains("0.0"));
    }
}

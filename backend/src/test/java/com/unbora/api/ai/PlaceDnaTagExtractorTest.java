package com.unbora.api.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PlaceDnaTagExtractorTest {

    private PlaceDnaTagExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new PlaceDnaTagExtractor();
    }

    @Test
    void shouldExtractPetFriendlyAndOutdoorSeating() {
        PlaceDnaTagExtractor.DnaExtractionResult result = extractor.extractDna(
                "Café das Flores",
                "Cafeteria",
                List.of("cafe", "coffee_shop"),
                "Rua das Acácias, 100",
                "Cafeteria charmosa com mesas ao ar livre em um jardim delicioso. Aceitamos pets com carinho.",
                "Ambiente agradável para um café da tarde.",
                "PRICE_LEVEL_MODERATE",
                Map.of("allowsDogs", true, "outdoorSeating", true)
        );

        assertNotNull(result);
        assertTrue(result.tags().contains("pet_friendly"));
        assertTrue(result.tags().contains("outdoor_seating"));
        assertTrue(result.tags().contains("specialty_coffee"));
        assertTrue((Boolean) result.attributes().get("pet_friendly"));
        assertTrue((Boolean) result.attributes().get("outdoor_seating"));
    }

    @Test
    void shouldExtractLiveMusicAndRomanticVibe() {
        PlaceDnaTagExtractor.DnaExtractionResult result = extractor.extractDna(
                "Bistrô & Jazz La Luna",
                "Restaurante Francês",
                List.of("restaurant", "bar"),
                "Av. Beira Mar, 500",
                "Jantar romântico à luz de velas com música ao vivo e excelente carta de vinhos e drinks artesanais.",
                "Clima intimista ideal para casais.",
                "PRICE_LEVEL_EXPENSIVE",
                Map.of("liveMusic", true)
        );

        assertNotNull(result);
        assertTrue(result.tags().contains("good_for_couples"));
        assertTrue(result.tags().contains("live_music"));
        assertTrue(result.tags().contains("cocktails"));
        assertTrue(result.tags().contains("fine_dining"));
    }
}

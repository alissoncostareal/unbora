package com.unbora.api.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ImageEnrichmentServiceTest {

    private ImageEnrichmentService imageEnrichmentService;

    @BeforeEach
    void setUp() {
        GooglePlacesDiscoveryService placesDiscoveryService = new GooglePlacesDiscoveryService("");
        imageEnrichmentService = new ImageEnrichmentService("", "", null, null, placesDiscoveryService);
    }

    @Test
    @DisplayName("Deve calcular similaridade de nomes corretamente")
    void shouldCalculateNameSimilarityCorrectly() {
        assertEquals(1.0, imageEnrichmentService.calculateNameSimilarity("Coco Bambu Meireles", "Coco Bambu Meireles"), 0.01);
        assertTrue(imageEnrichmentService.calculateNameSimilarity("Coco Bambu", "Restaurante Coco Bambu Meireles") >= 0.5);
        assertTrue(imageEnrichmentService.calculateNameSimilarity("Posto Ipiranga", "Café Viriato Aldeota") < 0.2);
    }

    @Test
    @DisplayName("Deve normalizar texto removendo acentos e pontuações")
    void shouldNormalizeTextProperly() {
        assertEquals("dragao do mar", imageEnrichmentService.normalizeText("Dragão do Mar!"));
        assertEquals("cafe viriato aldeota", imageEnrichmentService.normalizeText("Café Viriato — Aldeota"));
    }

    @Test
    @DisplayName("Deve retornar fallback temático categorizado se nada for encontrado")
    void shouldReturnThematicFallback() {
        String photo = imageEnrichmentService.getCuratedFallback("gastronomia", "Restaurante Teste Desconhecido");
        assertNotNull(photo);
        assertTrue(photo.startsWith("http"));
    }

    @Test
    @DisplayName("Deve retornar fallback para categorias diferentes")
    void shouldReturnFallbackForCategories() {
        String beachPhoto = imageEnrichmentService.getCuratedFallback("praia", "Praia do Futuro");
        String barPhoto = imageEnrichmentService.getCuratedFallback("bar", "Hoots Pub");
        assertNotNull(beachPhoto);
        assertNotNull(barPhoto);
        assertTrue(beachPhoto.startsWith("http"));
        assertTrue(barPhoto.startsWith("http"));
    }

    @Test
    @DisplayName("Festival de Reggae no Cuca é evento musical em complexo multiuso")
    void shouldDetectReggaeAtCucaAsMusicInMultiUseVenue() {
        assertTrue(imageEnrichmentService.isMusicOrArtsEvent(
                "Festival de Reggae no Cuca Pici", "show", "Festival"));
        assertTrue(imageEnrichmentService.isMultiUseOrSportsComplex("Cuca Pici"));
        assertTrue(imageEnrichmentService.isMultiUseOrSportsComplex("CUCA Barra do Ceará"));
    }

    @Test
    @DisplayName("Deve detectar mismatch esportivo (quadra/futsal) em evento artístico")
    void shouldDetectSportsMismatchForMusicEvents() {
        assertTrue(imageEnrichmentService.isSportsMismatchForEvent(
                "https://example.com/quadra-futsal-cuca.jpg", "Cuca Pici", true));
        assertTrue(imageEnrichmentService.isSportsMismatchForEvent(
                "Ginásio poliesportivo", null, true));
        assertFalse(imageEnrichmentService.isSportsMismatchForEvent(
                "https://example.com/show-palco-reggae.jpg", "Festival", true));
        assertFalse(imageEnrichmentService.isSportsMismatchForEvent(
                "quadra de futsal", null, false));
    }

    @Test
    @DisplayName("Fallback de Reggae NÃO deve ser foto genérica de esporte")
    void reggaeFallbackShouldBeThematicNotSports() {
        String photo = imageEnrichmentService.getCuratedFallback(
                "show", "Festival de Reggae no Cuca Pici");
        assertNotNull(photo);
        assertTrue(photo.startsWith("http"));
        String lower = photo.toLowerCase();
        assertFalse(lower.contains("futsal") || lower.contains("quadra"));
    }

    @Test
    @DisplayName("Sem APIs externas, Festival Reggae no Cuca usa imagem ilustrativa temática")
    void reggaeAtCucaUsesThematicIllustrativeImage() {
        String photo = imageEnrichmentService.fetchEventImage(
                "Festival de Reggae no Cuca Pici",
                "Cuca Pici",
                "Fortaleza",
                "Festival",
                null,
                "reggae"
        );
        assertNotNull(photo);
        assertTrue(photo.startsWith("http"));
        assertTrue(imageEnrichmentService.isIllustrativeImageUrl(photo));
        assertFalse(photo.contains("places.googleapis.com"));
        assertFalse(photo.toLowerCase().contains("futsal"));
    }

    @Test
    @DisplayName("BatchSession garante URLs únicas no mesmo feed (mesmo tema)")
    void batchSessionAvoidsDuplicateFallbackUrls() {
        ImageEnrichmentService.BatchSession batch = new ImageEnrichmentService.BatchSession();
        Set<String> urls = new LinkedHashSet<>();
        String[] titles = {
                "Show A", "Show B", "Show C", "Show D", "Show E", "Show F",
                "Show G", "Show H", "Show I", "Show J"
        };
        for (String title : titles) {
            String photo = imageEnrichmentService.fetchEventImage(
                    title, "Local", "Fortaleza", "show", null, "show", batch);
            assertNotNull(photo);
            assertTrue(urls.add(photo), "URL repetida no lote: " + photo);
        }
        assertEquals(titles.length, urls.size());
    }

    @Test
    @DisplayName("getCuratedFallback com batch não repete URL do pool")
    void curatedFallbackBatchIsUnique() {
        ImageEnrichmentService.BatchSession batch = new ImageEnrichmentService.BatchSession();
        Set<String> urls = new HashSet<>();
        for (int i = 0; i < 12; i++) {
            String photo = imageEnrichmentService.getCuratedFallback("show", "Evento " + i, batch);
            assertTrue(urls.add(photo), "Fallback repetido: " + photo);
        }
    }

    @Test
    @DisplayName("Lugar sem APIs não recebe stock temático de evento")
    void placeImageNeverUsesEventThematicStock() {
        String photo = imageEnrichmentService.fetchPlaceImage(
                "Restaurante Exemplo",
                "Aldeota, Fortaleza",
                "restaurante",
                null,
                "gastronomia",
                "Fortaleza",
                null,
                null,
                null
        );
        assertNull(photo);
    }
}

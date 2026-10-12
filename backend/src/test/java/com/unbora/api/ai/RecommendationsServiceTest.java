package com.unbora.api.ai;

import com.unbora.api.ai.dto.ActivityItemDto;
import com.unbora.api.ai.dto.PlaceDto;
import com.unbora.api.ai.dto.RecommendDto;
import com.unbora.api.ai.dto.RecommendationResult;
import com.unbora.api.ai.dto.SearchDto;
import com.unbora.api.domain.checkin.CheckinRepository;
import com.unbora.api.domain.location.LocationSettingsService;
import com.unbora.api.domain.place.DismissedPlaceRepository;
import com.unbora.api.domain.place.PlaceBanService;
import com.unbora.api.domain.place.PlaceEmbeddingRepository;
import com.unbora.api.domain.sponsored.SponsoredPlaceService;
import com.unbora.api.kafka.KafkaEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ResourceLoader;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RecommendationsServiceTest {

    @Mock private GroqClient groqClient;
    @Mock private ImageEnrichmentService imageEnrichmentService;
    @Mock private KafkaEventPublisher kafkaEventPublisher;
    @Mock private GooglePlacesDiscoveryService googlePlacesDiscoveryService;
    @Mock private ResourceLoader resourceLoader;
    @Mock private PlaceEmbeddingRepository placeEmbeddingRepository;
    @Mock private EmbeddingService embeddingService;
    @Mock private ImageSubjectClassifier imageSubjectClassifier;
    @Mock private PlacePhotoLinkService placePhotoLinkService;
    @Mock private CityAnchor cityAnchor;
    @Mock private DismissedPlaceRepository dismissedPlaceRepository;
    @Mock private PlaceBanService placeBanService;
    @Mock private LocationSettingsService locationSettingsService;
    @Mock private SponsoredPlaceService sponsoredPlaceService;
    @Mock private CheckinRepository checkinRepository;
    @Mock private RecommendationCacheService recommendationCacheService;

    private RecommendationsService recommendationsService;
    private PromptTemplateService promptTemplateService;
    private PlaceDnaTagExtractor placeDnaTagExtractor;

    @BeforeEach
    void setUp() {
        when(resourceLoader.getResource(contains("system-prompt"))).thenReturn(
                new ByteArrayResource("System prompt".getBytes())
        );
        when(resourceLoader.getResource(contains("recommendation-user-prompt"))).thenReturn(
                new ByteArrayResource("User prompt for {city}".getBytes())
        );
        when(resourceLoader.getResource(contains("search-user-prompt"))).thenReturn(
                new ByteArrayResource("Search prompt for {query} in {city}".getBytes())
        );

        promptTemplateService = new PromptTemplateService(resourceLoader);
        placeDnaTagExtractor = new PlaceDnaTagExtractor();

        recommendationsService = new RecommendationsService(
                groqClient,
                imageEnrichmentService,
                kafkaEventPublisher,
                googlePlacesDiscoveryService,
                promptTemplateService,
                placeEmbeddingRepository,
                embeddingService,
                imageSubjectClassifier,
                placePhotoLinkService,
                cityAnchor,
                dismissedPlaceRepository,
                placeBanService,
                locationSettingsService,
                sponsoredPlaceService,
                checkinRepository,
                recommendationCacheService,
                placeDnaTagExtractor
        );
    }

    @Test
    @DisplayName("Recommend funciona para novo dispositivo com latitude, longitude e userId nulos")
    void shouldRecommendForNewDeviceWithNullCoordinatesAndUser() {
        RecommendDto dto = new RecommendDto(
                "Animado",
                "Com amigos. gastar até 80 reais. Tempo disponível: 2 horas. Raio de 8 km.",
                List.of(new ActivityItemDto("bar", "Bares", "bar")),
                "Fortaleza",
                "Ceará",
                "Brasil",
                null, // latitude null
                null, // longitude null
                8.0,
                null  // userId null
        );

        when(locationSettingsService.getEffectiveMaxResults(anyString())).thenReturn(24);
        when(cityAnchor.resolve(any(), any(), any(), any(), any())).thenReturn(new CityAnchor.Center(-3.73, -38.52));
        when(recommendationCacheService.computeRecommendKey(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn("rec_test_key");
        when(recommendationCacheService.getCachedRecommendation(anyString())).thenReturn(Optional.empty());

        RecommendationResult aiResult = new RecommendationResult(
                "Rolê em Fortaleza",
                "Opções selecionadas",
                List.of(new PlaceDto())
        );
        aiResult.getLugares().get(0).setNome("Bar do Cazuza");
        aiResult.getLugares().get(0).setTipo("Bar");

        when(groqClient.callGroqJson(any(), any(), eq(RecommendationResult.class), anyDouble(), anyInt(), any(Duration.class), anyInt()))
                .thenReturn(aiResult);

        when(sponsoredPlaceService.getMatchingSponsoredForSearch(any(), any(), any(), any()))
                .thenReturn(List.of());

        RecommendationResult result = recommendationsService.recommend(dto);

        assertNotNull(result);
        assertEquals("Rolê em Fortaleza", result.getTitulo());
    }

    @Test
    @DisplayName("Recommend quando cityAnchor retorna null (falha de geocodificacao em nova cidade)")
    void shouldRecommendWhenCityAnchorReturnsNull() {
        RecommendDto dto = new RecommendDto(
                "Animado",
                "Com amigos. gastar até 80 reais. Tempo disponível: 2 horas. Raio de 8 km.",
                List.of(new ActivityItemDto("bar", "Bares", "bar")),
                "Sobral",
                "Ceará",
                "Brasil",
                null,
                null,
                8.0,
                null
        );

        when(locationSettingsService.getEffectiveMaxResults(anyString())).thenReturn(24);
        when(cityAnchor.resolve(any(), any(), any(), any(), any())).thenReturn(null);
        when(recommendationCacheService.computeRecommendKey(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn("rec_test_key_null_center");
        when(recommendationCacheService.getCachedRecommendation(anyString())).thenReturn(Optional.empty());

        RecommendationResult aiResult = new RecommendationResult(
                "Rolê em Sobral",
                "Opções selecionadas",
                List.of(new PlaceDto())
        );
        aiResult.getLugares().get(0).setNome("Restaurante do Lago");
        aiResult.getLugares().get(0).setTipo("Restaurante");
        aiResult.getLugares().get(0).setEndereco("Sobral, Ceará");

        when(groqClient.callGroqJson(any(), any(), eq(RecommendationResult.class), anyDouble(), anyInt(), any(Duration.class), anyInt()))
                .thenReturn(aiResult);

        when(sponsoredPlaceService.getMatchingSponsoredForSearch(any(), any(), any(), any()))
                .thenReturn(List.of());

        RecommendationResult result = recommendationsService.recommend(dto);

        assertNotNull(result);
        assertEquals("Rolê em Sobral", result.getTitulo());
    }

    @Test
    @DisplayName("Search funciona com fallback resiliente para novo dispositivo mesmo com falhas externas")
    void shouldSearchGracefullyForNewDevice() {
        SearchDto dto = new SearchDto(
                "café especial",
                "Fortaleza",
                "Ceará",
                "Brasil",
                null,
                null,
                null
        );

        when(locationSettingsService.getEffectiveMaxResults(anyString())).thenReturn(24);
        when(cityAnchor.resolve(any(), any(), any(), any(), any())).thenReturn(new CityAnchor.Center(-3.73, -38.52));
        when(recommendationCacheService.computeSearchKey(any(), any(), any())).thenReturn("search_test_key");
        when(recommendationCacheService.getCachedRecommendation(anyString())).thenReturn(Optional.empty());

        RecommendationResult aiResult = new RecommendationResult(
                "Busca: café especial",
                "Opções em Fortaleza",
                List.of(new PlaceDto())
        );
        aiResult.getLugares().get(0).setNome("Café Viriato");
        aiResult.getLugares().get(0).setTipo("Café");

        when(groqClient.callGroqJson(any(), any(), eq(RecommendationResult.class), anyDouble(), anyInt(), any(Duration.class), anyInt()))
                .thenReturn(aiResult);
        when(sponsoredPlaceService.getMatchingSponsoredForSearch(any(), any(), any(), any()))
                .thenReturn(List.of());

        RecommendationResult result = recommendationsService.search(dto);

        assertNotNull(result);
        assertEquals("Busca: café especial", result.getTitulo());
    }

    @Test
    @DisplayName("Recommend preserva lugares do cache quando placeId for nulo e usuario anonimo (evita NPE)")
    void shouldHandleCacheHitWithNullPlaceIdAndAnonymousUser() {
        RecommendDto dto = new RecommendDto(
                "Relaxar",
                "Com família. gastar até 200 reais. Tempo disponível: 3 horas. Raio de 15 km.",
                List.of(new ActivityItemDto("nature", "Natureza", "natureza"), new ActivityItemDto("culture", "Cultura", "cultura")),
                "Fortaleza",
                "Grande Fortaleza",
                "Brasil",
                null,
                null,
                15.0,
                null
        );

        when(locationSettingsService.getEffectiveMaxResults(anyString())).thenReturn(24);
        when(cityAnchor.resolve(any(), any(), any(), any(), any())).thenReturn(new CityAnchor.Center(-3.73, -38.52));
        when(recommendationCacheService.computeRecommendKey(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn("rec_bca5710ee1f603c841d5ca83d8e7ecf9");

        PlaceDto place1 = new PlaceDto();
        place1.setNome("Parque do Cocó");
        place1.setTipo("Parque Ecológico");
        place1.setPlaceId(null); // placeId nulo intencional

        PlaceDto place2 = new PlaceDto();
        place2.setNome("Cineteatro São Luiz");
        place2.setTipo("Centro Cultural");
        place2.setPlaceId("ChIJ123abc");

        RecommendationResult cachedResult = new RecommendationResult(
                "Paz e Cultura em Família",
                "Uma manhã serena de segunda-feira explorando a alma de Fortaleza",
                List.of(place1, place2)
        );

        when(recommendationCacheService.getCachedRecommendation(anyString())).thenReturn(Optional.of(cachedResult));
        when(sponsoredPlaceService.getMatchingSponsoredForSearch(any(), any(), any(), any())).thenReturn(List.of());

        RecommendationResult result = recommendationsService.recommend(dto);

        assertNotNull(result);
        assertEquals("Paz e Cultura em Família", result.getTitulo());
        assertEquals(2, result.getLugares().size());
        assertEquals("Parque do Cocó", result.getLugares().get(0).getNome());
        assertEquals("Cineteatro São Luiz", result.getLugares().get(1).getNome());
    }

    @Test
    @DisplayName("Recommend usa Google Places no fallback se catalogo local falhar")
    void shouldFallbackToGooglePlacesWhenCatalogFails() {
        RecommendDto dto = new RecommendDto(
                "Relaxar",
                "Com família",
                List.of(new ActivityItemDto("nature", "Natureza")),
                "Fortaleza",
                "Ceará",
                "Brasil",
                null,
                null,
                15.0,
                null
        );

        when(locationSettingsService.getEffectiveMaxResults(anyString())).thenReturn(24);
        when(cityAnchor.resolve(any(), any(), any(), any(), any())).thenReturn(new CityAnchor.Center(-3.73, -38.52));
        when(cityAnchor.contains(any(), anyDouble(), any(), any(), any(), any())).thenReturn(true);
        when(recommendationCacheService.computeRecommendKey(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn("rec_fail_key");
        when(recommendationCacheService.getCachedRecommendation(anyString())).thenReturn(Optional.empty());
        when(groqClient.callGroqJson(any(), any(), eq(RecommendationResult.class), anyDouble(), anyInt(), any(Duration.class), anyInt()))
                .thenThrow(new RuntimeException("Simulated LLM error"));

        when(googlePlacesDiscoveryService.isConfigured()).thenReturn(true);
        when(googlePlacesDiscoveryService.searchPlaces(anyString(), any(), any(), any(), anyString(), anyString(), anyInt()))
                .thenReturn(List.of(
                        new GooglePlacesDiscoveryService.DiscoveredPlace(
                                "places/ChIJ_coco",
                                "Parque Estadual do Cocó",
                                "Av. Padre Antônio Tomás, Fortaleza",
                                "ChIJ_coco",
                                -3.75,
                                -38.48,
                                4.8,
                                1200,
                                true,
                                "park",
                                List.of("park", "tourist_attraction"),
                                "https://maps.google.com/?q=Coco",
                                "Grande parque verde urbano",
                                "https://photo.url/coco",
                                "FREE"
                        )
                ));

        RecommendationResult result = recommendationsService.recommend(dto);

        assertNotNull(result);
        assertFalse(result.getLugares().isEmpty());
        assertEquals("Parque Estadual do Cocó", result.getLugares().get(0).getNome());
    }

    @Test
    @DisplayName("Garante link do Google Maps mesmo para locais gerados sem correspondencia exata no Places")
    void shouldEnsureGoogleMapsUriEvenWithoutPlacesMatch() {
        RecommendDto dto = new RecommendDto(
                "Curioso",
                "a dois. gastar até 100 reais. Tempo disponível: 3 horas ou mais. Raio de 15 km.",
                List.of(new ActivityItemDto("nature", "Natureza", "parques, trilhas e natureza")),
                "Caucaia",
                "Ceará",
                "Brasil",
                null,
                null,
                15.0,
                null
        );

        when(locationSettingsService.getEffectiveMaxResults(anyString())).thenReturn(24);
        when(cityAnchor.resolve(any(), any(), any(), any(), any())).thenReturn(new CityAnchor.Center(-3.73, -38.65));
        when(cityAnchor.contains(any(), anyDouble(), any(), any(), any(), any())).thenReturn(true);
        when(recommendationCacheService.computeRecommendKey(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn("rec_test_key_caucaia_maps");
        when(recommendationCacheService.getCachedRecommendation(anyString())).thenReturn(Optional.empty());
        when(sponsoredPlaceService.getMatchingSponsoredForSearch(any(), any(), any(), any()))
                .thenReturn(List.of());

        PlaceDto placeSemMaps = new PlaceDto();
        placeSemMaps.setNome("Parque Ecológico do Açu");
        placeSemMaps.setTipo("Parque");
        placeSemMaps.setEndereco("Rodovia BR-020, Km 22, Açu — Caucaia");
        placeSemMaps.setGoogleMapsUri(null);

        RecommendationResult mockResult = new RecommendationResult(
                "Natureza em Caucaia",
                "Passeios ao ar livre",
                List.of(placeSemMaps)
        );

        when(groqClient.callGroqJson(any(), any(), eq(RecommendationResult.class), anyDouble(), anyInt(), any(Duration.class), anyInt()))
                .thenReturn(mockResult);

        RecommendationResult result = recommendationsService.recommend(dto);

        assertNotNull(result);
        assertFalse(result.getLugares().isEmpty());
        PlaceDto place = result.getLugares().get(0);
        assertNotNull(place.getGoogleMapsUri());
        assertTrue(place.getGoogleMapsUri().contains("google.com/maps/search/?api=1&query="));
        assertTrue(place.getGoogleMapsUri().contains("Parque+Ecol%C3%B3gico+do+A%C3%A7u"));
    }
}

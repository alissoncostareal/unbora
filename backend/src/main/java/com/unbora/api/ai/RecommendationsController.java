package com.unbora.api.ai;

import com.unbora.api.ai.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Validated
@Tag(name = "AI Recommendations", description = "Recomendações e busca inteligente com IA e enriquecimento de fotos")
public class RecommendationsController {

    private final RecommendationsService recommendationsService;

    public RecommendationsController(RecommendationsService recommendationsService) {
        this.recommendationsService = recommendationsService;
    }

    @PostMapping({"/recommendations", "/recommend", "/recomendar"})
    @Operation(summary = "Generate personalized AI recommendations by mood, feelings, and activities")
    public RecommendationResult recommend(@Valid @RequestBody RecommendDto dto) {
        return recommendationsService.recommend(dto);
    }

    @PostMapping({"/recommendations/personalized", "/recommend/personalized"})
    @Operation(summary = "Generate personalized AI recommendations based on user visit history and check-ins")
    public RecommendationResult recommendPersonalized(@Valid @RequestBody PersonalizedRecommendDto dto) {
        return recommendationsService.recommendFromHistory(dto);
    }

    @GetMapping({"/recommendations/personalized", "/recommend/personalized"})
    @Operation(summary = "Get personalized AI recommendations for user by query params")
    public RecommendationResult getPersonalized(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false, defaultValue = "Fortaleza") String city,
            @RequestParam(required = false) String region,
            @RequestParam(required = false, defaultValue = "Brasil") String country,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double radiusKm
    ) {
        return recommendationsService.recommendFromHistory(
                new PersonalizedRecommendDto(userId, city, region, country, latitude, longitude, radiusKm)
        );
    }

    @PostMapping({"/search", "/buscar"})
    @Operation(summary = "Smart AI search for places and venues")
    public RecommendationResult search(@Valid @RequestBody SearchDto dto) {
        return recommendationsService.search(dto);
    }

    @PostMapping({"/events/discover", "/events", "/eventos"})
    @Operation(summary = "Discover events and cultural schedule using AI")
    public DiscoverEventsResult discoverEvents(@Valid @RequestBody(required = false) DiscoverEventsDto dto) {
        DiscoverEventsDto effective = dto != null ? dto : new DiscoverEventsDto("Fortaleza");
        return recommendationsService.discoverEvents(effective);
    }

    @GetMapping({"/recommendations/dislikes", "/recomendar/dislikes"})
    @Operation(summary = "Get list of places dismissed by user")
    public List<String> dislikes(@RequestParam @Size(max = 120, message = "Invalid user ID") String userId) {
        return recommendationsService.dismissedKeys(userId);
    }

    @PostMapping({"/recommendations/feedback", "/recomendar/feedback"})
    @Operation(summary = "Register user recommendation feedback (Like, Dislike, Maps) for AI calibration")
    public ResponseEntity<?> feedback(@Valid @RequestBody RecommendationFeedbackDto feedbackDto) {
        recommendationsService.processFeedback(feedbackDto);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Feedback registered successfully"));
    }
}

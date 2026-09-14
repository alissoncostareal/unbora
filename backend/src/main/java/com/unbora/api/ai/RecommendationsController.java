package com.unbora.api.ai;

import com.unbora.api.ai.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "AI Recommendations", description = "Recomendações e busca inteligente com IA e enriquecimento de fotos")
public class RecommendationsController {

    private final RecommendationsService recommendationsService;

    public RecommendationsController(RecommendationsService recommendationsService) {
        this.recommendationsService = recommendationsService;
    }

    @PostMapping("/recomendar")
    @Operation(summary = "Gerar recomendações personalizadas por humor, sentimento e atividades")
    public RecommendationResult recommend(@Valid @RequestBody RecommendDto dto) {
        return recommendationsService.recommend(dto);
    }

    @PostMapping("/buscar")
    @Operation(summary = "Buscar lugares/eventos em Fortaleza usando IA")
    public RecommendationResult search(@Valid @RequestBody SearchDto dto) {
        return recommendationsService.search(dto);
    }

    @PostMapping("/eventos")
    @Operation(summary = "Descobrir eventos e programações culturais em Fortaleza com IA")
    public DiscoverEventsResult discoverEvents(@RequestBody(required = false) DiscoverEventsDto dto) {
        DiscoverEventsDto effective = dto != null ? dto : new DiscoverEventsDto("Fortaleza");
        return recommendationsService.discoverEvents(effective);
    }

    @PostMapping("/recomendar/feedback")
    @Operation(summary = "Registrar feedback de recomendação (Like, Dislike, Maps) para calibração da IA")
    public ResponseEntity<?> feedback(@Valid @RequestBody RecommendationFeedbackDto feedbackDto) {
        recommendationsService.processFeedback(feedbackDto);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Feedback registrado com sucesso"));
    }
}

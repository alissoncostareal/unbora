package com.unbora.api.domain.place;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/places")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminPlacesController {

    private final PlaceVectorSeederService placeVectorSeederService;
    private final PlaceEmbeddingRepository placeEmbeddingRepository;

    public AdminPlacesController(
            PlaceVectorSeederService placeVectorSeederService,
            PlaceEmbeddingRepository placeEmbeddingRepository
    ) {
        this.placeVectorSeederService = placeVectorSeederService;
        this.placeEmbeddingRepository = placeEmbeddingRepository;
    }

    @PostMapping("/seed-city")
    public Map<String, Object> seedCity(@RequestBody Map<String, Object> payload) {
        String city = (String) payload.getOrDefault("city", "Fortaleza");
        String country = (String) payload.getOrDefault("country", "Brasil");
        Integer limit = payload.containsKey("limit") ? ((Number) payload.get("limit")).intValue() : 15;
        return placeVectorSeederService.seedCityFromGooglePlaces(city, country, limit);
    }

    @GetMapping("/count")
    public Map<String, Object> getCount(@RequestParam(value = "city", required = false) String city) {
        if (city != null && !city.isBlank()) {
            return Map.of(
                    "city", city,
                    "count", placeEmbeddingRepository.countByCityIgnoreCase(city)
            );
        }
        return Map.of(
                "totalCount", placeEmbeddingRepository.count()
        );
    }
}

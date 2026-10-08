package com.unbora.api.domain.location;

import com.unbora.api.common.LocationsConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/locations")
@Tag(name = "Locations", description = "Regiões e cidades atendidas")
public class LocationsController {

    private final CityLookupService cityLookupService;

    public LocationsController(CityLookupService cityLookupService) {
        this.cityLookupService = cityLookupService;
    }

    @GetMapping
    @Operation(summary = "Listar regiões e cidades padrão de Fortaleza e Ceará")
    public Map<String, Object> list() {
        return Map.of(
                "defaultCity", LocationsConstants.DEFAULT_CITY,
                "defaultRegion", LocationsConstants.DEFAULT_REGION,
                "regions", LocationsConstants.REGIONS
        );
    }

    @GetMapping("/suggest")
    @Operation(summary = "Sugerir cidades pelo nome, via Google Places")
    public List<CitySuggestion> suggest(@RequestParam(defaultValue = "") String q) {
        return cityLookupService.suggest(q);
    }

    @GetMapping("/here")
    @Operation(summary = "Sugerir a cidade de uma coordenada, via Google Geocoding")
    public ResponseEntity<CitySuggestion> here(@RequestParam double lat, @RequestParam double lng) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return ResponseEntity.badRequest().build();
        CitySuggestion place = cityLookupService.here(lat, lng);
        return place == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(place);
    }
}

package com.unbora.api.domain.location;

import com.unbora.api.common.LocationsConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/locations")
@Tag(name = "Locations", description = "Regiões e cidades atendidas")
public class LocationsController {

    @GetMapping
    @Operation(summary = "Listar regiões e cidades padrão de Fortaleza e Ceará")
    public Map<String, Object> list() {
        return Map.of(
                "defaultCity", LocationsConstants.DEFAULT_CITY,
                "defaultRegion", LocationsConstants.DEFAULT_REGION,
                "regions", LocationsConstants.REGIONS
        );
    }
}

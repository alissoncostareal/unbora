package com.unbora.api.domain.location;

import com.unbora.api.domain.location.dto.LocationSettingsDto;
import com.unbora.api.domain.location.dto.SaveCityLimitDto;
import com.unbora.api.domain.location.dto.UpdateGlobalSettingsDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/locations/settings")
@Tag(name = "Admin Locations Settings", description = "Gerenciamento de limites de resultados por cidade e global")
public class AdminLocationsController {

    private final LocationSettingsService locationSettingsService;

    public AdminLocationsController(LocationSettingsService locationSettingsService) {
        this.locationSettingsService = locationSettingsService;
    }

    @GetMapping
    @Operation(summary = "Obter configurações globais e limites por cidade")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONSULTOR')")
    public LocationSettingsDto getSettings() {
        return locationSettingsService.getLocationSettings();
    }

    @PutMapping
    @Operation(summary = "Atualizar número de resultados padrão global")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public LocationSettingsDto updateGlobalSettings(@Valid @RequestBody UpdateGlobalSettingsDto dto) {
        return locationSettingsService.updateGlobalSettings(dto.defaultMaxResults());
    }

    @PostMapping("/cities")
    @Operation(summary = "Criar ou atualizar limite de resultados para uma cidade específica")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public LocationSettingsDto saveCityLimit(@Valid @RequestBody SaveCityLimitDto dto) {
        return locationSettingsService.saveCityLimit(dto);
    }

    @DeleteMapping("/cities/{id}")
    @Operation(summary = "Remover limite customizado de uma cidade (retornando ao padrão global)")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public LocationSettingsDto deleteCityLimit(@PathVariable("id") String id) {
        return locationSettingsService.deleteCityLimit(id);
    }
}

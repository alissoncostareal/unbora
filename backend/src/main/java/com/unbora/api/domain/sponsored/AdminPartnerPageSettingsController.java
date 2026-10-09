package com.unbora.api.domain.sponsored;

import com.unbora.api.domain.sponsored.dto.PartnerPageSettingsDto;
import com.unbora.api.domain.sponsored.dto.UpdatePartnerPageSettingsDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/partner-settings")
public class AdminPartnerPageSettingsController {

    private final PartnerPageSettingsService service;

    public AdminPartnerPageSettingsController(PartnerPageSettingsService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONSULTOR')")
    public ResponseEntity<PartnerPageSettingsDto> getSettings() {
        return ResponseEntity.ok(service.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<PartnerPageSettingsDto> updateSettings(@RequestBody UpdatePartnerPageSettingsDto dto) {
        return ResponseEntity.ok(service.updateSettings(dto));
    }
}

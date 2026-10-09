package com.unbora.api.domain.sponsored;

import com.unbora.api.domain.sponsored.dto.PartnerPageSettingsDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/partner-settings", "/partner-settings", "/api/partner/settings"})
public class PartnerPageSettingsController {

    private final PartnerPageSettingsService service;

    public PartnerPageSettingsController(PartnerPageSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PartnerPageSettingsDto> getSettings() {
        return ResponseEntity.ok(service.getSettings());
    }
}

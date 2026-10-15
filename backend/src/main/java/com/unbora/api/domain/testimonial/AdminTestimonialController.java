package com.unbora.api.domain.testimonial;

import com.unbora.api.domain.testimonial.dto.TestimonialSettingsDto;
import com.unbora.api.domain.testimonial.dto.UpdateTestimonialSettingsDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/testimonials")
@Tag(name = "Admin Testimonials", description = "Gestão de depoimentos da página inicial")
public class AdminTestimonialController {

    private final TestimonialSettingsService service;

    public AdminTestimonialController(TestimonialSettingsService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONSULTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obter configuração de depoimentos (Admin)")
    public ResponseEntity<TestimonialSettingsDto> getSettings() {
        return ResponseEntity.ok(service.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Atualizar textos e depoimentos (Admin)")
    public ResponseEntity<TestimonialSettingsDto> updateSettings(@RequestBody UpdateTestimonialSettingsDto dto) {
        return ResponseEntity.ok(service.updateSettings(dto));
    }
}

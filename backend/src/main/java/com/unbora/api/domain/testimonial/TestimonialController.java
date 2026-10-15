package com.unbora.api.domain.testimonial;

import com.unbora.api.domain.testimonial.dto.TestimonialSettingsDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/testimonials", "/testimonials"})
@Tag(name = "Testimonials", description = "Configurações e depoimentos da página inicial")
public class TestimonialController {

    private final TestimonialSettingsService service;

    public TestimonialController(TestimonialSettingsService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Obter depoimentos e configuração pública da home")
    public ResponseEntity<TestimonialSettingsDto> getSettings() {
        return ResponseEntity.ok(service.getPublicSettings());
    }
}

package com.unbora.api.domain.carousel;

import com.unbora.api.domain.carousel.dto.CarouselRecordDto;
import com.unbora.api.domain.carousel.dto.CreateCarouselDto;
import com.unbora.api.domain.carousel.dto.UpdateCarouselDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/carousels")
@Tag(name = "Carousels", description = "Carrosséis e Stories patrocinados / orgânicos")
public class CarouselsController {

    private final CarouselsService carouselsService;

    public CarouselsController(CarouselsService carouselsService) {
        this.carouselsService = carouselsService;
    }

    @GetMapping
    @Operation(summary = "Listar carrosséis/stories com filtros")
    public List<CarouselRecordDto> list(
            @RequestParam(required = false) String active,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region
    ) {
        boolean activeOnly = "true".equalsIgnoreCase(active) || "1".equals(active);
        return carouselsService.list(activeOnly, city, region);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Criar carrossel (Admin)")
    public CarouselRecordDto create(@Valid @RequestBody CreateCarouselDto dto) {
        return carouselsService.create(dto);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Atualizar carrossel (Admin)")
    public CarouselRecordDto update(@PathVariable String id, @RequestBody UpdateCarouselDto dto) {
        return carouselsService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Remover carrossel (Admin)")
    public Map<String, Object> remove(@PathVariable String id) {
        return carouselsService.remove(id);
    }
}

package com.unbora.api.domain.sponsored;

import com.unbora.api.domain.sponsored.dto.SaveSponsoredPlaceDto;
import com.unbora.api.domain.sponsored.dto.SponsoredPlaceDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/sponsored")
public class AdminSponsoredController {

    private final SponsoredPlaceService service;

    public AdminSponsoredController(SponsoredPlaceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SponsoredPlaceDto>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SponsoredPlaceDto> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredPlaceDto> create(@RequestBody SaveSponsoredPlaceDto dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredPlaceDto> update(
            @PathVariable String id,
            @RequestBody SaveSponsoredPlaceDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PostMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredPlaceDto> toggleActive(@PathVariable String id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("deleted", true, "id", id));
    }
}

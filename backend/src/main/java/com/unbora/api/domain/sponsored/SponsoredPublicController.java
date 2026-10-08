package com.unbora.api.domain.sponsored;

import com.unbora.api.domain.sponsored.dto.SponsoredPlaceDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sponsored")
public class SponsoredPublicController {

    private final SponsoredPlaceService service;

    public SponsoredPublicController(SponsoredPlaceService service) {
        this.service = service;
    }

    @PostMapping("/{id}/click")
    public ResponseEntity<Map<String, Object>> recordClick(@PathVariable String id) {
        service.trackClick(id);
        return ResponseEntity.ok(Map.of("tracked", true, "id", id));
    }

    @GetMapping("/highlights")
    public ResponseEntity<List<SponsoredPlace>> getHomeHighlights(@RequestParam(defaultValue = "Fortaleza") String city) {
        return ResponseEntity.ok(service.getActiveHomeHighlights(city));
    }
}

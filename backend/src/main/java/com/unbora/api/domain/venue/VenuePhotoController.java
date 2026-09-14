package com.unbora.api.domain.venue;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/venue-photos")
@Tag(name = "Venue Photos", description = "Auditoria e curadoria de fotos de estabelecimentos")
public class VenuePhotoController {

    private final VenuePhotoRepository venuePhotoRepository;

    public VenuePhotoController(VenuePhotoRepository venuePhotoRepository) {
        this.venuePhotoRepository = venuePhotoRepository;
    }

    @GetMapping
    @Operation(summary = "Listar todas as fotos cacheadas de estabelecimentos")
    public List<VenuePhoto> listVenuePhotos() {
        return venuePhotoRepository.findAll();
    }

    @GetMapping("/{venueNormalized}")
    @Operation(summary = "Obter foto de um estabelecimento pelo nome normalizado")
    public ResponseEntity<VenuePhoto> getVenuePhoto(@PathVariable String venueNormalized) {
        return venuePhotoRepository.findByVenueNormalized(venueNormalized)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{venueNormalized}")
    @Operation(summary = "Atualizar ou curar a URL da foto de um estabelecimento")
    public ResponseEntity<VenuePhoto> updateVenuePhoto(
            @PathVariable String venueNormalized,
            @RequestBody Map<String, String> body
    ) {
        String newUrl = body.get("photoUrl");
        if (newUrl == null || newUrl.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<VenuePhoto> existing = venuePhotoRepository.findByVenueNormalized(venueNormalized);
        VenuePhoto photo;
        if (existing.isPresent()) {
            photo = existing.get();
            photo.setPhotoUrl(newUrl);
            photo.setSource("admin_curated");
        } else {
            String displayName = body.getOrDefault("displayName", venueNormalized);
            String city = body.getOrDefault("city", "Fortaleza");
            String category = body.getOrDefault("categoryTag", "gastronomia");
            photo = new VenuePhoto(venueNormalized, displayName, city, newUrl, "admin_curated", category);
        }

        venuePhotoRepository.save(photo);
        return ResponseEntity.ok(photo);
    }
}

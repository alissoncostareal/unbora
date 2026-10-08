package com.unbora.api.domain.place;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/bans")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class PlaceBanController {

    private final PlaceBanService placeBanService;

    public PlaceBanController(PlaceBanService placeBanService) {
        this.placeBanService = placeBanService;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return placeBanService.list();
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, String> body) {
        return placeBanService.create(body.get("name"), body.get("placeId"), body.get("city"), body.get("reason"));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> remove(@PathVariable String id) {
        return placeBanService.remove(id);
    }
}

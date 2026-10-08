package com.unbora.api.domain.guide;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/guide")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminGuideController {

    private final GuideService guideService;

    public AdminGuideController(GuideService guideService) {
        this.guideService = guideService;
    }

    @GetMapping
    public Map<String, Object> catalog() {
        return guideService.catalog(true);
    }

    @PostMapping("/options")
    public Map<String, Object> create(@RequestBody Map<String, String> body) {
        return guideService.create(
                body.get("step"),
                body.get("label"),
                body.get("value"),
                body.get("note"),
                body.get("line"),
                body.get("searchHint")
        );
    }

    @PatchMapping("/options/{id}")
    public Map<String, Object> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Boolean active = body.get("active") instanceof Boolean value ? value : null;
        return guideService.update(
                id,
                text(body.get("label")),
                text(body.get("value")),
                text(body.get("note")),
                text(body.get("line")),
                text(body.get("searchHint")),
                active
        );
    }

    @DeleteMapping("/options/{id}")
    public Map<String, Object> remove(@PathVariable String id) {
        return guideService.remove(id);
    }

    @PutMapping("/budget")
    public Map<String, Object> budget(@RequestBody Map<String, Integer> body) {
        return guideService.updateBudget(
                number(body.get("min"), 0),
                number(body.get("max"), 300),
                number(body.get("step"), 10),
                number(body.get("defaultValue"), 80)
        );
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static int number(Integer value, int fallback) {
        return value == null ? fallback : value;
    }
}

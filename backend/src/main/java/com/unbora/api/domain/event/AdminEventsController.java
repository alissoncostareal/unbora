package com.unbora.api.domain.event;

import com.unbora.api.domain.event.dto.EventRecordDto;
import com.unbora.api.domain.event.dto.RejectEventDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/events")
@Tag(name = "Admin Events", description = "Moderação de eventos da comunidade")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminEventsController {

    private final EventsService eventsService;

    public AdminEventsController(EventsService eventsService) {
        this.eventsService = eventsService;
    }

    @GetMapping
    @Operation(summary = "Listar eventos para moderação")
    public List<EventRecordDto> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String category
    ) {
        return eventsService.listAdmin(city, region, status, category);
    }

    @GetMapping("/pending-count")
    @Operation(summary = "Contagem de eventos pendentes")
    public Map<String, Long> pendingCount() {
        return Map.of("count", eventsService.countPending());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Aprovar evento")
    public EventRecordDto approve(@PathVariable String id) {
        return eventsService.approve(id);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Recusar evento")
    public EventRecordDto reject(
            @PathVariable String id,
            @RequestBody(required = false) RejectEventDto body
    ) {
        return eventsService.reject(id, body != null ? body.reason() : null);
    }
}

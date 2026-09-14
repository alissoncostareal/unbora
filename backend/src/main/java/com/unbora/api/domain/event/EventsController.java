package com.unbora.api.domain.event;

import com.unbora.api.domain.event.dto.CreateEventDto;
import com.unbora.api.domain.event.dto.EventRecordDto;
import com.unbora.api.domain.event.dto.UpdateEventDto;
import com.unbora.api.domain.event.dto.ImportInstagramEventDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/events")
@Tag(name = "Events", description = "Operações de eventos da comunidade e lojistas")
public class EventsController {

    private final EventsService eventsService;
    private final InstagramEventService instagramEventService;
    private final RealEventSyncService realEventSyncService;

    public EventsController(
            EventsService eventsService,
            InstagramEventService instagramEventService,
            RealEventSyncService realEventSyncService
    ) {
        this.eventsService = eventsService;
        this.instagramEventService = instagramEventService;
        this.realEventSyncService = realEventSyncService;
    }

    @PostMapping("/sync-live")
    @Operation(summary = "Limpar base e sincronizar eventos reais ao vivo do Instagram e web")
    public List<EventRecordDto> syncLive(
            @RequestParam(required = false, defaultValue = "Fortaleza") String city,
            @RequestParam(required = false, defaultValue = "true") boolean clearExisting
    ) {
        return realEventSyncService.syncLiveEvents(city, clearExisting);
    }

    @PostMapping("/import-instagram")
    @Operation(summary = "Importar e estruturar evento a partir de um post do Instagram com foto original")
    public EventRecordDto importInstagram(@Valid @RequestBody ImportInstagramEventDto dto) {
        return instagramEventService.importFromInstagram(dto);
    }

    @GetMapping
    @Operation(summary = "Listar eventos com filtros opcionais")
    public List<EventRecordDto> list(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region,
            @RequestParam(required = false, defaultValue = "true") String active,
            @RequestParam(required = false) String merchantId
    ) {
        if (merchantId != null && !merchantId.isBlank()) {
            return eventsService.listByMerchant(merchantId);
        }
        boolean activeOnly = !"false".equalsIgnoreCase(active);
        return eventsService.list(city, region, activeOnly);
    }

    @PostMapping
    @Operation(summary = "Criar novo evento (lojistas)")
    public EventRecordDto create(@Valid @RequestBody CreateEventDto dto) {
        return eventsService.create(dto);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Atualizar evento existente")
    public EventRecordDto update(
            @PathVariable String id,
            @RequestHeader(value = "x-user-id", required = true) String merchantId,
            @RequestBody UpdateEventDto dto
    ) {
        return eventsService.update(id, merchantId, dto);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remover evento")
    public Map<String, Object> remove(
            @PathVariable String id,
            @RequestHeader(value = "x-user-id", required = true) String merchantId
    ) {
        return eventsService.remove(id, merchantId);
    }
}

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
@Tag(name = "Events", description = "Operações de eventos da comunidade")
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
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Limpar base e sincronizar eventos reais ao vivo do Instagram e web")
    public List<EventRecordDto> syncLive(
            @RequestParam(required = false, defaultValue = "Fortaleza") String city,
            @RequestParam(required = false, defaultValue = "true") boolean clearExisting
    ) {
        return realEventSyncService.syncLiveEvents(city, clearExisting);
    }

    @PostMapping("/import-instagram")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Importar e estruturar evento a partir de um post do Instagram com foto original")
    public EventRecordDto importInstagram(@Valid @RequestBody ImportInstagramEventDto dto) {
        return instagramEventService.importFromInstagram(dto);
    }

    @GetMapping
    @Operation(summary = "Listar eventos aprovados (feed público)")
    public List<EventRecordDto> list(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region,
            @RequestParam(required = false, defaultValue = "true") String active,
            @RequestParam(required = false) String merchantId,
            @RequestParam(required = false) String category
    ) {
        if (merchantId != null && !merchantId.isBlank()) {
            return eventsService.listByMerchant(merchantId);
        }
        boolean activeOnly = !"false".equalsIgnoreCase(active);
        return eventsService.list(city, region, activeOnly, category);
    }

    @PostMapping
    @Operation(summary = "Criar evento (qualquer usuário logado) — fica PENDING até aprovação")
    public EventRecordDto create(@Valid @RequestBody CreateEventDto dto) {
        return eventsService.create(dto);
    }

    @PatchMapping("/{id}")
    @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Atualizar evento existente (autor)")
    public EventRecordDto update(
            @PathVariable String id,
            @RequestHeader(value = "x-user-id", required = false) String headerMerchantId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.unbora.api.security.AdminPrincipal principal,
            @RequestBody UpdateEventDto dto
    ) {
        String effectiveMerchantId = resolveAuthor(principal, headerMerchantId);
        return eventsService.update(id, effectiveMerchantId, dto);
    }

    @DeleteMapping("/{id}")
    @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Remover evento")
    public Map<String, Object> remove(
            @PathVariable String id,
            @RequestHeader(value = "x-user-id", required = false) String headerMerchantId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.unbora.api.security.AdminPrincipal principal
    ) {
        String effectiveMerchantId = resolveAuthor(principal, headerMerchantId);
        return eventsService.remove(id, effectiveMerchantId);
    }

    private String resolveAuthor(com.unbora.api.security.AdminPrincipal principal, String headerMerchantId) {
        if (principal != null) {
            return principal.id();
        }
        if (headerMerchantId != null && !headerMerchantId.isBlank()) {
            return headerMerchantId.trim();
        }
        throw new com.unbora.api.common.exception.ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Autenticação necessária.");
    }
}

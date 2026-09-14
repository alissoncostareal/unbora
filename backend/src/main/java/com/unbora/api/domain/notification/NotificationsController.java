package com.unbora.api.domain.notification;

import com.unbora.api.domain.notification.dto.CreateNotificationDto;
import com.unbora.api.domain.notification.dto.NotificationRecordDto;
import com.unbora.api.domain.notification.dto.UpdateNotificationDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@Tag(name = "Notifications", description = "Notificações e avisos da plataforma")
public class NotificationsController {

    private final NotificationsService notificationsService;

    public NotificationsController(NotificationsService notificationsService) {
        this.notificationsService = notificationsService;
    }

    @GetMapping
    @Operation(summary = "Listar notificações com filtros")
    public List<NotificationRecordDto> list(
            @RequestParam(required = false) String active,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region
    ) {
        boolean activeOnly = "true".equalsIgnoreCase(active) || "1".equals(active);
        return notificationsService.list(activeOnly, city, region);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Criar notificação (Admin)")
    public NotificationRecordDto create(@Valid @RequestBody CreateNotificationDto dto) {
        return notificationsService.create(dto);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Atualizar notificação (Admin)")
    public NotificationRecordDto update(@PathVariable String id, @RequestBody UpdateNotificationDto dto) {
        return notificationsService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Remover notificação (Admin)")
    public Map<String, Object> remove(@PathVariable String id) {
        return notificationsService.remove(id);
    }
}

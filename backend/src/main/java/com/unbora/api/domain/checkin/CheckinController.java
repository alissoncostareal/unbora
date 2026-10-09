package com.unbora.api.domain.checkin;

import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.checkin.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/checkins")
@Tag(name = "Checkins", description = "Check-ins de usuários em locais visitados e histórico de revisitas")
public class CheckinController {

    private final CheckinService checkinService;

    public CheckinController(CheckinService checkinService) {
        this.checkinService = checkinService;
    }

    private String resolveUserId(String headerUserId, String paramUserId) {
        if (headerUserId != null && !headerUserId.isBlank()) {
            return headerUserId.trim();
        }
        if (paramUserId != null && !paramUserId.isBlank()) {
            return paramUserId.trim();
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Identificação do usuário (x-user-id ou userId) necessária.");
    }

    @PostMapping
    @Operation(summary = "Registrar check-in em um local")
    public CheckinDto create(
            @RequestHeader(value = "x-user-id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId,
            @Valid @RequestBody CreateCheckinDto dto
    ) {
        String userId = resolveUserId(headerUserId, paramUserId);
        return checkinService.create(userId, dto);
    }

    @GetMapping
    @Operation(summary = "Listar todos os check-ins do usuário")
    public List<CheckinDto> list(
            @RequestHeader(value = "x-user-id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = resolveUserId(headerUserId, paramUserId);
        return checkinService.listByUser(userId);
    }

    @GetMapping("/revisit")
    @Operation(summary = "Obter visitas agrupadas por período (esta semana, semana passada, mês passado) com convites para revisitar")
    public RevisitGroupDto getRevisits(
            @RequestHeader(value = "x-user-id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = resolveUserId(headerUserId, paramUserId);
        return checkinService.getRevisitGroups(userId);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remover um check-in")
    public Map<String, Object> delete(
            @PathVariable String id,
            @RequestHeader(value = "x-user-id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = resolveUserId(headerUserId, paramUserId);
        checkinService.delete(id, userId);
        return Map.of("success", true, "message", "Check-in removido com sucesso.");
    }
}

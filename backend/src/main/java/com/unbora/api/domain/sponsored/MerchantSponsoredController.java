package com.unbora.api.domain.sponsored;

import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.sponsored.dto.*;
import com.unbora.api.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/merchant/sponsored")
@Tag(name = "Merchant Sponsored", description = "Portal do Lojista: Gestão de anúncios, planos, métricas e pagamentos PIX")
public class MerchantSponsoredController {

    private final SponsoredPlaceService service;

    public MerchantSponsoredController(SponsoredPlaceService service) {
        this.service = service;
    }

    private String resolveMerchantId(AdminPrincipal principal, String paramMerchantId) {
        if (principal == null) {
            if (paramMerchantId != null && !paramMerchantId.isBlank()) {
                return paramMerchantId.trim();
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Autenticação necessária.");
        }
        if ("SUPERADMIN".equalsIgnoreCase(principal.role()) || "ADMIN".equalsIgnoreCase(principal.role())) {
            return (paramMerchantId != null && !paramMerchantId.isBlank()) ? paramMerchantId.trim() : principal.id();
        }
        return principal.id();
    }

    private void verifyPlaceOwnership(String placeId, String merchantId, AdminPrincipal principal) {
        if (principal != null && ("SUPERADMIN".equalsIgnoreCase(principal.role()) || "ADMIN".equalsIgnoreCase(principal.role()))) {
            return;
        }
        SponsoredPlaceDto place = service.getById(placeId);
        if (place.merchantId() != null && !place.merchantId().equals(merchantId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Estabelecimento não pertence ao lojista autenticado.");
        }
    }

    @GetMapping("/places")
    @PreAuthorize("hasAnyRole('MERCHANT', 'SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar estabelecimentos vinculados ao lojista")
    public List<SponsoredPlaceDto> listMyPlaces(
            @RequestParam(required = false) String merchantId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return service.listByMerchant(resolveMerchantId(principal, merchantId));
    }

    @PostMapping("/places")
    @PreAuthorize("hasAnyRole('MERCHANT', 'SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cadastrar novo estabelecimento patrocinado pelo lojista")
    public SponsoredPlaceDto createMyPlace(
            @RequestParam(required = false) String merchantId,
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody SaveSponsoredPlaceDto dto
    ) {
        return service.createForMerchant(resolveMerchantId(principal, merchantId), dto);
    }

    @PutMapping("/places/{id}")
    @PreAuthorize("hasAnyRole('MERCHANT', 'SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Atualizar informações do estabelecimento do lojista")
    public SponsoredPlaceDto updateMyPlace(
            @PathVariable String id,
            @RequestParam(required = false) String merchantId,
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody SaveSponsoredPlaceDto dto
    ) {
        String effectiveMerchantId = resolveMerchantId(principal, merchantId);
        verifyPlaceOwnership(id, effectiveMerchantId, principal);
        return service.updateForMerchant(effectiveMerchantId, id, dto);
    }

    @PostMapping("/places/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('MERCHANT', 'SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Pausar ou ativar campanha do estabelecimento")
    public SponsoredPlaceDto toggleActive(
            @PathVariable String id,
            @RequestParam(required = false) String merchantId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        String effectiveMerchantId = resolveMerchantId(principal, merchantId);
        verifyPlaceOwnership(id, effectiveMerchantId, principal);
        return service.toggleActive(id);
    }

    @PostMapping("/places/{id}/recharge")
    @PreAuthorize("hasAnyRole('MERCHANT', 'SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Recarregar saldo de créditos de desempenho (CPC)")
    public SponsoredInvoiceDto rechargeCredits(
            @PathVariable String id,
            @RequestParam(required = false) String merchantId,
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody RechargeCreditsDto dto
    ) {
        String effectiveMerchantId = resolveMerchantId(principal, merchantId);
        verifyPlaceOwnership(id, effectiveMerchantId, principal);
        return service.rechargeCredits(id, dto);
    }

    public record ChangePlanRequest(PlanTier planTier, BillingModel billingModel) {}

    @PostMapping("/places/{id}/change-plan")
    @PreAuthorize("hasAnyRole('MERCHANT', 'SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Alterar plano de assinatura (Bronze, Prata, Ouro) e gerar fatura")
    public SponsoredInvoiceDto changePlan(
            @PathVariable String id,
            @RequestParam(required = false) String merchantId,
            @AuthenticationPrincipal AdminPrincipal principal,
            @RequestBody ChangePlanRequest req
    ) {
        String effectiveMerchantId = resolveMerchantId(principal, merchantId);
        verifyPlaceOwnership(id, effectiveMerchantId, principal);
        return service.changePlan(id, req.planTier() != null ? req.planTier() : PlanTier.GOLD, req.billingModel());
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('MERCHANT', 'SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar histórico de faturas e pagamentos do lojista")
    public List<SponsoredInvoiceDto> listMyInvoices(
            @RequestParam(required = false) String merchantId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return service.listInvoicesByMerchant(resolveMerchantId(principal, merchantId));
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Confirmar liquidação de fatura PIX (Apenas Administrador)")
    public SponsoredInvoiceDto payInvoice(
            @PathVariable String invoiceId,
            @RequestParam(required = false) String merchantId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return service.markInvoicePaidForMerchant(invoiceId, resolveMerchantId(principal, merchantId));
    }

    @GetMapping("/plans")
    @Operation(summary = "Tabela de preços e benefícios dos planos disponíveis")
    public List<Map<String, Object>> getAvailablePlans() {
        return List.of(
                Map.of(
                        "tier", PlanTier.BRONZE.name(),
                        "name", "Plano Bronze",
                        "monthlyPrice", BigDecimal.valueOf(99.00),
                        "description", "Presença garantida nas buscas com selo de Patrocinado e benefício exclusivo.",
                        "features", List.of(
                                "Selo 'Patrocinado' nas buscas da cidade",
                                "Destaque do Benefício Exclusivo (Unbora Perks)",
                                "Aparece em pesquisas com intenção e humor compatíveis",
                                "Relatório básico de visualizações e cliques"
                        ),
                        "slotBoost", true,
                        "homeHighlight", false
                ),
                Map.of(
                        "tier", PlanTier.SILVER.name(),
                        "name", "Plano Prata (Mais Popular)",
                        "monthlyPrice", BigDecimal.valueOf(179.00),
                        "description", "Prioridade alta no Slot de Ouro de buscas e destaque nas recomendações personalizadas.",
                        "features", List.of(
                                "Slot de Ouro: Posição fixa no topo dos resultados de busca",
                                "Selo Patrocinado com badge 'Recomendação Parceira'",
                                "Destaque de benefício com badge pulsante",
                                "Matching inteligente com mais tags e categorias",
                                "Métricas de cliques em tempo real"
                        ),
                        "slotBoost", true,
                        "homeHighlight", false
                ),
                Map.of(
                        "tier", PlanTier.GOLD.name(),
                        "name", "Plano Ouro (Impacto Máximo)",
                        "monthlyPrice", BigDecimal.valueOf(299.00),
                        "description", "Visibilidade total: Topo da busca + Carrossel de Destaques na Home e no App.",
                        "features", List.of(
                                "Presença no Carrossel 'Lugares em Destaque' da Home",
                                "Prioridade máxima no Slot de Ouro de buscas",
                                "Selo dourado exclusivo de parceiro oficial",
                                "Aparece em todas as buscas da cidade",
                                "Suporte prioritário via WhatsApp"
                        ),
                        "slotBoost", true,
                        "homeHighlight", true
                )
        );
    }
}

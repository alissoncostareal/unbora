package com.unbora.api.domain.sponsored;

import com.unbora.api.domain.sponsored.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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

    @GetMapping("/places")
    @Operation(summary = "Listar estabelecimentos vinculados ao lojista")
    public List<SponsoredPlaceDto> listMyPlaces(@RequestParam String merchantId) {
        return service.listByMerchant(merchantId);
    }

    @PostMapping("/places")
    @Operation(summary = "Cadastrar novo estabelecimento patrocinado pelo lojista")
    public SponsoredPlaceDto createMyPlace(
            @RequestParam String merchantId,
            @Valid @RequestBody SaveSponsoredPlaceDto dto
    ) {
        return service.createForMerchant(merchantId, dto);
    }

    @PutMapping("/places/{id}")
    @Operation(summary = "Atualizar informações do estabelecimento do lojista")
    public SponsoredPlaceDto updateMyPlace(
            @PathVariable String id,
            @RequestParam String merchantId,
            @Valid @RequestBody SaveSponsoredPlaceDto dto
    ) {
        return service.updateForMerchant(merchantId, id, dto);
    }

    @PostMapping("/places/{id}/toggle-active")
    @Operation(summary = "Pausar ou ativar campanha do estabelecimento")
    public SponsoredPlaceDto toggleActive(@PathVariable String id) {
        return service.toggleActive(id);
    }

    @PostMapping("/places/{id}/recharge")
    @Operation(summary = "Recarregar saldo de créditos de desempenho (CPC)")
    public SponsoredInvoiceDto rechargeCredits(
            @PathVariable String id,
            @Valid @RequestBody RechargeCreditsDto dto
    ) {
        return service.rechargeCredits(id, dto);
    }

    public record ChangePlanRequest(PlanTier planTier, BillingModel billingModel) {}

    @PostMapping("/places/{id}/change-plan")
    @Operation(summary = "Alterar plano de assinatura (Bronze, Prata, Ouro) e gerar fatura")
    public SponsoredInvoiceDto changePlan(
            @PathVariable String id,
            @RequestBody ChangePlanRequest req
    ) {
        return service.changePlan(id, req.planTier() != null ? req.planTier() : PlanTier.GOLD, req.billingModel());
    }

    @GetMapping("/invoices")
    @Operation(summary = "Listar histórico de faturas e pagamentos do lojista")
    public List<SponsoredInvoiceDto> listMyInvoices(@RequestParam String merchantId) {
        return service.listInvoicesByMerchant(merchantId);
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
                                "Selo 'Patrocinado ✦' nas buscas da cidade",
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

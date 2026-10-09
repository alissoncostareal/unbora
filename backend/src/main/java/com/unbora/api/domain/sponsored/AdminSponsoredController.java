package com.unbora.api.domain.sponsored;

import com.unbora.api.domain.sponsored.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/sponsored")
public class AdminSponsoredController {

    private final SponsoredPlaceService service;

    public AdminSponsoredController(SponsoredPlaceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SponsoredPlaceDto>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SponsoredPlaceDto> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredPlaceDto> create(@RequestBody SaveSponsoredPlaceDto dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredPlaceDto> update(
            @PathVariable String id,
            @RequestBody SaveSponsoredPlaceDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PostMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredPlaceDto> toggleActive(@PathVariable String id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("deleted", true, "id", id));
    }

    // --- 2. Endpoints de Cobrança e Monetização ---

    @GetMapping("/billing/overview")
    public ResponseEntity<SponsoredFinancialOverviewDto> getFinancialOverview() {
        return ResponseEntity.ok(service.getFinancialOverview());
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<SponsoredInvoiceDto>> listInvoices(
            @RequestParam(required = false) String placeId,
            @RequestParam(required = false) InvoiceStatus status
    ) {
        return ResponseEntity.ok(service.listInvoices(placeId, status));
    }

    @PostMapping("/{id}/invoices")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredInvoiceDto> createInvoice(
            @PathVariable String id,
            @RequestBody CreateInvoiceDto dto
    ) {
        return ResponseEntity.ok(service.createInvoice(id, dto));
    }

    @PostMapping("/{id}/recharge")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredInvoiceDto> rechargeCredits(
            @PathVariable String id,
            @RequestBody RechargeCreditsDto dto
    ) {
        return ResponseEntity.ok(service.rechargeCredits(id, dto));
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredInvoiceDto> markInvoicePaid(@PathVariable String invoiceId) {
        return ResponseEntity.ok(service.markInvoicePaid(invoiceId));
    }

    @PostMapping("/invoices/{invoiceId}/cancel")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SponsoredInvoiceDto> cancelInvoice(@PathVariable String invoiceId) {
        return ResponseEntity.ok(service.cancelInvoice(invoiceId));
    }
}

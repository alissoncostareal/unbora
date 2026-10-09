package com.unbora.api.domain.sponsored;

import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.sponsored.dto.RechargeCreditsDto;
import com.unbora.api.domain.sponsored.dto.SaveSponsoredPlaceDto;
import com.unbora.api.domain.sponsored.dto.SponsoredInvoiceDto;
import com.unbora.api.domain.sponsored.dto.SponsoredPlaceDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SponsoredSecurityAndPaymentTest {

    private SponsoredPlaceRepository placeRepository;
    private SponsoredInvoiceRepository invoiceRepository;
    private SponsoredPlaceService service;

    @BeforeEach
    void setUp() {
        placeRepository = mock(SponsoredPlaceRepository.class);
        invoiceRepository = mock(SponsoredInvoiceRepository.class);
        service = new SponsoredPlaceService(placeRepository, invoiceRepository);
    }

    @Test
    @DisplayName("Security: Input sanitization strips XSS scripts and SQL injection payloads on place creation")
    void testInputSanitizationOnCreate() {
        String merchantId = UUID.randomUUID().toString();
        SaveSponsoredPlaceDto maliciousDto = new SaveSponsoredPlaceDto(
                "<script>alert('xss')</script>Bistrô Seguro",
                "Fortaleza'; DROP TABLE places; --",
                "Ceará",
                "Brasil",
                "<b onload='evil()'>Restaurante</b>",
                "Descrição limpa com <iframe src='javascript:void(0)'></iframe>",
                "10% off com <svg onload=alert(1)>",
                "tag1, <script>evil</script>, tag2",
                "https://images.unsplash.com/photo-123",
                "https://maps.google.com/?q=safe",
                "Av. Central, 100",
                "ChIJ123; <script>",
                4.8,
                "MODERATE",
                true,
                true,
                true,
                0,
                BillingModel.SUBSCRIPTION,
                PlanTier.GOLD,
                BigDecimal.valueOf(299.00),
                BigDecimal.ZERO,
                BigDecimal.valueOf(0.75),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                PaymentStatus.PAID,
                null,
                null,
                "Carlos <script>alert(1)</script>",
                "(85) 9999-8888",
                "carlos@bistrosegurol.com",
                "00.000.000/0001-00",
                "Notas limpas",
                true,
                merchantId,
                "Empresa Segura",
                "empresa@unbora.com"
        );

        when(placeRepository.save(any(SponsoredPlace.class))).thenAnswer(inv -> {
            SponsoredPlace p = inv.getArgument(0);
            return p;
        });

        SponsoredPlaceDto result = service.createForMerchant(merchantId, maliciousDto);

        assertNotNull(result);
        assertFalse(result.name().contains("<script>"));
        assertFalse(result.name().contains("</script>"));
        assertEquals("alert('xss')Bistrô Seguro", result.name());

        assertFalse(result.city().contains(";"));
        assertFalse(result.type().contains("<b"));
        assertFalse(result.description().contains("<iframe"));
        assertFalse(result.benefitText().contains("<svg"));
        assertFalse(result.contactName().contains("<script>"));
    }

    @Test
    @DisplayName("Security: IDOR prevention - Merchant A cannot update Merchant B's establishment")
    void testIdorPreventionOnUpdate() {
        String merchantA = UUID.randomUUID().toString();
        String merchantB = UUID.randomUUID().toString();
        String placeId = UUID.randomUUID().toString();

        SponsoredPlace existingPlace = new SponsoredPlace();
        existingPlace.setId(placeId);
        existingPlace.setName("Restaurante do Lojista A");
        existingPlace.setMerchantId(merchantA);

        when(placeRepository.findById(placeId)).thenReturn(Optional.of(existingPlace));

        SaveSponsoredPlaceDto updateDto = new SaveSponsoredPlaceDto(
                "Restaurante Invadido",
                "Fortaleza",
                "Ceará",
                "Brasil",
                "Restaurante",
                "Nova Descrição",
                "Benefício",
                "tags",
                null, null, null, null, null, null,
                true, true, true, 0,
                null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                null, null, null
        );

        ApiException ex = assertThrows(ApiException.class, () ->
                service.updateForMerchant(merchantB, placeId, updateDto)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertTrue(ex.getMessage().contains("permissão"));
        verify(placeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Payment: Recharging credits rejects negative, zero and exorbitant amounts")
    void testRechargeValidationBounds() {
        String placeId = UUID.randomUUID().toString();
        SponsoredPlace place = new SponsoredPlace();
        place.setId(placeId);
        place.setName("Bar do Teste");
        place.setCreditBalance(BigDecimal.valueOf(10.00));

        when(placeRepository.findById(placeId)).thenReturn(Optional.of(place));

        // Test zero amount
        ApiException exZero = assertThrows(ApiException.class, () ->
                service.rechargeCredits(placeId, new RechargeCreditsDto(BigDecimal.ZERO, PaymentMethod.PIX, "Recarga"))
        );
        assertEquals(HttpStatus.BAD_REQUEST, exZero.getStatus());

        // Test negative amount
        ApiException exNeg = assertThrows(ApiException.class, () ->
                service.rechargeCredits(placeId, new RechargeCreditsDto(BigDecimal.valueOf(-50.00), PaymentMethod.PIX, "Recarga"))
        );
        assertEquals(HttpStatus.BAD_REQUEST, exNeg.getStatus());

        // Test exorbitant amount (> 50,000)
        ApiException exExorbitant = assertThrows(ApiException.class, () ->
                service.rechargeCredits(placeId, new RechargeCreditsDto(BigDecimal.valueOf(100_000.00), PaymentMethod.PIX, "Recarga"))
        );
        assertEquals(HttpStatus.BAD_REQUEST, exExorbitant.getStatus());
    }

    @Test
    @DisplayName("Payment: Plan changes strictly enforce server-calculated prices preventing client tampering")
    void testServerSidePlanPriceCalculation() {
        String placeId = UUID.randomUUID().toString();
        SponsoredPlace place = new SponsoredPlace();
        place.setId(placeId);
        place.setName("Café Premium");
        place.setMerchantId("merchant-123");
        place.setPlanTier(PlanTier.BRONZE);

        when(placeRepository.findById(placeId)).thenReturn(Optional.of(place));
        when(invoiceRepository.save(any(SponsoredInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

        // Change to Gold (R$ 299)
        SponsoredInvoiceDto invGold = service.changePlan(placeId, PlanTier.GOLD, BillingModel.SUBSCRIPTION);
        assertEquals(BigDecimal.valueOf(299.00), invGold.amount());
        assertEquals(InvoiceStatus.PENDING, invGold.status());
        assertNotNull(invGold.pixCopyPaste());

        // Change to Silver (R$ 179)
        SponsoredInvoiceDto invSilver = service.changePlan(placeId, PlanTier.SILVER, BillingModel.SUBSCRIPTION);
        assertEquals(BigDecimal.valueOf(179.00), invSilver.amount());
        assertEquals(InvoiceStatus.PENDING, invSilver.status());

        // Change to Bronze (R$ 99)
        SponsoredInvoiceDto invBronze = service.changePlan(placeId, PlanTier.BRONZE, BillingModel.SUBSCRIPTION);
        assertEquals(BigDecimal.valueOf(99.00), invBronze.amount());
        assertEquals(InvoiceStatus.PENDING, invBronze.status());
    }

    @Test
    @DisplayName("Payment: CPC click tracking automatically pauses campaign and zeroes balance without going negative")
    void testClickDeductionAndAutoPauseOnExhaustion() {
        String placeId = UUID.randomUUID().toString();
        SponsoredPlace place = new SponsoredPlace();
        place.setId(placeId);
        place.setName("Pub Gourmet");
        place.setBillingModel(BillingModel.CPC_CREDITS);
        place.setCostPerClick(BigDecimal.valueOf(0.75));
        place.setCreditBalance(BigDecimal.valueOf(0.50)); // Less than 1 click
        place.setActive(true);
        place.setPaymentStatus(PaymentStatus.PAID);

        when(placeRepository.findById(placeId)).thenReturn(Optional.of(place));

        service.trackClick(placeId);

        ArgumentCaptor<SponsoredPlace> captor = ArgumentCaptor.forClass(SponsoredPlace.class);
        verify(placeRepository).save(captor.capture());

        SponsoredPlace saved = captor.getValue();
        assertEquals(BigDecimal.ZERO, saved.getCreditBalance());
        assertFalse(saved.getActive()); // Paused automatically
        assertEquals(PaymentStatus.OVERDUE, saved.getPaymentStatus());
    }
}

package com.unbora.api.domain.sponsored;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SponsoredInvoiceRepository extends JpaRepository<SponsoredInvoice, String> {

    List<SponsoredInvoice> findAllByOrderByCreatedAtDesc();

    List<SponsoredInvoice> findBySponsoredPlaceIdOrderByCreatedAtDesc(String sponsoredPlaceId);

    List<SponsoredInvoice> findByMerchantIdOrderByCreatedAtDesc(String merchantId);

    List<SponsoredInvoice> findByStatusOrderByDueDateAsc(InvoiceStatus status);
}

package com.unbora.api.domain.sponsored;

import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.sponsored.dto.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SponsoredPlaceService {

    private static final Logger log = LoggerFactory.getLogger(SponsoredPlaceService.class);
    private final SponsoredPlaceRepository repository;
    private final SponsoredInvoiceRepository invoiceRepository;

    public SponsoredPlaceService(
            SponsoredPlaceRepository repository,
            SponsoredInvoiceRepository invoiceRepository
    ) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
    }

    @PostConstruct
    @Transactional
    public void seedInitialData() {
        // Locais patrocinados devem ser adicionados pelo Admin/Business vinculados a um lojista real
    }

    public List<SponsoredPlaceDto> listAll() {
        return repository.findAllByOrderBySortOrderAscCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    public SponsoredPlaceDto getById(String id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));
    }

    @Transactional
    public SponsoredPlaceDto create(SaveSponsoredPlaceDto dto) {
        if (dto.name() == null || dto.name().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O nome do estabelecimento é obrigatório.");
        }
        if (dto.city() == null || dto.city().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A cidade é obrigatória.");
        }

        SponsoredPlace entity = new SponsoredPlace();
        entity.setId(UUID.randomUUID().toString());
        applyDto(entity, dto);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());

        SponsoredPlace saved = repository.save(entity);

        // Se for cadastrado com modelo de assinatura paga, gerar fatura inicial se não for cortesia/trial
        if (saved.getBillingModel() == BillingModel.SUBSCRIPTION && saved.getPaymentStatus() == PaymentStatus.PENDING) {
            generateInvoiceForPlace(saved, saved.getMonthlyPrice(), "Assinatura Inicial - " + saved.getPlanTier().name());
        }

        return toDto(saved);
    }

    @Transactional
    public SponsoredPlaceDto update(String id, SaveSponsoredPlaceDto dto) {
        SponsoredPlace entity = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));

        applyDto(entity, dto);
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    @Transactional
    public SponsoredPlaceDto toggleActive(String id) {
        SponsoredPlace entity = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));
        entity.setActive(!Boolean.TRUE.equals(entity.getActive()));
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        SponsoredPlace entity = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));
        repository.delete(entity);
    }

    @Transactional
    public void trackImpression(String id) {
        if (id == null || id.isBlank()) return;
        repository.findById(id).ifPresent(p -> {
            p.setImpressionsCount(p.getImpressionsCount() != null ? p.getImpressionsCount() + 1 : 1L);
            repository.save(p);
        });
    }

    @Transactional
    public void trackClick(String id) {
        if (id == null || id.isBlank()) return;
        repository.findById(id).ifPresent(p -> {
            p.setClicksCount(p.getClicksCount() != null ? p.getClicksCount() + 1 : 1L);

            // Modelo por Desempenho (CPC - Custo por Clique)
            if (p.getBillingModel() == BillingModel.CPC_CREDITS || p.getBillingModel() == BillingModel.HYBRID) {
                BigDecimal cpc = p.getCostPerClick() != null ? p.getCostPerClick() : BigDecimal.valueOf(0.75);
                p.setTotalSpent((p.getTotalSpent() != null ? p.getTotalSpent() : BigDecimal.ZERO).add(cpc));
                p.setSpentToday((p.getSpentToday() != null ? p.getSpentToday() : BigDecimal.ZERO).add(cpc));

                BigDecimal currentBal = p.getCreditBalance() != null ? p.getCreditBalance() : BigDecimal.ZERO;
                BigDecimal newBal = currentBal.subtract(cpc);

                if (newBal.compareTo(BigDecimal.ZERO) <= 0) {
                    p.setCreditBalance(BigDecimal.ZERO);
                    p.setActive(false);
                    p.setPaymentStatus(PaymentStatus.OVERDUE);
                    log.warn("[Billing] Créditos esgotados para '{}'. Campanha pausada automaticamente.", p.getName());
                } else {
                    p.setCreditBalance(newBal);
                }
            }

            repository.save(p);
        });
    }

    /**
     * Retorna os locais patrocinados elegíveis para injeção no Slot de Ouro (Método A)
     * Respeita regras de faturamento: apenas estabelecimentos em dia são exibidos!
     */
    public List<SponsoredPlace> getMatchingSponsoredForSearch(
            String city,
            String humor,
            List<String> activities,
            String query
    ) {
        if (city == null || city.isBlank()) return List.of();
        String targetCity = city.trim();
        List<SponsoredPlace> candidates = repository.findByActiveTrueAndSlotBoostTrueAndCityIgnoreCase(targetCity);
        if (candidates.isEmpty()) {
            String normTarget = normalize(targetCity);
            candidates = repository.findAll().stream()
                    .filter(p -> Boolean.TRUE.equals(p.getActive()) && Boolean.TRUE.equals(p.getSlotBoost()))
                    .filter(p -> normalize(p.getCity()).equals(normTarget))
                    .toList();
        }

        // Filtro financeiro: apenas com status pago, trial, cortesia ou saldo de crédito positivo
        candidates = candidates.stream()
                .filter(this::isEligibleForDelivery)
                .toList();

        if (candidates.isEmpty()) return List.of();

        List<String> searchTerms = new ArrayList<>();
        if (humor != null) searchTerms.add(normalize(humor));
        if (activities != null) {
            for (String a : activities) searchTerms.add(normalize(a));
        }
        if (query != null && !query.isBlank()) {
            searchTerms.addAll(Arrays.stream(normalize(query).split("\\s+")).filter(s -> s.length() >= 3).toList());
        }

        if (searchTerms.isEmpty()) {
            return candidates.stream().limit(2).toList();
        }

        List<SponsoredPlace> matching = new ArrayList<>();
        List<SponsoredPlace> others = new ArrayList<>();

        for (SponsoredPlace sp : candidates) {
            String hay = normalize(sp.getName() + " " + sp.getType() + " " + sp.getCategoryTags() + " " + sp.getDescription());
            boolean matched = searchTerms.stream().anyMatch(t -> hay.contains(t) || isTagCompatible(t, hay));
            if (matched) {
                matching.add(sp);
            } else {
                others.add(sp);
            }
        }

        if (!matching.isEmpty()) {
            return matching.stream().limit(2).toList();
        }

        return List.of();
    }

    public List<SponsoredPlace> getActiveHomeHighlights(String city) {
        if (city == null || city.isBlank()) return List.of();
        return repository.findByActiveTrueAndHomeHighlightTrueAndCityIgnoreCase(city.trim()).stream()
                .filter(this::isEligibleForDelivery)
                .toList();
    }

    private boolean isEligibleForDelivery(SponsoredPlace p) {
        if (p == null || !Boolean.TRUE.equals(p.getActive()) || !Boolean.TRUE.equals(p.getSlotBoost())) {
            return false;
        }
        // Exige vinculo obrigatorio com lojista (Business)
        if (p.getMerchantId() == null || p.getMerchantId().isBlank()) {
            return false;
        }
        // Exige pagamento ativo confirmado pelo lojista
        if (p.getPaymentStatus() == PaymentStatus.PAID) {
            return true;
        }
        if (p.getBillingModel() == BillingModel.CPC_CREDITS) {
            return p.getCreditBalance() != null && p.getCreditBalance().compareTo(BigDecimal.ZERO) > 0;
        }
        return false;
    }

    // --- Gestão de Faturas & Faturamento ---

    public List<SponsoredInvoiceDto> listInvoices(String placeId, InvoiceStatus status) {
        List<SponsoredInvoice> list;
        if (placeId != null && !placeId.isBlank()) {
            list = invoiceRepository.findBySponsoredPlaceIdOrderByCreatedAtDesc(placeId);
        } else {
            list = invoiceRepository.findAllByOrderByCreatedAtDesc();
        }

        if (status != null) {
            list = list.stream().filter(i -> i.getStatus() == status).toList();
        }

        return list.stream().map(this::toInvoiceDto).toList();
    }

    @Transactional
    public SponsoredInvoiceDto createInvoice(String placeId, CreateInvoiceDto dto) {
        SponsoredPlace place = repository.findById(placeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));

        if (dto.amount() == null || dto.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O valor da fatura deve ser maior que zero.");
        }

        SponsoredInvoice inv = new SponsoredInvoice();
        inv.setId(UUID.randomUUID().toString());
        inv.setSponsoredPlaceId(place.getId());
        inv.setPlaceName(place.getName());
        inv.setMerchantId(place.getMerchantId());
        inv.setAmount(dto.amount());
        inv.setDueDate(dto.dueDate() != null && !dto.dueDate().isBlank() ? LocalDate.parse(dto.dueDate()) : LocalDate.now().plusDays(5));
        inv.setPaymentMethod(dto.paymentMethod() != null ? dto.paymentMethod() : PaymentMethod.PIX);
        inv.setStatus(InvoiceStatus.PENDING);
        inv.setReferencePeriod(dto.referencePeriod() != null ? dto.referencePeriod() : LocalDate.now().getMonthValue() + "/" + LocalDate.now().getYear());
        inv.setPixCopyPaste(generatePixCopyPaste(place.getName(), dto.amount()));
        inv.setNotes(dto.notes());
        inv.setCreatedAt(Instant.now());
        inv.setUpdatedAt(Instant.now());

        return toInvoiceDto(invoiceRepository.save(inv));
    }

    @Transactional
    public SponsoredInvoiceDto rechargeCredits(String placeId, RechargeCreditsDto dto) {
        SponsoredPlace place = repository.findById(placeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));

        if (dto.amount() == null || dto.amount().compareTo(BigDecimal.ZERO) <= 0 || dto.amount().compareTo(BigDecimal.valueOf(50000.00)) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O valor da recarga deve estar entre R$ 1,00 e R$ 50.000,00.");
        }

        // Adiciona saldo ao local
        BigDecimal current = place.getCreditBalance() != null ? place.getCreditBalance() : BigDecimal.ZERO;
        place.setCreditBalance(current.add(dto.amount()).min(BigDecimal.valueOf(100000.00)));
        place.setPaymentStatus(PaymentStatus.PAID);
        if (!Boolean.TRUE.equals(place.getActive())) {
            place.setActive(true);
        }
        repository.save(place);

        // Gera fatura já com status PAGO
        SponsoredInvoice inv = new SponsoredInvoice();
        inv.setId(UUID.randomUUID().toString());
        inv.setSponsoredPlaceId(place.getId());
        inv.setPlaceName(place.getName());
        inv.setMerchantId(place.getMerchantId());
        inv.setAmount(dto.amount());
        inv.setDueDate(LocalDate.now());
        inv.setPaidAt(Instant.now());
        inv.setStatus(InvoiceStatus.PAID);
        inv.setPaymentMethod(dto.paymentMethod() != null ? dto.paymentMethod() : PaymentMethod.PIX);
        inv.setReferencePeriod("Recarga de Créditos");
        inv.setPixCopyPaste(generatePixCopyPaste(place.getName(), dto.amount()));
        inv.setNotes(dto.notes() != null && !dto.notes().isBlank() ? dto.notes() : "Recarga avulsa de créditos de desempenho (CPC)");
        inv.setCreatedAt(Instant.now());
        inv.setUpdatedAt(Instant.now());

        return toInvoiceDto(invoiceRepository.save(inv));
    }

    @Transactional
    public SponsoredInvoiceDto markInvoicePaid(String invoiceId) {
        SponsoredInvoice inv = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Fatura não encontrada."));

        inv.setStatus(InvoiceStatus.PAID);
        inv.setPaidAt(Instant.now());
        inv.setUpdatedAt(Instant.now());

        // Se for fatura vinculada a uma assinatura, atualiza o status do estabelecimento para PAID e avança o ciclo
        repository.findById(inv.getSponsoredPlaceId()).ifPresent(place -> {
            place.setPaymentStatus(PaymentStatus.PAID);
            place.setCurrentCycleStart(LocalDate.now());
            place.setNextBillingDate(LocalDate.now().plusMonths(1));
            if (!Boolean.TRUE.equals(place.getActive())) {
                place.setActive(true);
            }
            repository.save(place);
        });

        return toInvoiceDto(invoiceRepository.save(inv));
    }

    @Transactional
    public SponsoredInvoiceDto markInvoicePaidForMerchant(String invoiceId, String merchantId) {
        SponsoredInvoice inv = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Fatura não encontrada."));
        if (inv.getMerchantId() != null && !inv.getMerchantId().equals(merchantId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Fatura não pertence a este lojista.");
        }
        return markInvoicePaid(invoiceId);
    }

    @Transactional
    public SponsoredInvoiceDto cancelInvoice(String invoiceId) {
        SponsoredInvoice inv = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Fatura não encontrada."));

        inv.setStatus(InvoiceStatus.CANCELED);
        inv.setUpdatedAt(Instant.now());
        return toInvoiceDto(invoiceRepository.save(inv));
    }

    public SponsoredFinancialOverviewDto getFinancialOverview() {
        List<SponsoredPlace> places = repository.findAll();
        List<SponsoredInvoice> invoices = invoiceRepository.findAll();

        BigDecimal mrr = places.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getBillingModel() == BillingModel.SUBSCRIPTION && p.getPaymentStatus() == PaymentStatus.PAID)
                .map(p -> p.getMonthlyPrice() != null ? p.getMonthlyPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRevenue = invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PAID)
                .map(SponsoredInvoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPending = invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PENDING)
                .map(SponsoredInvoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOverdue = invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.OVERDUE || (i.getStatus() == InvoiceStatus.PENDING && i.getDueDate() != null && i.getDueDate().isBefore(LocalDate.now())))
                .map(SponsoredInvoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalWalletBalance = places.stream()
                .map(p -> p.getCreditBalance() != null ? p.getCreditBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeSubs = places.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getBillingModel() == BillingModel.SUBSCRIPTION)
                .count();

        long activeCpc = places.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getBillingModel() == BillingModel.CPC_CREDITS)
                .count();

        long totalInv = invoices.size();
        long pendingInv = invoices.stream().filter(i -> i.getStatus() == InvoiceStatus.PENDING).count();
        long overdueInv = invoices.stream().filter(i -> i.getStatus() == InvoiceStatus.OVERDUE || (i.getStatus() == InvoiceStatus.PENDING && i.getDueDate() != null && i.getDueDate().isBefore(LocalDate.now()))).count();

        Map<String, Long> byTier = places.stream()
                .collect(Collectors.groupingBy(p -> p.getPlanTier().name(), Collectors.counting()));

        Map<String, Long> byModel = places.stream()
                .collect(Collectors.groupingBy(p -> p.getBillingModel().name(), Collectors.counting()));

        return new SponsoredFinancialOverviewDto(
                mrr,
                totalRevenue,
                totalPending,
                totalOverdue,
                totalWalletBalance,
                activeSubs,
                activeCpc,
                totalInv,
                pendingInv,
                overdueInv,
                byTier,
                byModel
        );
    }

    public List<SponsoredPlaceDto> listByMerchant(String merchantId) {
        if (merchantId == null || merchantId.isBlank()) return List.of();
        return repository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(this::toDto)
                .toList();
    }

    public List<SponsoredInvoiceDto> listInvoicesByMerchant(String merchantId) {
        if (merchantId == null || merchantId.isBlank()) return List.of();
        return invoiceRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(this::toInvoiceDto)
                .toList();
    }

    @Transactional
    public SponsoredPlaceDto createForMerchant(String merchantId, SaveSponsoredPlaceDto dto) {
        if (merchantId == null || merchantId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Identificador de lojista obrigatório.");
        }
        if (dto.name() == null || dto.name().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O nome do estabelecimento é obrigatório.");
        }
        if (dto.city() == null || dto.city().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A cidade é obrigatória.");
        }

        SponsoredPlace entity = new SponsoredPlace();
        entity.setId(UUID.randomUUID().toString());
        applyDto(entity, dto);
        entity.setMerchantId(merchantId);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());

        SponsoredPlace saved = repository.save(entity);

        // Se for cadastrado com modelo de assinatura ou CPC, gerar fatura inicial
        if (saved.getBillingModel() == BillingModel.SUBSCRIPTION && saved.getPaymentStatus() == PaymentStatus.PENDING) {
            generateInvoiceForPlace(saved, saved.getMonthlyPrice(), "Assinatura Inicial - Plano " + (saved.getPlanTier() != null ? saved.getPlanTier().name() : "PADRÃO"));
        } else if (saved.getBillingModel() == BillingModel.CPC_CREDITS && saved.getCreditBalance().compareTo(BigDecimal.ZERO) > 0) {
            generateInvoiceForPlace(saved, saved.getCreditBalance(), "Recarga Inicial de Saldo CPC");
        }

        return toDto(saved);
    }

    @Transactional
    public SponsoredPlaceDto updateForMerchant(String merchantId, String placeId, SaveSponsoredPlaceDto dto) {
        SponsoredPlace entity = repository.findById(placeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));

        if (entity.getMerchantId() != null && !entity.getMerchantId().equals(merchantId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Você não tem permissão para editar este estabelecimento.");
        }

        applyDto(entity, dto);
        entity.setMerchantId(merchantId);
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    @Transactional
    public SponsoredInvoiceDto changePlan(String placeId, PlanTier newTier, BillingModel newModel) {
        SponsoredPlace place = repository.findById(placeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Local patrocinado não encontrado."));

        BigDecimal price = switch (newTier) {
            case BRONZE -> BigDecimal.valueOf(99.00);
            case SILVER -> BigDecimal.valueOf(179.00);
            case GOLD -> BigDecimal.valueOf(299.00);
            case CUSTOM -> place.getMonthlyPrice() != null ? place.getMonthlyPrice() : BigDecimal.valueOf(199.00);
        };

        place.setPlanTier(newTier);
        if (newModel != null) {
            place.setBillingModel(newModel);
        }
        place.setMonthlyPrice(price);
        place.setPaymentStatus(PaymentStatus.PENDING);
        repository.save(place);

        // Gera nova fatura do plano alterado
        SponsoredInvoice inv = new SponsoredInvoice();
        inv.setId(UUID.randomUUID().toString());
        inv.setSponsoredPlaceId(place.getId());
        inv.setPlaceName(place.getName());
        inv.setMerchantId(place.getMerchantId());
        inv.setAmount(price);
        inv.setDueDate(LocalDate.now().plusDays(3));
        inv.setStatus(InvoiceStatus.PENDING);
        inv.setPaymentMethod(PaymentMethod.PIX);
        inv.setReferencePeriod("Upgrade para " + newTier.name());
        inv.setPixCopyPaste(generatePixCopyPaste(place.getName(), price));
        inv.setNotes("Alteração de plano para " + newTier.name() + " (R$ " + price + "/mês)");
        inv.setCreatedAt(Instant.now());
        inv.setUpdatedAt(Instant.now());

        return toInvoiceDto(invoiceRepository.save(inv));
    }

    private void generateInvoiceForPlace(SponsoredPlace place, BigDecimal amount, String notes) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) return;
        SponsoredInvoice inv = new SponsoredInvoice();
        inv.setId(UUID.randomUUID().toString());
        inv.setSponsoredPlaceId(place.getId());
        inv.setPlaceName(place.getName());
        inv.setMerchantId(place.getMerchantId());
        inv.setAmount(amount);
        inv.setDueDate(LocalDate.now().plusDays(5));
        inv.setStatus(InvoiceStatus.PENDING);
        inv.setPaymentMethod(PaymentMethod.PIX);
        inv.setReferencePeriod(LocalDate.now().getMonthValue() + "/" + LocalDate.now().getYear());
        inv.setPixCopyPaste(generatePixCopyPaste(place.getName(), amount));
        inv.setNotes(notes);
        invoiceRepository.save(inv);
    }

    private String generatePixCopyPaste(String placeName, BigDecimal amount) {
        String randomCode = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        return "00020126580014BR.GOV.BCB.PIX0136" + randomCode + "520400005303986540" + String.format(Locale.US, "%.2f", amount) + "5802BR5915UNBORA TECH6009FORTALEZA62070503***6304";
    }

    private boolean isTagCompatible(String term, String text) {
        if (term.contains("cafe") && (text.contains("cafe") || text.contains("bistro") || text.contains("brunch"))) return true;
        if (term.contains("gastro") && (text.contains("restaurante") || text.contains("comida") || text.contains("bar") || text.contains("bistro"))) return true;
        if (term.contains("musica") && (text.contains("bar") || text.contains("pub") || text.contains("show"))) return true;
        if (term.contains("relax") && (text.contains("parque") || text.contains("cafe") || text.contains("spa") || text.contains("bistro"))) return true;
        return false;
    }

    private void applyDto(SponsoredPlace entity, SaveSponsoredPlaceDto dto) {
        if (dto.name() != null) entity.setName(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.name(), 120));
        if (dto.city() != null) entity.setCity(com.unbora.api.common.security.InputSanitizer.sanitizeCityOrCountry(dto.city(), 80));
        if (dto.region() != null) entity.setRegion(com.unbora.api.common.security.InputSanitizer.sanitizeCityOrCountry(dto.region(), 80));
        if (dto.country() != null && !dto.country().isBlank()) entity.setCountry(com.unbora.api.common.security.InputSanitizer.sanitizeCityOrCountry(dto.country(), 60));
        if (dto.type() != null) entity.setType(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.type(), 80));
        if (dto.description() != null) entity.setDescription(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.description(), 1000));
        if (dto.benefitText() != null) entity.setBenefitText(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.benefitText(), 255));
        if (dto.categoryTags() != null) entity.setCategoryTags(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.categoryTags(), 255));
        if (dto.imageUrl() != null) entity.setImageUrl(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.imageUrl(), 500));
        if (dto.mapsUrl() != null) entity.setMapsUrl(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.mapsUrl(), 500));
        if (dto.address() != null) entity.setAddress(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.address(), 255));
        if (dto.placeId() != null) entity.setPlaceId(com.unbora.api.common.security.InputSanitizer.sanitizePlaceId(dto.placeId(), 100));
        if (dto.rating() != null) entity.setRating(Math.max(0.0, Math.min(5.0, dto.rating())));
        if (dto.priceLevel() != null) entity.setPriceLevel(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.priceLevel(), 30));
        if (dto.slotBoost() != null) entity.setSlotBoost(dto.slotBoost());
        if (dto.homeHighlight() != null) entity.setHomeHighlight(dto.homeHighlight());
        if (dto.active() != null) entity.setActive(dto.active());
        if (dto.sortOrder() != null) entity.setSortOrder(dto.sortOrder());

        // Billing & Monetization fields
        if (dto.billingModel() != null) entity.setBillingModel(dto.billingModel());
        if (dto.planTier() != null) entity.setPlanTier(dto.planTier());
        if (dto.monthlyPrice() != null) {
            BigDecimal price = dto.monthlyPrice().max(BigDecimal.ZERO).min(BigDecimal.valueOf(100000.00));
            entity.setMonthlyPrice(price);
        }
        if (dto.creditBalance() != null) {
            BigDecimal bal = dto.creditBalance().max(BigDecimal.ZERO).min(BigDecimal.valueOf(100000.00));
            entity.setCreditBalance(bal);
        }
        if (dto.costPerClick() != null) {
            BigDecimal cpc = dto.costPerClick().max(BigDecimal.valueOf(0.05)).min(BigDecimal.valueOf(100.00));
            entity.setCostPerClick(cpc);
        }
        if (dto.costPerImpression() != null) entity.setCostPerImpression(dto.costPerImpression().max(BigDecimal.ZERO));
        if (dto.dailyBudget() != null) entity.setDailyBudget(dto.dailyBudget().max(BigDecimal.ZERO));
        if (dto.paymentStatus() != null) entity.setPaymentStatus(dto.paymentStatus());
        if (dto.currentCycleStart() != null && !dto.currentCycleStart().isBlank()) {
            entity.setCurrentCycleStart(LocalDate.parse(dto.currentCycleStart()));
        }
        if (dto.nextBillingDate() != null && !dto.nextBillingDate().isBlank()) {
            entity.setNextBillingDate(LocalDate.parse(dto.nextBillingDate()));
        }
        if (dto.contactName() != null) entity.setContactName(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.contactName(), 100));
        if (dto.contactPhone() != null) entity.setContactPhone(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.contactPhone(), 30));
        if (dto.contactEmail() != null) entity.setContactEmail(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.contactEmail(), 120));
        if (dto.cnpjCpf() != null) entity.setCnpjCpf(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.cnpjCpf(), 30));
        if (dto.billingNotes() != null) entity.setBillingNotes(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.billingNotes(), 500));
        if (dto.autoRenew() != null) entity.setAutoRenew(dto.autoRenew());
        if (dto.merchantId() != null) entity.setMerchantId(com.unbora.api.common.security.InputSanitizer.sanitizeUuid(dto.merchantId()));
        if (dto.merchantName() != null) entity.setMerchantName(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.merchantName(), 120));
        if (dto.merchantEmail() != null) entity.setMerchantEmail(com.unbora.api.common.security.InputSanitizer.sanitizeText(dto.merchantEmail(), 120));
    }

    private SponsoredPlaceDto toDto(SponsoredPlace p) {
        return new SponsoredPlaceDto(
                p.getId(),
                p.getName(),
                p.getCity(),
                p.getRegion(),
                p.getCountry(),
                p.getType(),
                p.getDescription(),
                p.getBenefitText(),
                p.getCategoryTags(),
                p.getImageUrl(),
                p.getMapsUrl(),
                p.getAddress(),
                p.getPlaceId(),
                p.getRating(),
                p.getPriceLevel(),
                p.getSlotBoost(),
                p.getHomeHighlight(),
                p.getActive(),
                p.getSortOrder(),
                p.getImpressionsCount(),
                p.getClicksCount(),
                p.getBillingModel(),
                p.getPlanTier(),
                p.getMonthlyPrice(),
                p.getCreditBalance(),
                p.getCostPerClick(),
                p.getCostPerImpression(),
                p.getDailyBudget(),
                p.getSpentToday(),
                p.getTotalSpent(),
                p.getPaymentStatus(),
                p.getCurrentCycleStart() != null ? p.getCurrentCycleStart().toString() : "",
                p.getNextBillingDate() != null ? p.getNextBillingDate().toString() : "",
                p.getContactName(),
                p.getContactPhone(),
                p.getContactEmail(),
                p.getCnpjCpf(),
                p.getBillingNotes(),
                p.getAutoRenew(),
                p.getMerchantId(),
                p.getMerchantName(),
                p.getMerchantEmail(),
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : "",
                p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : ""
        );
    }

    private SponsoredInvoiceDto toInvoiceDto(SponsoredInvoice i) {
        return new SponsoredInvoiceDto(
                i.getId(),
                i.getSponsoredPlaceId(),
                i.getPlaceName(),
                i.getMerchantId(),
                i.getAmount(),
                i.getDueDate() != null ? i.getDueDate().toString() : "",
                i.getPaidAt() != null ? i.getPaidAt().toString() : "",
                i.getStatus(),
                i.getPaymentMethod(),
                i.getReferencePeriod(),
                i.getPixCopyPaste(),
                i.getNotes(),
                i.getCreatedAt() != null ? i.getCreatedAt().toString() : "",
                i.getUpdatedAt() != null ? i.getUpdatedAt().toString() : ""
        );
    }

    private static String normalize(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return Pattern.compile("\\p{InCombiningDiacriticalMarks}+")
                .matcher(normalized)
                .replaceAll("")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}

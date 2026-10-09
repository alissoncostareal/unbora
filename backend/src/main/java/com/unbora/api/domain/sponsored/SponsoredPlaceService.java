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
        if (repository.count() > 0) return;

        SponsoredPlace p1 = new SponsoredPlace();
        p1.setId(UUID.randomUUID().toString());
        p1.setName("Brava Wine & Bistro");
        p1.setCity("Fortaleza");
        p1.setRegion("Grande Fortaleza");
        p1.setCountry("Brasil");
        p1.setType("Bistrô & Wine Bar");
        p1.setDescription("Experiência enogastronômica refinada com mais de 300 rótulos selecionados e cardápio autoral.");
        p1.setBenefitText("15% de desconto no jantar ou 1 taça de espumante de boas-vindas mencionando o Unbora.");
        p1.setCategoryTags("gastronomia, romance, relaxar, comida, vinho, jantar");
        p1.setImageUrl("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80");
        p1.setMapsUrl("https://maps.google.com/?q=Brava+Wine+Fortaleza");
        p1.setAddress("Av. Padre Antônio Tomás, 850 - Aldeota, Fortaleza - CE");
        p1.setRating(4.9);
        p1.setPriceLevel("EXPENSIVE");
        p1.setSlotBoost(true);
        p1.setHomeHighlight(true);
        p1.setActive(true);
        p1.setSortOrder(0);
        p1.setBillingModel(BillingModel.SUBSCRIPTION);
        p1.setPlanTier(PlanTier.GOLD);
        p1.setMonthlyPrice(BigDecimal.valueOf(299.00));
        p1.setCreditBalance(BigDecimal.ZERO);
        p1.setPaymentStatus(PaymentStatus.PAID);
        p1.setCurrentCycleStart(LocalDate.now());
        p1.setNextBillingDate(LocalDate.now().plusMonths(1));
        p1.setContactName("Carlos Eduardo (Sommelier)");
        p1.setContactPhone("(85) 99888-7711");
        p1.setContactEmail("contato@bravawine.com.br");
        repository.save(p1);

        SponsoredInvoice inv1 = new SponsoredInvoice();
        inv1.setId(UUID.randomUUID().toString());
        inv1.setSponsoredPlaceId(p1.getId());
        inv1.setPlaceName(p1.getName());
        inv1.setAmount(BigDecimal.valueOf(299.00));
        inv1.setDueDate(LocalDate.now().plusDays(5));
        inv1.setPaidAt(Instant.now());
        inv1.setStatus(InvoiceStatus.PAID);
        inv1.setPaymentMethod(PaymentMethod.PIX);
        inv1.setReferencePeriod(LocalDate.now().getMonthValue() + "/" + LocalDate.now().getYear());
        inv1.setPixCopyPaste("00020126580014BR.GOV.BCB.PIX0136" + UUID.randomUUID() + "5204000053039865405299.005802BR5915UNBORA TECH6009FORTALEZA62070503***6304");
        inv1.setNotes("Assinatura Plano Ouro Mensal (Slot de Ouro + Home)");
        invoiceRepository.save(inv1);

        SponsoredPlace p2 = new SponsoredPlace();
        p2.setId(UUID.randomUUID().toString());
        p2.setName("Café Viriato Aldeota");
        p2.setCity("Fortaleza");
        p2.setRegion("Grande Fortaleza");
        p2.setCountry("Brasil");
        p2.setType("Café Especial");
        p2.setDescription("Ambiente sofisticado e acolhedor ideal para encontros, trabalho remoto e confeitaria artesanal.");
        p2.setBenefitText("Na compra de qualquer sobremesa ou brunch, ganhe 1 café espresso especial.");
        p2.setCategoryTags("café, cafeteria, relaxar, brunch, comida, doces");
        p2.setImageUrl("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80");
        p2.setMapsUrl("https://maps.google.com/?q=Cafe+Viriato+Fortaleza");
        p2.setAddress("R. Osvaldo Cruz, 2828 - Dionísio Torres, Fortaleza - CE");
        p2.setRating(4.8);
        p2.setPriceLevel("MODERATE");
        p2.setSlotBoost(true);
        p2.setHomeHighlight(true);
        p2.setActive(true);
        p2.setSortOrder(1);
        p2.setBillingModel(BillingModel.SUBSCRIPTION);
        p2.setPlanTier(PlanTier.SILVER);
        p2.setMonthlyPrice(BigDecimal.valueOf(179.00));
        p2.setCreditBalance(BigDecimal.ZERO);
        p2.setPaymentStatus(PaymentStatus.PAID);
        p2.setCurrentCycleStart(LocalDate.now());
        p2.setNextBillingDate(LocalDate.now().plusMonths(1));
        p2.setContactName("Mariana Viriato");
        p2.setContactPhone("(85) 98777-6622");
        p2.setContactEmail("gerencia@cafeviriato.com.br");
        repository.save(p2);

        SponsoredInvoice inv2 = new SponsoredInvoice();
        inv2.setId(UUID.randomUUID().toString());
        inv2.setSponsoredPlaceId(p2.getId());
        inv2.setPlaceName(p2.getName());
        inv2.setAmount(BigDecimal.valueOf(179.00));
        inv2.setDueDate(LocalDate.now().plusDays(5));
        inv2.setPaidAt(Instant.now());
        inv2.setStatus(InvoiceStatus.PAID);
        inv2.setPaymentMethod(PaymentMethod.PIX);
        inv2.setReferencePeriod(LocalDate.now().getMonthValue() + "/" + LocalDate.now().getYear());
        inv2.setPixCopyPaste("00020126580014BR.GOV.BCB.PIX0136" + UUID.randomUUID() + "5204000053039865405179.005802BR5915UNBORA TECH6009FORTALEZA62070503***6304");
        inv2.setNotes("Assinatura Plano Prata Mensal (Slot de Ouro + Benefício)");
        invoiceRepository.save(inv2);
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

        return others.stream().limit(1).toList();
    }

    public List<SponsoredPlace> getActiveHomeHighlights(String city) {
        if (city == null || city.isBlank()) return List.of();
        return repository.findByActiveTrueAndHomeHighlightTrueAndCityIgnoreCase(city.trim()).stream()
                .filter(this::isEligibleForDelivery)
                .toList();
    }

    private boolean isEligibleForDelivery(SponsoredPlace p) {
        if (p == null || !Boolean.TRUE.equals(p.getActive())) return false;
        if (p.getBillingModel() == BillingModel.COURTESY) return true;
        if (p.getPaymentStatus() == PaymentStatus.PAID || p.getPaymentStatus() == PaymentStatus.TRIAL) return true;
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

        if (dto.amount() == null || dto.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O valor da recarga deve ser maior que zero.");
        }

        // Adiciona saldo ao local
        BigDecimal current = place.getCreditBalance() != null ? place.getCreditBalance() : BigDecimal.ZERO;
        place.setCreditBalance(current.add(dto.amount()));
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
        if (dto.name() != null) entity.setName(dto.name().trim());
        if (dto.city() != null) entity.setCity(dto.city().trim());
        if (dto.region() != null) entity.setRegion(dto.region().trim());
        if (dto.country() != null && !dto.country().isBlank()) entity.setCountry(dto.country().trim());
        if (dto.type() != null) entity.setType(dto.type().trim());
        if (dto.description() != null) entity.setDescription(dto.description().trim());
        if (dto.benefitText() != null) entity.setBenefitText(dto.benefitText().trim());
        if (dto.categoryTags() != null) entity.setCategoryTags(dto.categoryTags().trim());
        if (dto.imageUrl() != null) entity.setImageUrl(dto.imageUrl().trim());
        if (dto.mapsUrl() != null) entity.setMapsUrl(dto.mapsUrl().trim());
        if (dto.address() != null) entity.setAddress(dto.address().trim());
        if (dto.placeId() != null) entity.setPlaceId(dto.placeId().trim());
        if (dto.rating() != null) entity.setRating(dto.rating());
        if (dto.priceLevel() != null) entity.setPriceLevel(dto.priceLevel().trim());
        if (dto.slotBoost() != null) entity.setSlotBoost(dto.slotBoost());
        if (dto.homeHighlight() != null) entity.setHomeHighlight(dto.homeHighlight());
        if (dto.active() != null) entity.setActive(dto.active());
        if (dto.sortOrder() != null) entity.setSortOrder(dto.sortOrder());

        // Billing & Monetization fields
        if (dto.billingModel() != null) entity.setBillingModel(dto.billingModel());
        if (dto.planTier() != null) entity.setPlanTier(dto.planTier());
        if (dto.monthlyPrice() != null) entity.setMonthlyPrice(dto.monthlyPrice());
        if (dto.creditBalance() != null) entity.setCreditBalance(dto.creditBalance());
        if (dto.costPerClick() != null) entity.setCostPerClick(dto.costPerClick());
        if (dto.costPerImpression() != null) entity.setCostPerImpression(dto.costPerImpression());
        if (dto.dailyBudget() != null) entity.setDailyBudget(dto.dailyBudget());
        if (dto.paymentStatus() != null) entity.setPaymentStatus(dto.paymentStatus());
        if (dto.currentCycleStart() != null && !dto.currentCycleStart().isBlank()) {
            entity.setCurrentCycleStart(LocalDate.parse(dto.currentCycleStart()));
        }
        if (dto.nextBillingDate() != null && !dto.nextBillingDate().isBlank()) {
            entity.setNextBillingDate(LocalDate.parse(dto.nextBillingDate()));
        }
        if (dto.contactName() != null) entity.setContactName(dto.contactName().trim());
        if (dto.contactPhone() != null) entity.setContactPhone(dto.contactPhone().trim());
        if (dto.contactEmail() != null) entity.setContactEmail(dto.contactEmail().trim());
        if (dto.cnpjCpf() != null) entity.setCnpjCpf(dto.cnpjCpf().trim());
        if (dto.billingNotes() != null) entity.setBillingNotes(dto.billingNotes().trim());
        if (dto.autoRenew() != null) entity.setAutoRenew(dto.autoRenew());
        if (dto.merchantId() != null) entity.setMerchantId(dto.merchantId().trim());
        if (dto.merchantName() != null) entity.setMerchantName(dto.merchantName().trim());
        if (dto.merchantEmail() != null) entity.setMerchantEmail(dto.merchantEmail().trim());
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

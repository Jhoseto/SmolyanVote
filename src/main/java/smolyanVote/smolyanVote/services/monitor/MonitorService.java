package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.MonitorDocumentType;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;
import smolyanVote.smolyanVote.models.monitor.MonitorAmendmentEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorAmendmentRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorIngestionRunRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MonitorService {

    private final MonitorContractRepository contractRepository;
    private final MonitorDocumentRepository documentRepository;
    private final MonitorCompanyRepository companyRepository;
    private final MonitorIngestionRunRepository ingestionRunRepository;
    private final MonitorCompetitionService competitionService;
    private final MonitorConnectionsService connectionsService;
    private final MonitorSignalsLinkService signalsLinkService;
    private final MonitorDeepDataService deepDataService;
    private final MonitorAmendmentRepository amendmentRepository;
    private final ObjectMapper objectMapper;

    public MonitorService(
            MonitorContractRepository contractRepository,
            MonitorDocumentRepository documentRepository,
            MonitorCompanyRepository companyRepository,
            MonitorIngestionRunRepository ingestionRunRepository,
            MonitorCompetitionService competitionService,
            MonitorConnectionsService connectionsService,
            MonitorSignalsLinkService signalsLinkService,
            MonitorDeepDataService deepDataService,
            MonitorAmendmentRepository amendmentRepository,
            ObjectMapper objectMapper) {
        this.contractRepository = contractRepository;
        this.documentRepository = documentRepository;
        this.companyRepository = companyRepository;
        this.ingestionRunRepository = ingestionRunRepository;
        this.competitionService = competitionService;
        this.connectionsService = connectionsService;
        this.signalsLinkService = signalsLinkService;
        this.deepDataService = deepDataService;
        this.amendmentRepository = amendmentRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public MonitorOverviewDTO getOverview() {
        LocalDate yearStart = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate yearEnd = LocalDate.of(LocalDate.now().getYear(), 12, 31);
        BigDecimal spentYtd = contractRepository.sumAmountBetween(yearStart, yearEnd);
        long contracts = contractRepository.count();
        long flagged = contractRepository.countAnomalies(MonitorRiskService.FLAG_THRESHOLD);
        long documents = documentRepository.count();
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long newDocs = documentRepository.countByCreatedAfter(weekAgo);

        Instant freshness = latest(
                contractRepository.findLatestFetchedAt(),
                documentRepository.findLatestFetchedAt());

        return new MonitorOverviewDTO(
                spentYtd != null ? spentYtd : BigDecimal.ZERO,
                contracts,
                flagged,
                documents,
                newDocs,
                freshness);
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> getFeed(String category, String type, int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);

        List<MonitorFeedItemDTO> combined = new ArrayList<>();

        if (type == null || type.isBlank() || "all".equalsIgnoreCase(type) || "contract".equalsIgnoreCase(type)) {
            Page<MonitorContractEntity> contracts = contractRepository.findAll(
                    PageRequest.of(0, 200, org.springframework.data.domain.Sort.by("signedAt").descending()));
            for (MonitorContractEntity c : contracts) {
                combined.add(toFeedItem(c));
            }
        }

        if (type == null || type.isBlank() || "all".equalsIgnoreCase(type) || "document".equalsIgnoreCase(type)) {
            Page<MonitorDocumentEntity> docs = documentRepository.findAll(
                    PageRequest.of(0, 200, org.springframework.data.domain.Sort.by("publishedAt").descending()));
            for (MonitorDocumentEntity d : docs) {
                combined.add(toFeedItem(d));
            }
        }

        if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            combined.removeIf(item -> item.category() == null || !category.equalsIgnoreCase(item.category()));
        }

        combined.sort(Comparator
                .comparing(MonitorFeedItemDTO::date, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(MonitorFeedItemDTO::publishedAt, Comparator.nullsLast(Comparator.reverseOrder())));

        long total = combined.size();
        int from = Math.min(page * size, combined.size());
        int to = Math.min(from + size, combined.size());
        return MonitorPageDTO.of(combined.subList(from, to), page, size, total);
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> search(String q, int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        if (q == null || q.isBlank()) {
            return MonitorPageDTO.of(List.of(), page, size, 0);
        }

        List<MonitorFeedItemDTO> combined = new ArrayList<>();
        Page<MonitorContractEntity> contracts = contractRepository.search(q, PageRequest.of(0, 100));
        combined.addAll(contracts.getContent().stream().map(this::toFeedItem).toList());

        Page<MonitorDocumentEntity> docs = documentRepository.search(q, PageRequest.of(0, 100));
        combined.addAll(docs.getContent().stream().map(this::toFeedItem).toList());

        combined.sort(Comparator
                .comparing((MonitorFeedItemDTO i) -> i.date(), Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(i -> i.publishedAt(), Comparator.nullsLast(Comparator.reverseOrder())));

        long total = combined.size();
        int from = Math.min(page * size, combined.size());
        int to = Math.min(from + size, combined.size());
        return MonitorPageDTO.of(combined.subList(from, to), page, size, total);
    }

    @Transactional(readOnly = true)
    public List<MonitorSearchSuggestionDTO> searchSuggest(String q, int limit) {
        if (q == null || q.isBlank()) {
            return List.of();
        }
        int capped = Math.min(Math.max(limit, 1), 12);
        List<MonitorSearchSuggestionDTO> out = new ArrayList<>();

        contractRepository.search(q, PageRequest.of(0, capped)).getContent().forEach(c -> out.add(
                new MonitorSearchSuggestionDTO(
                        String.valueOf(c.getId()),
                        "contract",
                        truncate(c.getSubject(), 80),
                        c.getContractorName())));

        if (out.size() < capped) {
            documentRepository.search(q, PageRequest.of(0, capped - out.size())).getContent().forEach(d -> out.add(
                    new MonitorSearchSuggestionDTO(
                            String.valueOf(d.getId()),
                            "document",
                            truncate(d.getTitle(), 80),
                            d.getDocumentType().name())));
        }
        return out.stream().limit(capped).toList();
    }

    @Transactional(readOnly = true)
    public List<MonitorFeedItemDTO> getWeeklyHighlights() {
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        LocalDate weekStart = LocalDate.now().minusDays(7);

        List<ScoredItem> scored = new ArrayList<>();

        for (MonitorContractEntity c : contractRepository.findAll()) {
            if (c.getSignedAt() == null || c.getSignedAt().isBefore(weekStart)) {
                continue;
            }
            int impact = (c.getRiskScore() != null ? c.getRiskScore() : 0) * 2;
            if (c.getAmountEur() != null) {
                impact += Math.min(50, c.getAmountEur().divide(new BigDecimal("10000"), 0, RoundingMode.HALF_UP).intValue());
            }
            scored.add(new ScoredItem(toFeedItem(c), impact));
        }

        for (MonitorDocumentEntity d : documentRepository.findAll()) {
            Instant published = d.getPublishedAt();
            if (published == null || published.isBefore(weekAgo)) {
                continue;
            }
            int impact = d.getImpactScore() != null ? d.getImpactScore() * 10 : 5;
            scored.add(new ScoredItem(toFeedItem(d), impact));
        }

        return scored.stream()
                .sorted(Comparator.comparingInt(ScoredItem::score).reversed())
                .limit(5)
                .map(ScoredItem::item)
                .toList();
    }

    @Transactional(readOnly = true)
    public MonitorProcurementStatsDTO getProcurementStats() {
        List<MonitorProcurementStatsDTO.ChartPointDTO> monthly = contractRepository.monthlySpend().stream()
                .map(row -> new MonitorProcurementStatsDTO.ChartPointDTO(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).intValue(),
                        (BigDecimal) row[2],
                        ((Number) row[3]).longValue()))
                .toList();

        List<MonitorProcurementStatsDTO.SectorSpendDTO> sectors = contractRepository.spendBySector().stream()
                .map(row -> new MonitorProcurementStatsDTO.SectorSpendDTO(
                        (String) row[0],
                        (BigDecimal) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        List<MonitorProcurementStatsDTO.YearlySpendDTO> yearly = contractRepository.yearlySpend().stream()
                .map(row -> new MonitorProcurementStatsDTO.YearlySpendDTO(
                        ((Number) row[0]).intValue(),
                        (BigDecimal) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        List<MonitorProcurementStatsDTO.TopCompanyDTO> top = contractRepository
                .topContractors(PageRequest.of(0, 20)).stream()
                .map(row -> new MonitorProcurementStatsDTO.TopCompanyDTO(
                        (String) row[0],
                        (String) row[1],
                        (BigDecimal) row[2],
                        ((Number) row[3]).longValue()))
                .toList();

        return new MonitorProcurementStatsDTO(monthly, yearly, sectors, top);
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> getAnomalies(int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        Page<MonitorContractEntity> anomalies = contractRepository.findAnomalies(
                MonitorRiskService.FLAG_THRESHOLD, PageRequest.of(page, size));
        List<MonitorFeedItemDTO> items = anomalies.getContent().stream().map(this::toFeedItem).toList();
        return MonitorPageDTO.of(items, page, size, anomalies.getTotalElements());
    }

    @Transactional(readOnly = true)
    public MonitorFlowsDTO getFlows() {
        List<MonitorContractEntity> contracts = contractRepository.findAll();
        Map<String, BigDecimal> authorityTotals = new HashMap<>();
        Map<String, String> authorityLabels = new HashMap<>();
        Map<String, BigDecimal> contractorTotals = new HashMap<>();
        Map<String, String> contractorLabels = new HashMap<>();
        Map<String, Long> linkCounts = new HashMap<>();
        Map<String, BigDecimal> linkValues = new HashMap<>();

        for (MonitorContractEntity c : contracts) {
            if (c.getAmountEur() == null) {
                continue;
            }
            String authId = "auth:" + c.getAuthorityEik();
            authorityLabels.putIfAbsent(authId, c.getAuthorityName() != null ? c.getAuthorityName() : c.getAuthorityEik());
            authorityTotals.merge(authId, c.getAmountEur(), BigDecimal::add);

            String contractorId = c.getContractorEik() != null ? "co:" + c.getContractorEik() : "co:unknown";
            contractorLabels.putIfAbsent(contractorId,
                    c.getContractorName() != null ? c.getContractorName() : "Неизвестен");
            contractorTotals.merge(contractorId, c.getAmountEur(), BigDecimal::add);

            String linkKey = authId + "->" + contractorId;
            linkCounts.merge(linkKey, 1L, Long::sum);
            linkValues.merge(linkKey, c.getAmountEur(), BigDecimal::add);
        }

        Set<String> nodeIds = new HashSet<>();
        nodeIds.addAll(authorityTotals.keySet());
        nodeIds.addAll(contractorTotals.keySet());

        List<MonitorFlowsDTO.FlowNodeDTO> nodes = nodeIds.stream()
                .map(id -> new MonitorFlowsDTO.FlowNodeDTO(
                        id,
                        id.startsWith("auth:") ? authorityLabels.getOrDefault(id, id) : contractorLabels.getOrDefault(id, id),
                        id.startsWith("auth:") ? "authority" : "contractor"))
                .toList();

        List<MonitorFlowsDTO.FlowLinkDTO> links = linkValues.entrySet().stream()
                .map(e -> {
                    String[] parts = e.getKey().split("->");
                    return new MonitorFlowsDTO.FlowLinkDTO(
                            parts[0], parts[1], e.getValue(), linkCounts.getOrDefault(e.getKey(), 0L));
                })
                .toList();

        return new MonitorFlowsDTO(nodes, links);
    }

    @Transactional(readOnly = true)
    public MonitorContractDetailDTO getContract(Long id) {
        MonitorContractEntity c = contractRepository.findById(id)
                .orElseThrow(() -> new MonitorNotFoundException("Договорът не е намерен."));
        return toContractDetail(c);
    }

    @Transactional(readOnly = true)
    public MonitorConnectionsDTO getConnections() {
        return connectionsService.buildConnectionsGraph();
    }

    @Transactional(readOnly = true)
    public MonitorConnectionsDTO getCompanyConnections(String eik) {
        return connectionsService.buildCompanyConnections(eik);
    }

    @Transactional(readOnly = true)
    public MonitorRegionalComparisonDTO getRegionalComparison() {
        Map<String, MonitorRegionalComparisonDTO.MunicipalityRowDTO> byEik = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : MonitorRegionalConfig.AUTHORITY_LABELS.entrySet()) {
            byEik.put(entry.getKey(), emptyMunicipalityRow(entry.getKey(), entry.getValue()));
        }
        for (Object[] row : contractRepository.spendByAuthority()) {
            String eik = (String) row[0];
            String name = MonitorRegionalConfig.labelForAuthority(eik, (String) row[1]);
            BigDecimal total = (BigDecimal) row[2];
            long count = ((Number) row[3]).longValue();
            long withBids = contractRepository.countWithBidsByAuthority(eik);
            long singleBid = contractRepository.countSingleBidderByAuthority(eik);
            double singleShare = withBids > 0 ? (singleBid * 100.0 / withBids) : 0.0;
            byEik.put(eik, new MonitorRegionalComparisonDTO.MunicipalityRowDTO(
                    eik, name, total, count, null, singleShare));
        }
        return new MonitorRegionalComparisonDTO(new ArrayList<>(byEik.values()));
    }

    private static MonitorRegionalComparisonDTO.MunicipalityRowDTO emptyMunicipalityRow(String eik, String name) {
        return new MonitorRegionalComparisonDTO.MunicipalityRowDTO(
                eik, name, BigDecimal.ZERO, 0L, null, 0.0);
    }

    @Transactional(readOnly = true)
    public MonitorCouncilStatsDTO getCouncilStats() {
        List<MonitorCouncilStatsDTO.CouncilTypeCardDTO> cards = new ArrayList<>();
        for (MonitorDocumentType type : List.of(
                MonitorDocumentType.COUNCIL_DECISION,
                MonitorDocumentType.COUNCIL_PROTOCOL,
                MonitorDocumentType.COUNCIL_AGENDA,
                MonitorDocumentType.PUBLIC_CONSULTATION)) {
            long count = documentRepository.countByDocumentType(type);
            MonitorDocumentEntity latest = documentRepository.findFirstByDocumentTypeOrderByPublishedAtDesc(type);
            cards.add(new MonitorCouncilStatsDTO.CouncilTypeCardDTO(
                    type.name(),
                    councilTypeLabel(type),
                    count,
                    latest != null ? latest.getPublishedAt() : null,
                    latest != null ? truncate(latest.getTitle(), 80) : null));
        }
        long total = cards.stream().mapToLong(MonitorCouncilStatsDTO.CouncilTypeCardDTO::count).sum();
        return new MonitorCouncilStatsDTO(total, cards);
    }

    @Transactional(readOnly = true)
    public List<MonitorRelatedSignalDTO> getContractRelatedSignals(Long contractId) {
        MonitorContractEntity c = contractRepository.findById(contractId)
                .orElseThrow(() -> new MonitorNotFoundException("Договорът не е намерен."));
        return signalsLinkService.findRelatedSignals(c, 15);
    }

    @Transactional(readOnly = true)
    public MonitorBudgetDTO getBudget() {
        return deepDataService.getSmolyanBudget();
    }

    @Transactional(readOnly = true)
    public MonitorEuFundsDTO getEuFunds() {
        return deepDataService.getEuFunds();
    }

    @Transactional(readOnly = true)
    public List<MonitorCouncilorCardDTO> getCouncilors() {
        return deepDataService.getCouncilors();
    }

    @Transactional(readOnly = true)
    public MonitorDocumentDetailDTO getDocument(Long id) {
        MonitorDocumentEntity d = documentRepository.findById(id)
                .orElseThrow(() -> new MonitorNotFoundException("Документът не е намерен."));
        return toDocumentDetail(d);
    }

    @Transactional(readOnly = true)
    public List<MonitorFeedItemDTO> getDeadlines() {
        return documentRepository.findUpcomingDeadlines(LocalDate.now(), PageRequest.of(0, 20)).stream()
                .map(this::toFeedItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> getCouncilDocuments(int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        List<MonitorDocumentType> types = List.of(
                MonitorDocumentType.COUNCIL_DECISION,
                MonitorDocumentType.COUNCIL_PROTOCOL,
                MonitorDocumentType.COUNCIL_AGENDA);
        Page<MonitorDocumentEntity> docs = documentRepository.findByTypes(types, PageRequest.of(page, size));
        List<MonitorFeedItemDTO> items = docs.getContent().stream().map(this::toFeedItem).toList();
        return MonitorPageDTO.of(items, page, size, docs.getTotalElements());
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> getConsultations(int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        Page<MonitorDocumentEntity> docs = documentRepository.findByTypes(
                List.of(MonitorDocumentType.PUBLIC_CONSULTATION), PageRequest.of(page, size));
        List<MonitorFeedItemDTO> items = docs.getContent().stream().map(this::toFeedItem).toList();
        return MonitorPageDTO.of(items, page, size, docs.getTotalElements());
    }

    @Transactional(readOnly = true)
    public MonitorCompetitionDTO getCompetition() {
        return competitionService.computeRegionalCompetition();
    }

    @Transactional(readOnly = true)
    public MonitorCompanyDetailDTO getCompany(String eik) {
        MonitorCompanyEntity company = companyRepository.findByEik(eik.trim())
                .orElseThrow(() -> new MonitorNotFoundException("Фирмата не е намерена в регионалния обхват."));
        List<MonitorFeedItemDTO> recent = contractRepository
                .findByContractorEikOrderBySignedAtDesc(eik.trim(), PageRequest.of(0, 10))
                .stream()
                .map(this::toFeedItem)
                .toList();
        return new MonitorCompanyDetailDTO(
                company.getEik(),
                company.getName(),
                company.getTotalWonEur(),
                company.getContractCount() != null ? company.getContractCount() : 0,
                company.getCompositeRiskScore(),
                recent,
                company.getLegalForm(),
                company.getRegisteredAddress(),
                company.getManagersSummary(),
                company.getRegistryStatus(),
                company.getRegistryFetchedAt());
    }

    @Transactional(readOnly = true)
    public List<MonitorFeedItemDTO> getCouncilTimeline() {
        List<MonitorDocumentType> types = List.of(
                MonitorDocumentType.COUNCIL_DECISION,
                MonitorDocumentType.COUNCIL_PROTOCOL,
                MonitorDocumentType.COUNCIL_AGENDA);
        return documentRepository.findByTypes(types, PageRequest.of(0, 30)).getContent().stream()
                .map(this::toFeedItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public MonitorIngestionStatusDTO getIngestionStatus() {
        MonitorIngestionRunEntity sigma = ingestionRunRepository
                .findFirstByIngestionTypeOrderByStartedAtDesc(MonitorIngestionType.SIGMA)
                .orElse(null);
        MonitorIngestionRunEntity scrape = ingestionRunRepository
                .findFirstByIngestionTypeOrderByStartedAtDesc(MonitorIngestionType.SMOLYAN_BG)
                .orElse(null);
        MonitorIngestionRunEntity eop = ingestionRunRepository
                .findFirstByIngestionTypeOrderByStartedAtDesc(MonitorIngestionType.EOP)
                .orElse(null);

        return new MonitorIngestionStatusDTO(
                sigma != null ? sigma.getStatus().name() : "NEVER",
                sigma != null ? sigma.getStartedAt() : null,
                sigma != null ? sigma.getRecordsProcessed() : null,
                sigma != null ? sigma.getMessage() : null,
                eop != null ? eop.getStatus().name() : "NEVER",
                eop != null ? eop.getStartedAt() : null,
                eop != null ? eop.getRecordsProcessed() : null,
                eop != null ? eop.getMessage() : null,
                scrape != null ? scrape.getStatus().name() : "NEVER",
                scrape != null ? scrape.getStartedAt() : null,
                contractRepository.count(),
                documentRepository.count());
    }

    private MonitorFeedItemDTO toFeedItem(MonitorContractEntity c) {
        return new MonitorFeedItemDTO(
                String.valueOf(c.getId()),
                "contract",
                truncate(c.getSubject(), 120),
                c.getShortSummary(),
                c.getAiCategory() != null ? c.getAiCategory() : mapSectorLabel(c.getSectorCode()),
                c.getRiskScore(),
                parseRiskFlags(c.getRiskFlagsJson()),
                c.getAmountEur(),
                c.getSignedAt(),
                c.getSourceUrl(),
                c.getFetchedAt());
    }

    private MonitorFeedItemDTO toFeedItem(MonitorDocumentEntity d) {
        return new MonitorFeedItemDTO(
                String.valueOf(d.getId()),
                "document",
                truncate(d.getTitle(), 120),
                d.getShortSummary(),
                d.getAiCategory() != null ? d.getAiCategory() : d.getDocumentType().name(),
                null,
                List.of(),
                d.getAmount(),
                d.getDeadlineDate(),
                d.getSourceUrl(),
                d.getPublishedAt());
    }

    private MonitorContractDetailDTO toContractDetail(MonitorContractEntity c) {
        List<MonitorRelatedSignalDTO> relatedSignals = signalsLinkService.findRelatedSignals(c, 10);
        List<MonitorAmendmentDTO> amendments = amendmentRepository.findByContractIdOrderByAmendedAtDesc(c.getId())
                .stream()
                .map(this::toAmendmentDto)
                .toList();
        return new MonitorContractDetailDTO(
                c.getId(),
                c.getSigmaId(),
                c.getSubject(),
                c.getShortSummary(),
                c.getAuthorityName(),
                c.getContractorName(),
                c.getContractorEik(),
                c.getSectorCode(),
                c.getProcedureType(),
                c.getSignedAt(),
                c.getAmountEur(),
                c.getOriginalAmountEur(),
                c.getEstimatedValueEur(),
                c.getPublicationDate(),
                c.isEuFunded(),
                c.getBidsReceived(),
                c.getRiskScore(),
                parseRiskFlags(c.getRiskFlagsJson()),
                c.getSourceUrl(),
                c.getRegionScope().name(),
                relatedSignals.size(),
                relatedSignals,
                amendments);
    }

    private MonitorAmendmentDTO toAmendmentDto(MonitorAmendmentEntity a) {
        return new MonitorAmendmentDTO(
                a.getId(),
                a.getAmendedAt(),
                a.getPreviousAmountEur(),
                a.getNewAmountEur(),
                a.getDeltaEur(),
                a.getChangeDescription(),
                a.getChangeReason(),
                a.getSourceUrl());
    }

    private MonitorDocumentDetailDTO toDocumentDetail(MonitorDocumentEntity d) {
        return new MonitorDocumentDetailDTO(
                d.getId(),
                d.getDocumentType().name(),
                d.getTitle(),
                d.getShortSummary(),
                d.getAiCategory(),
                d.getImpactScore(),
                d.getAmount(),
                d.getCompanyName(),
                d.getDeadlineDate(),
                d.getPublishedAt(),
                d.getSourceUrl());
    }

    private List<RiskBadgeDTO> parseRiskFlags(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<Map<String, Object>> flags = objectMapper.readValue(json, new TypeReference<>() {
            });
            return flags.stream()
                    .map(f -> {
                        String code = String.valueOf(f.get("code"));
                        String label = String.valueOf(f.get("label"));
                        Object tip = f.get("tooltip");
                        String tooltip = tip != null && !String.valueOf(tip).isBlank()
                                ? String.valueOf(tip)
                                : MonitorRiskService.tooltipFor(code);
                        return new RiskBadgeDTO(code, label, tooltip);
                    })
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private static String mapSectorLabel(String sectorCode) {
        if (sectorCode == null) {
            return "Поръчка";
        }
        return "CPV " + sectorCode;
    }

    private static String councilTypeLabel(MonitorDocumentType type) {
        return switch (type) {
            case COUNCIL_DECISION -> "Решения";
            case COUNCIL_PROTOCOL -> "Протоколи";
            case COUNCIL_AGENDA -> "Дневен ред";
            case PUBLIC_CONSULTATION -> "Обсъждания";
            default -> type.name();
        };
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        String t = value.trim();
        return t.length() <= max ? t : t.substring(0, max - 3) + "...";
    }

    private static Instant latest(Instant a, Instant b) {
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        return a.isAfter(b) ? a : b;
    }

    private record ScoredItem(MonitorFeedItemDTO item, int score) {
    }
}

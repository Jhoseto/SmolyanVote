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
import java.util.Optional;
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
    private final MonitorAiAnalysisService aiAnalysisService;
    private final ObjectMapper objectMapper;
    private final SigmaProxyService sigmaProxyService;

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
            MonitorAiAnalysisService aiAnalysisService,
            ObjectMapper objectMapper,
            SigmaProxyService sigmaProxyService) {
        this.contractRepository = contractRepository;
        this.documentRepository = documentRepository;
        this.companyRepository = companyRepository;
        this.ingestionRunRepository = ingestionRunRepository;
        this.competitionService = competitionService;
        this.connectionsService = connectionsService;
        this.signalsLinkService = signalsLinkService;
        this.deepDataService = deepDataService;
        this.amendmentRepository = amendmentRepository;
        this.aiAnalysisService = aiAnalysisService;
        this.objectMapper = objectMapper;
        this.sigmaProxyService = sigmaProxyService;
    }

    @Transactional(readOnly = true)
    public MonitorOverviewDTO getOverview(MonitorScope scope) {
        LocalDate yearStart = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate yearEnd = LocalDate.of(LocalDate.now().getYear(), 12, 31);
        String authorityEik = scope.authorityFilter();
        BigDecimal spentYtd = contractRepository.sumAmountBetween(yearStart, yearEnd, authorityEik);
        long contracts = contractRepository.countInScope(authorityEik);
        long flagged = contractRepository.countAnomalies(MonitorRiskService.FLAG_THRESHOLD, authorityEik);
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long documents = scope.includesScrapedSources() ? documentRepository.count() : 0L;
        long newDocs = scope.includesScrapedSources() ? documentRepository.countByCreatedAfter(weekAgo) : 0L;

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
    public MonitorPageDTO<MonitorFeedItemDTO> getFeed(
            String category, String type, int page, int size, String sort, MonitorScope scope) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        String authority = scope.authorityFilter();

        if ("document".equalsIgnoreCase(type)) {
            if (!scope.includesScrapedSources()) {
                return MonitorPageDTO.of(List.of(), page, size, 0);
            }
            Page<MonitorDocumentEntity> docs = documentRepository.findAll(
                    PageRequest.of(page, size, org.springframework.data.domain.Sort.by("publishedAt").descending()));
            List<MonitorFeedItemDTO> items = docs.getContent().stream().map(this::toFeedItem).toList();
            return MonitorPageDTO.of(items, page, size, docs.getTotalElements());
        }

        org.springframework.data.domain.Sort contractSort = "newest".equalsIgnoreCase(sort)
                ? org.springframework.data.domain.Sort.by("signedAt").descending()
                : org.springframework.data.domain.Sort.by("riskScore").descending()
                        .and(org.springframework.data.domain.Sort.by("signedAt").descending());

        Page<MonitorContractEntity> contracts = contractRepository.findAllInScope(
                authority, PageRequest.of(page, size, contractSort));
        List<MonitorFeedItemDTO> items = contracts.getContent().stream()
                .map(this::toFeedItem)
                .filter(item -> matchesCategory(item, category))
                .toList();
        return MonitorPageDTO.of(items, page, size, contracts.getTotalElements());
    }

    @Transactional(readOnly = true)
    public MonitorBriefingDTO getBriefing(MonitorScope scope) {
        String authority = scope.authorityFilter();
        LocalDate yearStart = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate yearEnd = LocalDate.of(LocalDate.now().getYear(), 12, 31);
        BigDecimal spentYtd = contractRepository.sumAmountBetween(yearStart, yearEnd, authority);
        long flagged = contractRepository.countAnomalies(MonitorRiskService.FLAG_THRESHOLD, authority);
        BigDecimal flaggedAmount = contractRepository.sumFlaggedAmount(MonitorRiskService.FLAG_THRESHOLD, authority);

        Page<MonitorContractEntity> topFlagged = contractRepository.findAnomalies(
                MonitorRiskService.FLAG_THRESHOLD,
                authority,
                PageRequest.of(0, 5, org.springframework.data.domain.Sort.by("riskScore").descending()
                        .and(org.springframework.data.domain.Sort.by("signedAt").descending())));

        List<MonitorFeedItemDTO> topConcerns = topFlagged.getContent().stream().map(this::toFeedItem).toList();

        Map<String, ThemeAccumulator> themeMap = new LinkedHashMap<>();
        Page<MonitorContractEntity> flaggedPage = contractRepository.findAnomalies(
                MonitorRiskService.FLAG_THRESHOLD, authority, PageRequest.of(0, 400));
        for (MonitorContractEntity c : flaggedPage.getContent()) {
            MonitorInsightBuilder.ContractInsight insight = MonitorInsightBuilder.build(c, objectMapper);
            String code = insight.concernType() != null ? insight.concernType() : "OTHER";
            themeMap.computeIfAbsent(code, ThemeAccumulator::new)
                    .add(c.getAmountEur());
        }

        List<MonitorBriefingThemeDTO> themes = themeMap.values().stream()
                .sorted((a, b) -> Long.compare(b.count, a.count))
                .limit(5)
                .map(t -> new MonitorBriefingThemeDTO(
                        t.code,
                        MonitorInsightBuilder.concernLabel(t.code),
                        t.count,
                        t.amount,
                        themeExplanation(t.code)))
                .toList();

        String headline = flagged > 0
                ? flagged + " поръчки с рискови сигнали в областта"
                : "Преглед на общинските разходи в област Смолян";

        String narrative = buildBriefingNarrative(
                flagged, flaggedAmount, spentYtd, themes, scope);

        MonitorAiReportDTO aiReport = aiAnalysisService.loadLatestReport(scope);
        if (aiReport.aiGenerated() && aiReport.executiveSummary() != null) {
            narrative = aiReport.executiveSummary();
        }

        List<MonitorBriefingChartPointDTO> riskChart = themes.stream()
                .map(t -> new MonitorBriefingChartPointDTO(
                        t.label(),
                        t.count(),
                        t.amountEur(),
                        themeColor(t.code())))
                .toList();

        List<MonitorBriefingChartPointDTO> councilChart = buildCouncilChart();

        List<MonitorFeedItemDTO> recentDocuments = documentRepository
                .findByImpactDesc(PageRequest.of(0, 6))
                .getContent()
                .stream()
                .map(this::toFeedItem)
                .toList();

        return new MonitorBriefingDTO(
                headline,
                narrative,
                flagged,
                flaggedAmount != null ? flaggedAmount : BigDecimal.ZERO,
                spentYtd != null ? spentYtd : BigDecimal.ZERO,
                themes,
                topConcerns,
                aiReport,
                riskChart,
                councilChart,
                recentDocuments);
    }

    private List<MonitorBriefingChartPointDTO> buildCouncilChart() {
        List<MonitorBriefingChartPointDTO> points = new ArrayList<>();
        for (MonitorDocumentType type : List.of(
                MonitorDocumentType.COUNCIL_DECISION,
                MonitorDocumentType.COUNCIL_PROTOCOL,
                MonitorDocumentType.COUNCIL_AGENDA,
                MonitorDocumentType.PUBLIC_CONSULTATION)) {
            long count = documentRepository.countByDocumentType(type);
            if (count > 0) {
                points.add(new MonitorBriefingChartPointDTO(
                        councilTypeLabel(type),
                        count,
                        null,
                        councilTypeColor(type)));
            }
        }
        return points;
    }

    private static String themeColor(String code) {
        return switch (code != null ? code : "OTHER") {
            case "LOW_COMPETITION" -> "#dc2626";
            case "OVERPRICE" -> "#ea580c";
            case "FRAGMENTATION" -> "#ca8a04";
            case "GOVERNANCE" -> "#7c3aed";
            default -> "#64748b";
        };
    }

    private static String councilTypeColor(MonitorDocumentType type) {
        return switch (type) {
            case COUNCIL_DECISION -> "#2563eb";
            case COUNCIL_PROTOCOL -> "#0891b2";
            case COUNCIL_AGENDA -> "#059669";
            case PUBLIC_CONSULTATION -> "#d97706";
            default -> "#94a3b8";
        };
    }

    private static String buildBriefingNarrative(
            long flagged,
            BigDecimal flaggedAmount,
            BigDecimal spentYtd,
            List<MonitorBriefingThemeDTO> themes,
            MonitorScope scope) {
        if (flagged == 0) {
            return scope.authorityFilter() != null
                    ? "За избраната община няма активирани рискови индикатори над прага. "
                            + "Прегледайте поръчките по дата или сменете общината."
                    : "Системата следи " + (spentYtd != null ? formatMillions(spentYtd) : "разходите")
                            + " YTD. Засега няма поръчки над прага на внимание — "
                            + "фокусирайте се върху най-големите договори в таб Поръчки.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("От ").append(formatMillions(spentYtd != null ? spentYtd : BigDecimal.ZERO))
                .append(" похарчени тази година, ")
                .append(formatMillions(flaggedAmount != null ? flaggedAmount : BigDecimal.ZERO))
                .append(" са в поръчки с рискови индикатори (слаба конкуренция, раздробяване, ръст от анекси и др.). ");
        if (!themes.isEmpty()) {
            MonitorBriefingThemeDTO top = themes.get(0);
            sb.append("Най-често: ").append(top.label().toLowerCase())
                    .append(" (").append(top.count()).append(" случая). ");
        }
        sb.append("Това не е обвинение — показваме факти и индикатори, за да решите къде да копаете по-дълбоко.");
        return sb.toString();
    }

    private static String themeExplanation(String code) {
        return switch (code) {
            case "SINGLE_BID", "LARGE_SINGLE_BID" -> "Парите отиват при един изпълнител без реална конкуренция.";
            case "FRAGMENTATION" -> "Много малки поръчки към една фирма — възможен обход на по-строги процедури.";
            case "ABOVE_TYPICAL" -> "Стойности далеч над медианата за същия сектор в региона.";
            case "AMENDMENT_GROWTH" -> "Договорите нарастват след подписване — следете анексите.";
            case "REPEAT_WINNER" -> "Едни и същи фирми доминират в сектор — концентрация на пари.";
            default -> "Комбинация от правила за прозрачност и конкуренция.";
        };
    }

    private static String formatMillions(BigDecimal eur) {
        if (eur == null || eur.signum() == 0) {
            return "0 €";
        }
        if (eur.compareTo(new BigDecimal("1000000")) >= 0) {
            return eur.divide(new BigDecimal("1000000"), 1, RoundingMode.HALF_UP) + " млн €";
        }
        return eur.setScale(0, RoundingMode.HALF_UP) + " €";
    }

    private static boolean matchesCategory(MonitorFeedItemDTO item, String category) {
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            return true;
        }
        return item.category() != null && category.equalsIgnoreCase(item.category());
    }

    private static final class ThemeAccumulator {
        final String code;
        long count;
        BigDecimal amount = BigDecimal.ZERO;

        ThemeAccumulator(String code) {
            this.code = code;
        }

        void add(BigDecimal eur) {
            count++;
            if (eur != null) {
                amount = amount.add(eur);
            }
        }
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> getFeed(String category, String type, int page, int size, MonitorScope scope) {
        return getFeed(category, type, page, size, "risk", scope);
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> search(String q, int page, int size, MonitorScope scope) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        if (q == null || q.isBlank()) {
            return MonitorPageDTO.of(List.of(), page, size, 0);
        }

        List<MonitorFeedItemDTO> combined = new ArrayList<>();
        Page<MonitorContractEntity> contracts = contractRepository.search(
                q, scope.authorityFilter(), PageRequest.of(0, 100));
        combined.addAll(contracts.getContent().stream().map(this::toFeedItem).toList());

        if (scope.includesScrapedSources()) {
            Page<MonitorDocumentEntity> docs = documentRepository.search(q, PageRequest.of(0, 100));
            combined.addAll(docs.getContent().stream().map(this::toFeedItem).toList());
        }

        combined.sort(Comparator
                .comparing((MonitorFeedItemDTO i) -> i.date(), Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(i -> i.publishedAt(), Comparator.nullsLast(Comparator.reverseOrder())));

        long total = combined.size();
        int from = Math.min(page * size, combined.size());
        int to = Math.min(from + size, combined.size());
        return MonitorPageDTO.of(combined.subList(from, to), page, size, total);
    }

    @Transactional(readOnly = true)
    public List<MonitorSearchSuggestionDTO> searchSuggest(String q, int limit, MonitorScope scope) {
        if (q == null || q.isBlank()) {
            return List.of();
        }
        int capped = Math.min(Math.max(limit, 1), 12);
        List<MonitorSearchSuggestionDTO> out = new ArrayList<>();

        contractRepository.search(q, scope.authorityFilter(), PageRequest.of(0, capped)).getContent().forEach(c -> out.add(
                new MonitorSearchSuggestionDTO(
                        String.valueOf(c.getId()),
                        "contract",
                        truncate(c.getSubject(), 80),
                        c.getContractorName())));

        if (out.size() < capped && scope.includesScrapedSources()) {
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
    public List<MonitorFeedItemDTO> getWeeklyHighlights(MonitorScope scope) {
        Page<MonitorContractEntity> flagged = contractRepository.findAnomalies(
                MonitorRiskService.FLAG_THRESHOLD,
                scope.authorityFilter(),
                PageRequest.of(0, 5, org.springframework.data.domain.Sort.by("riskScore").descending()
                        .and(org.springframework.data.domain.Sort.by("signedAt").descending())));
        List<MonitorFeedItemDTO> items = new ArrayList<>(flagged.getContent().stream().map(this::toFeedItem).toList());

        if (items.size() < 5 && scope.includesScrapedSources()) {
            Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
            for (MonitorDocumentEntity d : documentRepository.findAll()) {
                Instant published = d.getPublishedAt();
                if (published != null && !published.isBefore(weekAgo)) {
                    items.add(toFeedItem(d));
                    if (items.size() >= 5) {
                        break;
                    }
                }
            }
        }
        return items.stream().limit(5).toList();
    }

    @Transactional(readOnly = true)
    public MonitorProcurementStatsDTO getProcurementStats(MonitorScope scope) {
        String authorityEik = scope.authorityFilter();
        List<MonitorProcurementStatsDTO.ChartPointDTO> monthly = contractRepository.monthlySpend(authorityEik).stream()
                .map(row -> new MonitorProcurementStatsDTO.ChartPointDTO(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).intValue(),
                        (BigDecimal) row[2],
                        ((Number) row[3]).longValue()))
                .toList();

        List<MonitorProcurementStatsDTO.SectorSpendDTO> sectors = contractRepository.spendBySector(authorityEik).stream()
                .map(row -> new MonitorProcurementStatsDTO.SectorSpendDTO(
                        (String) row[0],
                        (BigDecimal) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        List<MonitorProcurementStatsDTO.YearlySpendDTO> yearly = contractRepository.yearlySpend(authorityEik).stream()
                .map(row -> new MonitorProcurementStatsDTO.YearlySpendDTO(
                        ((Number) row[0]).intValue(),
                        (BigDecimal) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        List<MonitorProcurementStatsDTO.TopCompanyDTO> top = contractRepository
                .topContractors(authorityEik, PageRequest.of(0, 20)).stream()
                .map(row -> new MonitorProcurementStatsDTO.TopCompanyDTO(
                        (String) row[0],
                        (String) row[1],
                        (BigDecimal) row[2],
                        ((Number) row[3]).longValue()))
                .toList();

        return new MonitorProcurementStatsDTO(monthly, yearly, sectors, top);
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> getAnomalies(int page, int size, MonitorScope scope) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        Page<MonitorContractEntity> anomalies = contractRepository.findAnomalies(
                MonitorRiskService.FLAG_THRESHOLD, scope.authorityFilter(), PageRequest.of(page, size));
        List<MonitorFeedItemDTO> items = anomalies.getContent().stream().map(this::toFeedItem).toList();
        return MonitorPageDTO.of(items, page, size, anomalies.getTotalElements());
    }

    @Transactional(readOnly = true)
    public MonitorFlowsDTO getFlows(MonitorScope scope) {
        List<MonitorContractEntity> contracts = contractRepository.findAllInScope(scope.authorityFilter());
        Map<String, BigDecimal> authorityTotals = new HashMap<>();
        Map<String, String> authorityLabels = new HashMap<>();
        Map<String, BigDecimal> contractorTotals = new HashMap<>();
        Map<String, String> contractorLabels = new HashMap<>();
        Map<String, Long> linkCounts = new HashMap<>();
        Map<String, BigDecimal> linkValues = new HashMap<>();
        Map<String, List<MonitorContractEntity>> linkContracts = new HashMap<>();

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
            linkContracts.computeIfAbsent(linkKey, k -> new ArrayList<>()).add(c);
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
                    String authId = parts[0];
                    List<MonitorContractEntity> grouped = linkContracts.getOrDefault(e.getKey(), List.of());
                    MonitorFlowHintBuilder.FlowHint hint = MonitorFlowHintBuilder.forLinkContracts(
                            grouped,
                            e.getValue(),
                            authorityTotals.get(authId),
                            objectMapper);
                    MonitorSubcontractorHelper.LinkSubcontractSummary sub =
                            MonitorSubcontractorHelper.summarizeLink(grouped);
                    return new MonitorFlowsDTO.FlowLinkDTO(
                            parts[0],
                            parts[1],
                            e.getValue(),
                            linkCounts.getOrDefault(e.getKey(), 0L),
                            hint.flaggedCount(),
                            hint.concernLabel(),
                            hint.citizenHint(),
                            sub.contractsWithSubcontractor(),
                            sub.subcontractorName(),
                            sub.subcontractorEik(),
                            sub.subcontractingTotalEur());
                })
                .toList();

        return new MonitorFlowsDTO(nodes, links);
    }

    @Transactional(readOnly = true)
    public MonitorContractDetailDTO getContract(Long id, boolean fresh) {
        MonitorContractEntity c = contractRepository.findById(id)
                .orElseThrow(() -> new MonitorNotFoundException("Договорът не е намерен."));
        Instant sigmaRefreshedAt = c.getFetchedAt();
        if (c.getSigmaId() != null && !c.getSigmaId().startsWith("eop:")) {
            Optional<SigmaProxyService.CachedJson> cachedJson =
                    sigmaProxyService.getContractJson(c.getSigmaId(), fresh);
            if (cachedJson.isPresent()) {
                SigmaContractJsonOverlay.Overlay overlay = SigmaContractJsonOverlay.fromJson(
                        cachedJson.get().body(), cachedJson.get().fetchedAt());
                SigmaContractJsonOverlay.apply(c, overlay);
                sigmaRefreshedAt = cachedJson.get().fetchedAt();
            }
        }
        return toContractDetail(c, sigmaRefreshedAt);
    }

    @Transactional(readOnly = true)
    public List<MonitorOfficialBudgetTrendPointDTO> getOfficialBudgetTrend() {
        return deepDataService.getOfficialBudgetTrend();
    }

    @Transactional(readOnly = true)
    public MonitorConnectionsDTO getConnections(MonitorScope scope) {
        return connectionsService.buildConnectionsGraph(scope);
    }

    @Transactional(readOnly = true)
    public MonitorConnectionsDTO getCompanyConnections(String eik) {
        return connectionsService.buildCompanyConnections(eik);
    }

    /** Options for the municipality filter, in the order the region is usually listed. */
    public List<MonitorMunicipalityDTO> getMunicipalities() {
        return MonitorRegionalConfig.AUTHORITY_LABELS.entrySet().stream()
                .map(entry -> new MonitorMunicipalityDTO(
                        entry.getKey(),
                        entry.getValue(),
                        MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(entry.getKey())))
                .toList();
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
    public MonitorCouncilStatsDTO getCouncilStats(MonitorScope scope) {
        if (!scope.includesScrapedSources()) {
            return new MonitorCouncilStatsDTO(0L, List.of());
        }
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
    public MonitorBudgetDTO getBudget(
            MonitorScope scope,
            Integer year,
            Integer yearFrom,
            Integer yearTo) {
        return deepDataService.getBudget(scope, year, yearFrom, yearTo);
    }

    @Transactional(readOnly = true)
    public MonitorEuFundsDTO getEuFunds(MonitorScope scope) {
        return deepDataService.getEuFunds(scope);
    }

    @Transactional(readOnly = true)
    public List<MonitorCouncilorCardDTO> getCouncilors(MonitorScope scope) {
        return deepDataService.getCouncilors(scope);
    }

    @Transactional(readOnly = true)
    public MonitorDocumentDetailDTO getDocument(Long id) {
        MonitorDocumentEntity d = documentRepository.findById(id)
                .orElseThrow(() -> new MonitorNotFoundException("Документът не е намерен."));
        return toDocumentDetail(d);
    }

    @Transactional(readOnly = true)
    public List<MonitorFeedItemDTO> getDeadlines(MonitorScope scope) {
        if (!scope.includesScrapedSources()) {
            return List.of();
        }
        return documentRepository.findUpcomingDeadlines(LocalDate.now(), PageRequest.of(0, 20)).stream()
                .map(this::toFeedItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> getCouncilDocuments(int page, int size, MonitorScope scope) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        if (!scope.includesScrapedSources()) {
            return MonitorPageDTO.of(List.of(), page, size, 0);
        }
        List<MonitorDocumentType> types = List.of(
                MonitorDocumentType.COUNCIL_DECISION,
                MonitorDocumentType.COUNCIL_PROTOCOL,
                MonitorDocumentType.COUNCIL_AGENDA);
        Page<MonitorDocumentEntity> docs = documentRepository.findByTypes(types, PageRequest.of(page, size));
        List<MonitorFeedItemDTO> items = docs.getContent().stream().map(this::toFeedItem).toList();
        return MonitorPageDTO.of(items, page, size, docs.getTotalElements());
    }

    @Transactional(readOnly = true)
    public MonitorPageDTO<MonitorFeedItemDTO> getConsultations(int page, int size, MonitorScope scope) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);
        if (!scope.includesScrapedSources()) {
            return MonitorPageDTO.of(List.of(), page, size, 0);
        }
        Page<MonitorDocumentEntity> docs = documentRepository.findByTypes(
                List.of(MonitorDocumentType.PUBLIC_CONSULTATION), PageRequest.of(page, size));
        List<MonitorFeedItemDTO> items = docs.getContent().stream().map(this::toFeedItem).toList();
        return MonitorPageDTO.of(items, page, size, docs.getTotalElements());
    }

    @Transactional(readOnly = true)
    public MonitorCompetitionDTO getCompetition(MonitorScope scope) {
        return competitionService.computeRegionalCompetition(scope);
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
        long subRoleCount = contractRepository.countBySubcontractorEik(eik.trim());
        BigDecimal subRoleTotal = contractRepository.sumSubcontractingAmountBySubcontractorEik(eik.trim());
        List<MonitorFeedItemDTO> subRoles = contractRepository
                .findBySubcontractorEikOrderBySignedAtDesc(eik.trim(), PageRequest.of(0, 10))
                .stream()
                .map(this::toSubcontractorFeedItem)
                .toList();
        return new MonitorCompanyDetailDTO(
                company.getEik(),
                company.getName(),
                company.getTotalWonEur(),
                company.getContractCount() != null ? company.getContractCount() : 0,
                company.getCompositeRiskScore(),
                recent,
                (int) subRoleCount,
                subRoleTotal != null && subRoleTotal.signum() > 0 ? subRoleTotal : null,
                subRoles,
                company.getLegalForm(),
                company.getRegisteredAddress(),
                company.getManagersSummary(),
                company.getRegistryStatus(),
                company.getRegistryFetchedAt());
    }

    @Transactional(readOnly = true)
    public List<MonitorFeedItemDTO> getCouncilTimeline(MonitorScope scope) {
        if (!scope.includesScrapedSources()) {
            return List.of();
        }
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
        MonitorInsightBuilder.ContractInsight insight = MonitorInsightBuilder.build(c, objectMapper);
        return new MonitorFeedItemDTO(
                String.valueOf(c.getId()),
                "contract",
                insight.headline(),
                insight.whyItMatters(),
                insight.category(),
                c.getRiskScore(),
                parseRiskFlags(c.getRiskFlagsJson()),
                c.getAmountEur(),
                c.getSignedAt(),
                null,
                c.getFetchedAt(),
                truncate(c.getSubject(), 200),
                insight.concernType());
    }

    /** Feed row when the company appears as a declared subcontractor (EOP). */
    private MonitorFeedItemDTO toSubcontractorFeedItem(MonitorContractEntity c) {
        String main = c.getContractorName() != null ? c.getContractorName().trim() : "изпълнител";
        String authority = c.getAuthorityName() != null ? c.getAuthorityName().trim() : "община";
        String amount = c.getSubcontractingAmountEur() != null
                ? formatEurShort(c.getSubcontractingAmountEur())
                : formatEurShort(c.getAmountEur());
        String headline = "Подизпълнител при " + main + " — " + amount;
        String why = authority + " → " + main + ". Деклариран подизпълнител по данни от EOP"
                + (c.getSubcontractingPercent() != null ? " (" + c.getSubcontractingPercent().stripTrailingZeros().toPlainString() + "%)." : ".");
        return new MonitorFeedItemDTO(
                String.valueOf(c.getId()),
                "contract",
                headline,
                why,
                "Подизпълнител",
                c.getRiskScore(),
                parseRiskFlags(c.getRiskFlagsJson()),
                c.getSubcontractingAmountEur() != null ? c.getSubcontractingAmountEur() : c.getAmountEur(),
                c.getSignedAt(),
                null,
                c.getFetchedAt(),
                truncate(c.getSubject(), 200),
                "SUBCONTRACTOR");
    }

    private static String formatEurShort(BigDecimal amount) {
        if (amount == null) {
            return "—";
        }
        return amount.setScale(0, RoundingMode.HALF_UP) + " €";
    }

    private MonitorFeedItemDTO toFeedItem(MonitorDocumentEntity d) {
        return new MonitorFeedItemDTO(
                String.valueOf(d.getId()),
                "document",
                d.getShortSummary() != null && !d.getShortSummary().isBlank()
                        ? truncate(d.getShortSummary(), 120)
                        : truncate(d.getTitle(), 120),
                d.getInsightWhy() != null ? d.getInsightWhy() : d.getShortSummary(),
                d.getAiCategory() != null ? d.getAiCategory() : d.getDocumentType().name(),
                null,
                List.of(),
                d.getAmount(),
                d.getDeadlineDate(),
                d.getSourceUrl(),
                d.getPublishedAt(),
                truncate(d.getTitle(), 200),
                null);
    }

    private MonitorContractDetailDTO toContractDetail(MonitorContractEntity c, Instant sigmaRefreshedAt) {
        List<MonitorRelatedSignalDTO> relatedSignals = signalsLinkService.findRelatedSignals(c, 10);
        List<MonitorAmendmentDTO> amendments = amendmentRepository.findByContractIdOrderByAmendedAtDesc(c.getId())
                .stream()
                .map(this::toAmendmentDto)
                .toList();
        MonitorInsightBuilder.ContractInsight insight = MonitorInsightBuilder.build(c, objectMapper);
        String sigmaUrl = resolveSigmaUrl(c.getSigmaId());
        return new MonitorContractDetailDTO(
                c.getId(),
                c.getSigmaId(),
                c.getUnp(),
                c.getSubject(),
                c.getShortSummary(),
                c.getAuthorityName(),
                c.getAuthorityEik(),
                c.getContractorName(),
                c.getContractorEik(),
                c.getContractorKind(),
                MonitorSubcontractorHelper.hasDeclaredSubcontractor(c),
                c.getSubcontractorName(),
                c.getSubcontractorEik(),
                c.getSubcontractingPercent(),
                c.getSubcontractingAmountEur(),
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
                c.getAiCategory(),
                c.getImpactScore(),
                c.getRegionScope().name(),
                resolveDataSource(c.getSigmaId()),
                c.getFetchedAt(),
                relatedSignals.size(),
                relatedSignals,
                amendments,
                insight.headline(),
                c.getInsightWhy() != null ? c.getInsightWhy() : insight.whyItMatters(),
                insight.concernType(),
                c.getAiAnalysis(),
                sigmaUrl,
                sigmaRefreshedAt);
    }

    private static String resolveSigmaUrl(String sigmaId) {
        if (sigmaId == null || sigmaId.isBlank() || sigmaId.startsWith("eop:")) {
            return null;
        }
        return MonitorRegionalConfig.SIGMA_BASE_URL + "/contracts/" + sigmaId;
    }

    private static String resolveDataSource(String sigmaId) {
        if (sigmaId != null && sigmaId.startsWith("eop:")) {
            return "EOP";
        }
        return "SIGMA";
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
        String currency = d.getAmountCurrency();
        BigDecimal amountEur = null;
        if (d.getAmount() != null && currency != null) {
            amountEur = MonitorCurrencyUtil.toEur(d.getAmount(), currency);
        }
        return new MonitorDocumentDetailDTO(
                d.getId(),
                d.getDocumentType().name(),
                d.getTitle(),
                d.getShortSummary(),
                d.getAiCategory(),
                d.getImpactScore(),
                d.getAmount(),
                currency,
                amountEur,
                d.getCompanyName(),
                d.getDeadlineDate(),
                d.getPublishedAt(),
                d.getSourceUrl(),
                d.getAiAnalysis(),
                d.getInsightWhy());
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

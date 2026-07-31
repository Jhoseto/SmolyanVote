package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.models.enums.MonitorDocumentType;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Builds structured fact packs for Gemini — contracts + council documents unified. */
@Component
public class MonitorAnalysisContextBuilder {

    private static final int TOP_DOCS = 12;

    private final MonitorContractRepository contractRepository;
    private final MonitorDocumentRepository documentRepository;
    private final ObjectMapper objectMapper;

    public MonitorAnalysisContextBuilder(
            MonitorContractRepository contractRepository,
            MonitorDocumentRepository documentRepository,
            ObjectMapper objectMapper) {
        this.contractRepository = contractRepository;
        this.documentRepository = documentRepository;
        this.objectMapper = objectMapper;
    }

    public String buildRegionalContext(MonitorScope scope) {
        String authority = scope.authorityFilter();
        LocalDate yearStart = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate yearEnd = LocalDate.of(LocalDate.now().getYear(), 12, 31);
        BigDecimal spentYtd = contractRepository.sumAmountBetween(yearStart, yearEnd, authority);
        long flagged = contractRepository.countAnomalies(MonitorRiskService.FLAG_THRESHOLD, authority);
        BigDecimal flaggedAmount = contractRepository.sumFlaggedAmount(MonitorRiskService.FLAG_THRESHOLD, authority);
        long total = contractRepository.countInScope(authority);

        List<MonitorContractEntity> topFlagged = contractRepository.findAnomalies(
                MonitorRiskService.FLAG_THRESHOLD, authority,
                PageRequest.of(0, 20, org.springframework.data.domain.Sort.by("riskScore").descending()
                        .and(org.springframework.data.domain.Sort.by("signedAt").descending()))).getContent();

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("scope", scope.label());
        root.put("year", LocalDate.now().getYear());
        root.put("spentYtdEur", spentYtd);
        root.put("totalContracts", total);
        root.put("flaggedContracts", flagged);
        root.put("flaggedAmountEur", flaggedAmount);
        root.put("topFlaggedCases", topFlagged.stream().map(this::contractFacts).toList());
        root.put("themeCounts", aggregateThemes(topFlagged));
        root.put("councilDocumentCounts", documentCountsByType());
        root.put("recentCouncilDecisions", recentDocuments(List.of(MonitorDocumentType.COUNCIL_DECISION), 8));
        root.put("recentConsultations", recentDocuments(List.of(MonitorDocumentType.PUBLIC_CONSULTATION), 6));
        root.put("upcomingDeadlines", upcomingDeadlines(5));

        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (Exception e) {
            return root.toString();
        }
    }

    public String buildContractContext(MonitorContractEntity c) {
        Map<String, Object> facts = contractFacts(c);
        facts.put("riskFlagDetails", parseFlags(c.getRiskFlagsJson()));
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(facts);
        } catch (Exception e) {
            return facts.toString();
        }
    }

    public String buildDocumentContext(MonitorDocumentEntity d) {
        Map<String, Object> facts = new LinkedHashMap<>();
        facts.put("id", d.getId());
        facts.put("type", d.getDocumentType() != null ? d.getDocumentType().name() : null);
        facts.put("title", d.getTitle());
        facts.put("publishedAt", d.getPublishedAt() != null ? d.getPublishedAt().toString() : null);
        facts.put("deadlineDate", d.getDeadlineDate() != null ? d.getDeadlineDate().toString() : null);
        facts.put("amount", d.getAmount());
        facts.put("companyName", d.getCompanyName());
        facts.put("sourceUrl", d.getSourceUrl());
        String content = d.getRawContent();
        if (content != null && content.length() > 14_000) {
            content = content.substring(0, 14_000) + "…";
        }
        facts.put("rawContent", content);
        facts.put("existingSummary", d.getShortSummary());
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(facts);
        } catch (Exception e) {
            return facts.toString();
        }
    }

    private Map<String, Long> documentCountsByType() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (MonitorDocumentType type : MonitorDocumentType.values()) {
            long n = documentRepository.countByDocumentType(type);
            if (n > 0) {
                counts.put(type.name(), n);
            }
        }
        return counts;
    }

    private List<Map<String, Object>> recentDocuments(List<MonitorDocumentType> types, int limit) {
        List<Map<String, Object>> out = new ArrayList<>();
        var page = documentRepository.findByTypes(types, PageRequest.of(0, limit));
        for (MonitorDocumentEntity d : page.getContent()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("title", d.getTitle());
            m.put("type", d.getDocumentType() != null ? d.getDocumentType().name() : null);
            m.put("publishedAt", d.getPublishedAt() != null ? d.getPublishedAt().toString() : null);
            m.put("impactScore", d.getImpactScore());
            String snippet = d.getAiAnalysis() != null ? d.getAiAnalysis()
                    : d.getShortSummary() != null ? d.getShortSummary()
                            : truncate(d.getRawContent(), 400);
            m.put("summary", snippet);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> upcomingDeadlines(int limit) {
        List<Map<String, Object>> out = new ArrayList<>();
        var docs = documentRepository.findUpcomingDeadlines(LocalDate.now(), PageRequest.of(0, limit));
        for (MonitorDocumentEntity d : docs) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("title", d.getTitle());
            m.put("deadline", d.getDeadlineDate() != null ? d.getDeadlineDate().toString() : null);
            m.put("type", d.getDocumentType() != null ? d.getDocumentType().name() : null);
            out.add(m);
        }
        return out;
    }

    private static String truncate(String text, int max) {
        if (text == null) return null;
        String t = text.replaceAll("\\s+", " ").trim();
        return t.length() <= max ? t : t.substring(0, max - 1) + "…";
    }

    private Map<String, Object> contractFacts(MonitorContractEntity c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("subject", c.getSubject());
        m.put("authority", c.getAuthorityName());
        m.put("contractor", c.getContractorName());
        m.put("contractorEik", c.getContractorEik());
        m.put("amountEur", c.getAmountEur());
        m.put("originalAmountEur", c.getOriginalAmountEur());
        m.put("estimatedValueEur", c.getEstimatedValueEur());
        m.put("signedAt", c.getSignedAt() != null ? c.getSignedAt().toString() : null);
        m.put("publicationDate", c.getPublicationDate() != null ? c.getPublicationDate().toString() : null);
        m.put("bidsReceived", c.getBidsReceived());
        m.put("riskScore", c.getRiskScore());
        m.put("sectorCpv", c.getSectorCode());
        m.put("procedureType", c.getProcedureType());
        m.put("euFunded", c.isEuFunded());
        m.put("riskFlags", parseFlags(c.getRiskFlagsJson()));
        return m;
    }

    private Map<String, Long> aggregateThemes(List<MonitorContractEntity> contracts) {
        Map<String, Long> themes = new LinkedHashMap<>();
        for (MonitorContractEntity c : contracts) {
            var insight = MonitorInsightBuilder.buildFromRiskData(c, objectMapper);
            String code = insight.concernType() != null ? insight.concernType() : "OTHER";
            themes.merge(code, 1L, Long::sum);
        }
        return themes;
    }

    private List<Map<String, Object>> parseFlags(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }
}

package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MonitorAiService {

    private static final Logger log = LoggerFactory.getLogger(MonitorAiService.class);
    private static final int MAX_SUMMARY_LENGTH = 280;

    private final MonitorDocumentRepository documentRepository;
    private final MonitorContractRepository contractRepository;
    private final MonitorGeminiClient geminiClient;
    private final MonitorAiAnalysisService analysisService;
    private final MonitorInsightEnrichmentService insightEnrichmentService;
    private final ObjectMapper objectMapper;

    public MonitorAiService(
            MonitorDocumentRepository documentRepository,
            MonitorContractRepository contractRepository,
            MonitorGeminiClient geminiClient,
            MonitorAiAnalysisService analysisService,
            MonitorInsightEnrichmentService insightEnrichmentService,
            ObjectMapper objectMapper) {
        this.documentRepository = documentRepository;
        this.contractRepository = contractRepository;
        this.geminiClient = geminiClient;
        this.analysisService = analysisService;
        this.insightEnrichmentService = insightEnrichmentService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void reprocessDocument(Long documentId) {
        MonitorDocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new MonitorNotFoundException("Документът не е намерен."));
        applyDocumentAi(doc);
        documentRepository.save(doc);
    }

    @Transactional
    public AiBatchResult processPendingBatch(int limit) {
        int docs = processPendingDocuments(limit);
        int contracts = processPendingContracts(Math.max(5, limit / 2));
        return new AiBatchResult(docs, contracts);
    }

    public record AiBatchResult(int documents, int contracts) {
        public int total() {
            return documents + contracts;
        }

        public String summaryMessage() {
            if (documents == 0 && contracts == 0) {
                return "AI: 0 анализа — проверете GEMINI_API_KEY и backend.log";
            }
            return "AI: " + documents + " документа, " + contracts + " договора с пълен анализ";
        }
    }

    @Transactional
    public int processPendingDocuments(int limit) {
        List<MonitorDocumentEntity> pending = documentRepository
                .findPendingDeepAnalysis(PageRequest.of(0, limit));
        if (pending.isEmpty()) {
            pending = documentRepository.findPendingAiProcessing(PageRequest.of(0, limit));
        }
        int count = 0;
        for (MonitorDocumentEntity doc : pending) {
            try {
                if (applyDocumentAi(doc)) {
                    documentRepository.save(doc);
                    count++;
                }
            } catch (Exception ex) {
                log.warn("AI batch failed for document {}: {}", doc.getId(), ex.getMessage());
            }
        }
        return count;
    }

    /** High-risk contracts first — full Gemini analysis when configured. */
    @Transactional
    public int processPendingContracts(int limit) {
        if (!geminiClient.isConfigured()) {
            return 0;
        }
        List<MonitorContractEntity> pending = contractRepository.findPendingContractAiProcessing(
                MonitorRiskService.FLAG_THRESHOLD, PageRequest.of(0, limit));
        int count = 0;
        for (MonitorContractEntity contract : pending) {
            try {
                if (applyContractAi(contract)) {
                    contractRepository.save(contract);
                    count++;
                }
            } catch (Exception ex) {
                log.warn("AI batch failed for contract {}: {}", contract.getId(), ex.getMessage());
            }
        }
        return count;
    }

    private boolean applyDocumentAi(MonitorDocumentEntity doc) {
        String raw = doc.getRawContent();
        if ((raw == null || raw.isBlank()) && (doc.getTitle() == null || doc.getTitle().isBlank())) {
            return false;
        }
        if (analysisService.analyzeDocument(doc)) {
            return true;
        }
        applyAiShallow(doc);
        return doc.getShortSummary() != null && !doc.getShortSummary().isBlank();
    }

    private void applyAiShallow(MonitorDocumentEntity doc) {
        String raw = doc.getRawContent();
        if (raw == null || raw.isBlank()) {
            raw = doc.getTitle();
        }
        if (raw == null || raw.isBlank()) {
            return;
        }

        if (geminiClient.isConfigured()) {
            try {
                MonitorGeminiClient.MonitorAiResult result = geminiClient.summarizeDocument(doc.getTitle(), raw);
                if (result != null && result.shortSummary() != null) {
                    doc.setShortSummary(truncate(result.shortSummary()));
                    doc.setAiCategory(result.category());
                    doc.setImpactScore(result.impactScore());
                    return;
                }
            } catch (Exception ex) {
                log.warn("Gemini failed for document {}: {}", doc.getId(), ex.getMessage());
            }
        }

        doc.setShortSummary(truncate(raw.replaceAll("\\s+", " ").trim()));
        if (doc.getAiCategory() == null) {
            doc.setAiCategory("Друго");
        }
        if (doc.getImpactScore() == null) {
            doc.setImpactScore(5);
        }
    }

    private boolean applyContractAi(MonitorContractEntity contract) {
        if (analysisService.analyzeContract(contract)) {
            return true;
        }
        return applyRuleBasedContractInsight(contract);
    }

    private boolean applyRuleBasedContractInsight(MonitorContractEntity contract) {
        if (insightEnrichmentService.enrichContract(contract)) {
            return true;
        }
        if (contract.getRiskScore() != null && contract.getRiskScore() >= MonitorRiskService.FLAG_THRESHOLD
                && (contract.getShortSummary() == null
                        || contract.getShortSummary().equals(contract.getSubject()))) {
            insightEnrichmentService.enrichContract(contract);
            return contract.getShortSummary() != null && !contract.getShortSummary().equals(contract.getSubject());
        }
        return false;
    }

    private List<String> extractFlagLabels(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<Map<String, Object>> flags = objectMapper.readValue(json, new TypeReference<>() {
            });
            List<String> labels = new ArrayList<>();
            for (Map<String, Object> f : flags) {
                Object label = f.get("label");
                if (label != null) {
                    labels.add(label.toString());
                }
            }
            return labels;
        } catch (Exception e) {
            return List.of();
        }
    }

    private static String truncate(String text) {
        if (text.length() <= MAX_SUMMARY_LENGTH) {
            return text;
        }
        return text.substring(0, MAX_SUMMARY_LENGTH - 3) + "...";
    }
}

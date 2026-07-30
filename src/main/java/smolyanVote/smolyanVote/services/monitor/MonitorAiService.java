package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;

import java.util.List;

@Service
public class MonitorAiService {

    private static final Logger log = LoggerFactory.getLogger(MonitorAiService.class);
    private static final int MAX_SUMMARY_LENGTH = 280;

    private final MonitorDocumentRepository documentRepository;
    private final MonitorGeminiClient geminiClient;

    public MonitorAiService(MonitorDocumentRepository documentRepository, MonitorGeminiClient geminiClient) {
        this.documentRepository = documentRepository;
        this.geminiClient = geminiClient;
    }

    @Transactional
    public void reprocessDocument(Long documentId) {
        MonitorDocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new MonitorNotFoundException("Документът не е намерен."));
        applyAi(doc);
        documentRepository.save(doc);
    }

    @Transactional
    public int processPendingBatch(int limit) {
        List<MonitorDocumentEntity> pending = documentRepository
                .findPendingAiProcessing(PageRequest.of(0, limit));
        int count = 0;
        for (MonitorDocumentEntity doc : pending) {
            try {
                applyAi(doc);
                documentRepository.save(doc);
                count++;
            } catch (Exception ex) {
                log.warn("AI batch failed for {}: {}", doc.getId(), ex.getMessage());
            }
        }
        return count;
    }

    private void applyAi(MonitorDocumentEntity doc) {
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

    private static String truncate(String text) {
        if (text.length() <= MAX_SUMMARY_LENGTH) {
            return text;
        }
        return text.substring(0, MAX_SUMMARY_LENGTH - 3) + "...";
    }
}

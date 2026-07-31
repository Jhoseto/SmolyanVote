package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.MonitorDocumentType;
import smolyanVote.smolyanVote.models.enums.MonitorSource;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorScrapedDocumentDTO;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class MonitorDocumentIngestService {

    private final MonitorDocumentRepository documentRepository;
    private final DocumentArchiveService archiveService;
    private final ObjectMapper objectMapper;

    public MonitorDocumentIngestService(
            MonitorDocumentRepository documentRepository,
            DocumentArchiveService archiveService,
            ObjectMapper objectMapper) {
        this.documentRepository = documentRepository;
        this.archiveService = archiveService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public int ingestBatch(List<MonitorScrapedDocumentDTO> items) {
        if (items == null || items.isEmpty()) {
            return 0;
        }
        int processed = 0;

        for (MonitorScrapedDocumentDTO item : items) {
            if (item.sourceId() == null || item.sourceId().isBlank()) {
                continue;
            }
            MonitorDocumentEntity entity = documentRepository
                    .findBySourceAndSourceId(MonitorSource.SMOLYAN_BG, item.sourceId().trim())
                    .orElseGet(MonitorDocumentEntity::new);

            String previousHash = entity.getContentHash();
            String previousContent = entity.getRawContent();

            entity.setSource(MonitorSource.SMOLYAN_BG);
            entity.setSourceId(item.sourceId().trim());
            entity.setSourceUrl(item.sourceUrl());
            entity.setDocumentType(parseType(item.documentType()));
            entity.setTitle(item.title() != null ? item.title().trim() : "Без заглавие");
            entity.setRawContent(item.rawContent());
            entity.setPublishedAt(item.publishedAt());
            entity.setFetchedAt(Instant.now());

            if (item.amount() != null) {
                entity.setAmount(item.amount());
            }
            if (item.companyName() != null && !item.companyName().isBlank()) {
                entity.setCompanyName(item.companyName().trim());
            }
            if (item.deadlineDate() != null) {
                entity.setDeadlineDate(LocalDate.ofInstant(item.deadlineDate(), ZoneId.of("Europe/Sofia")));
            }
            if (item.pdfUrls() != null && !item.pdfUrls().isEmpty()) {
                try {
                    entity.setPdfUrlsJson(objectMapper.writeValueAsString(item.pdfUrls()));
                } catch (Exception ignored) {
                    /* keep prior */
                }
            }

            String hash = MonitorHashUtil.sha256(item.rawContent() != null ? item.rawContent() : item.title());
            entity.setContentHash(hash);

            boolean isNew = entity.getId() == null;
            boolean changed = !isNew && previousHash != null && !previousHash.equals(hash);

            entity = documentRepository.save(entity);

            if (changed) {
                archiveService.archivePreviousVersion(entity, previousHash, previousContent);
                entity.setShortSummary(null);
                entity.setAiCategory(null);
                entity.setImpactScore(null);
                entity.setAiAnalysis(null);
                entity.setInsightWhy(null);
                documentRepository.save(entity);
            }

            processed++;
        }

        return processed;
    }

    private static MonitorDocumentType parseType(String value) {
        if (value == null || value.isBlank()) {
            return MonitorDocumentType.NEWS;
        }
        try {
            return MonitorDocumentType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return MonitorDocumentType.NEWS;
        }
    }
}

package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.MonitorDocumentType;
import smolyanVote.smolyanVote.models.enums.MonitorSource;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorScrapedDocumentDTO;

import java.time.Instant;
import java.util.List;

@Service
public class MonitorDocumentIngestService {

    private final MonitorDocumentRepository documentRepository;
    private final DocumentArchiveService archiveService;

    public MonitorDocumentIngestService(
            MonitorDocumentRepository documentRepository,
            DocumentArchiveService archiveService) {
        this.documentRepository = documentRepository;
        this.archiveService = archiveService;
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

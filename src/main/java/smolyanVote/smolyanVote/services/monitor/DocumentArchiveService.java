package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorArchiveEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorArchiveRepository;

import java.time.Instant;

@Service
public class DocumentArchiveService {

    private final MonitorArchiveRepository archiveRepository;

    public DocumentArchiveService(MonitorArchiveRepository archiveRepository) {
        this.archiveRepository = archiveRepository;
    }

    @Transactional
    public void archivePreviousVersion(MonitorDocumentEntity doc, String previousHash, String previousContent) {
        if (previousHash == null || previousHash.isBlank() || previousContent == null) {
            return;
        }
        if (previousHash.equals(doc.getContentHash())) {
            return;
        }
        MonitorArchiveEntity archive = new MonitorArchiveEntity();
        archive.setDocumentId(doc.getId());
        archive.setContentHash(previousHash);
        archive.setRawSnapshot(previousContent);
        archive.setSourceUrl(doc.getSourceUrl());
        archive.setFetchedAt(Instant.now());
        archiveRepository.save(archive);
    }
}

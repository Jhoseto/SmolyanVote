package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.time.Instant;

@Entity
@Table(name = "monitor_archives", indexes = {
        @Index(name = "idx_monitor_archives_document", columnList = "document_id"),
        @Index(name = "idx_monitor_archives_hash", columnList = "content_hash")
})
public class MonitorArchiveEntity extends BaseEntity {

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "raw_snapshot", columnDefinition = "LONGTEXT")
    private String rawSnapshot;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public String getRawSnapshot() {
        return rawSnapshot;
    }

    public void setRawSnapshot(String rawSnapshot) {
        this.rawSnapshot = rawSnapshot;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(Instant fetchedAt) {
        this.fetchedAt = fetchedAt;
    }
}

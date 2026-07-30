package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionStatus;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;

import java.time.Instant;

@Entity
@Table(name = "monitor_ingestion_runs", indexes = {
        @Index(name = "idx_monitor_ingestion_started", columnList = "started_at")
})
public class MonitorIngestionRunEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "ingestion_type", nullable = false, length = 32)
    private MonitorIngestionType ingestionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private MonitorIngestionStatus status;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "records_processed")
    private Integer recordsProcessed;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    public MonitorIngestionType getIngestionType() {
        return ingestionType;
    }

    public void setIngestionType(MonitorIngestionType ingestionType) {
        this.ingestionType = ingestionType;
    }

    public MonitorIngestionStatus getStatus() {
        return status;
    }

    public void setStatus(MonitorIngestionStatus status) {
        this.status = status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }

    public Integer getRecordsProcessed() {
        return recordsProcessed;
    }

    public void setRecordsProcessed(Integer recordsProcessed) {
        this.recordsProcessed = recordsProcessed;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.ReportReasonEnum;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports", indexes = {
        @Index(name = "idx_reports_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_reports_status", columnList = "status"),
        @Index(name = "idx_reports_created", columnList = "created_at"),
        @Index(name = "idx_reports_reporter_username", columnList = "reporter_username"),
        @Index(name = "idx_reports_reviewed_by_username", columnList = "reviewed_by_username")
})
public class ReportsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== УНИВЕРСАЛНА POLYMORPHIC ПОДДРЪЖКА =====
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private ReportableEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    // ===== ОСНОВНИ ПОЛЕТА =====
    @Column(name = "reporter_username", nullable = false, length = 50)
    private String reporterUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    private ReportReasonEnum reason;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "status", nullable = false)
    private String status = "PENDING"; // PENDING, REVIEWED, DISMISSED, RESOLVED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by_username", length = 50)
    private String reviewedByUsername;

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    // ===== КОНСТРУКТОРИ =====
    public ReportsEntity() {
        this.createdAt = LocalDateTime.now();
    }

    public ReportsEntity(ReportableEntityType entityType, Long entityId, String reporterUsername, ReportReasonEnum reason) {
        this();
        this.entityType = entityType;
        this.entityId = entityId;
        this.reporterUsername = reporterUsername;
        this.reason = reason;
    }

    public ReportsEntity(ReportableEntityType entityType, Long entityId, String reporterUsername,
                         ReportReasonEnum reason, String description) {
        this(entityType, entityId, reporterUsername, reason);
        this.description = description;
    }

    // ===== GETTERS AND SETTERS =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ReportableEntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(ReportableEntityType entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getReporterUsername() {
        return reporterUsername;
    }

    public void setReporterUsername(String reporterUsername) {
        this.reporterUsername = reporterUsername;
    }

    public ReportReasonEnum getReason() {
        return reason;
    }

    public void setReason(ReportReasonEnum reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewedByUsername() {
        return reviewedByUsername;
    }

    public void setReviewedByUsername(String reviewedByUsername) {
        this.reviewedByUsername = reviewedByUsername;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}
package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.enums.ReportReasonEnum;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.time.LocalDateTime;

public class ReportDTO {

    private Long id;
    private ReportableEntityType entityType;
    private Long entityId;
    private String entityDisplayName;
    private ReportReasonEnum reason;
    private String reasonDisplayName;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private String reporterUsername;
    private String reviewedByUsername;
    private String adminNotes;

    // ===== КОНСТРУКТОРИ =====

    public ReportDTO() {}

    public ReportDTO(ReportsEntity entity) {
        this.id = entity.getId();
        this.entityType = entity.getEntityType();
        this.entityId = entity.getEntityId();
        this.entityDisplayName = entity.getEntityType().getDisplayName();
        this.reason = entity.getReason();
        this.reasonDisplayName = entity.getReason().getDisplayName();
        this.description = entity.getDescription();
        this.status = entity.getStatus();
        this.createdAt = entity.getCreatedAt();
        this.reviewedAt = entity.getReviewedAt();
        this.reporterUsername = entity.getReporterUsername();
        this.reviewedByUsername = entity.getReviewedByUsername();
        this.adminNotes = entity.getAdminNotes();
    }

    // ===== STATIC FACTORY METHOD =====

    public static ReportDTO fromEntity(ReportsEntity entity) {
        return new ReportDTO(entity);
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

    public String getEntityDisplayName() {
        return entityDisplayName;
    }

    public void setEntityDisplayName(String entityDisplayName) {
        this.entityDisplayName = entityDisplayName;
    }

    public ReportReasonEnum getReason() {
        return reason;
    }

    public void setReason(ReportReasonEnum reason) {
        this.reason = reason;
    }

    public String getReasonDisplayName() {
        return reasonDisplayName;
    }

    public void setReasonDisplayName(String reasonDisplayName) {
        this.reasonDisplayName = reasonDisplayName;
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

    public String getReporterUsername() {
        return reporterUsername;
    }

    public void setReporterUsername(String reporterUsername) {
        this.reporterUsername = reporterUsername;
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
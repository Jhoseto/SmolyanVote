package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.time.LocalDateTime;
import java.util.List;

public class ModerationInboxItemDTO {

    private ReportableEntityType entityType;
    private Long entityId;
    private String entityLabel;
    private String authorUsername;
    private Long authorId;
    private int reportCount;
    private String status;
    private LocalDateTime lastReportDate;
    private List<Long> reportIds;
    private String preview;

    public ReportableEntityType getEntityType() { return entityType; }
    public void setEntityType(ReportableEntityType entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public String getEntityLabel() { return entityLabel; }
    public void setEntityLabel(String entityLabel) { this.entityLabel = entityLabel; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public int getReportCount() { return reportCount; }
    public void setReportCount(int reportCount) { this.reportCount = reportCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getLastReportDate() { return lastReportDate; }
    public void setLastReportDate(LocalDateTime lastReportDate) { this.lastReportDate = lastReportDate; }

    public List<Long> getReportIds() { return reportIds; }
    public void setReportIds(List<Long> reportIds) { this.reportIds = reportIds; }

    public String getPreview() { return preview; }
    public void setPreview(String preview) { this.preview = preview; }
}

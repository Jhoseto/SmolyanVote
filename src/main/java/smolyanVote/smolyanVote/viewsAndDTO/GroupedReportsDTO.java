package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.ReportReasonEnum;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO за групирани репорти по entity
 */
public class GroupedReportsDTO {

    private ReportableEntityType entityType;
    private Long entityId;
    private int reportCount;
    private LocalDateTime firstReportDate;
    private LocalDateTime lastReportDate;
    private List<String> reporterUsernames;
    private List<ReportReasonEnum> reasons;
    private String mostCommonReason;
    private String status; // PENDING, REVIEWED, etc.
    private String adminNotes;
    private List<Long> reportIds; // Всички ID-та за bulk operations

    // Constructors
    public GroupedReportsDTO() {}

    public GroupedReportsDTO(ReportableEntityType entityType, Long entityId, int reportCount) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.reportCount = reportCount;
    }

    // Getters and Setters
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

    public int getReportCount() {
        return reportCount;
    }

    public void setReportCount(int reportCount) {
        this.reportCount = reportCount;
    }

    public LocalDateTime getFirstReportDate() {
        return firstReportDate;
    }

    public void setFirstReportDate(LocalDateTime firstReportDate) {
        this.firstReportDate = firstReportDate;
    }

    public LocalDateTime getLastReportDate() {
        return lastReportDate;
    }

    public void setLastReportDate(LocalDateTime lastReportDate) {
        this.lastReportDate = lastReportDate;
    }

    public List<String> getReporterUsernames() {
        return reporterUsernames;
    }

    public void setReporterUsernames(List<String> reporterUsernames) {
        this.reporterUsernames = reporterUsernames;
    }

    public List<ReportReasonEnum> getReasons() {
        return reasons;
    }

    public void setReasons(List<ReportReasonEnum> reasons) {
        this.reasons = reasons;
    }

    public String getMostCommonReason() {
        return mostCommonReason;
    }

    public void setMostCommonReason(String mostCommonReason) {
        this.mostCommonReason = mostCommonReason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public List<Long> getReportIds() {
        return reportIds;
    }

    public void setReportIds(List<Long> reportIds) {
        this.reportIds = reportIds;
    }
}
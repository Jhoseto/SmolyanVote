package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.time.Instant;

/** Cached Gemini regional accountability report for a municipality or the whole oblast. */
@Entity
@Table(name = "monitor_regional_reports", indexes = {
        @Index(name = "idx_monitor_regional_reports_authority", columnList = "authority_eik, generated_at")
})
public class MonitorRegionalReportEntity extends BaseEntity {

    /** null = whole oblast Smolyan */
    @Column(name = "authority_eik", length = 20)
    private String authorityEik;

    @Column(name = "scope_label", nullable = false, length = 128)
    private String scopeLabel;

    @Column(name = "report_json", nullable = false, columnDefinition = "TEXT")
    private String reportJson;

    @Column(name = "generated_at", nullable = false, columnDefinition = "TIMESTAMP")
    private Instant generatedAt;

    public String getAuthorityEik() {
        return authorityEik;
    }

    public void setAuthorityEik(String authorityEik) {
        this.authorityEik = authorityEik;
    }

    public String getScopeLabel() {
        return scopeLabel;
    }

    public void setScopeLabel(String scopeLabel) {
        this.scopeLabel = scopeLabel;
    }

    public String getReportJson() {
        return reportJson;
    }

    public void setReportJson(String reportJson) {
        this.reportJson = reportJson;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }
}

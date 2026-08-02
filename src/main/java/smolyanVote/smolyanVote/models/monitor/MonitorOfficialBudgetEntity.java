package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Adopted municipal budget for a calendar year (official ObS decision), distinct from the CPV
 * indicative module. Amounts are stored in BGN as in the source documents.
 */
@Entity
@Table(name = "monitor_official_budgets", indexes = {
        @Index(name = "idx_monitor_official_budget_year", columnList = "budget_year")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_monitor_official_budget_auth_year", columnNames = {"authority_eik", "budget_year"})
})
public class MonitorOfficialBudgetEntity extends BaseEntity {

    @Column(name = "authority_eik", nullable = false, length = 16)
    private String authorityEik;

    @Column(name = "budget_year", nullable = false)
    private int budgetYear;

    @Column(name = "adopted_total_bgn", precision = 18, scale = 2)
    private BigDecimal adoptedTotalBgn;

    /** Reported absorption / cash execution (усвоение), when published. */
    @Column(name = "executed_total_bgn", precision = 18, scale = 2)
    private BigDecimal executedTotalBgn;

    @Column(name = "source_url", length = 512)
    private String sourceUrl;

    @Column(name = "source_title", length = 300)
    private String sourceTitle;

    /** Date of the execution report (year-end or interim). */
    @Column(name = "execution_as_of")
    private LocalDate executionAsOf;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "citizen_assessment_json", columnDefinition = "TEXT")
    private String citizenAssessmentJson;

    @OneToMany(mappedBy = "budget", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<MonitorOfficialBudgetLineEntity> lines = new ArrayList<>();

    public String getAuthorityEik() {
        return authorityEik;
    }

    public void setAuthorityEik(String authorityEik) {
        this.authorityEik = authorityEik;
    }

    public int getBudgetYear() {
        return budgetYear;
    }

    public void setBudgetYear(int budgetYear) {
        this.budgetYear = budgetYear;
    }

    public BigDecimal getAdoptedTotalBgn() {
        return adoptedTotalBgn;
    }

    public void setAdoptedTotalBgn(BigDecimal adoptedTotalBgn) {
        this.adoptedTotalBgn = adoptedTotalBgn;
    }

    public BigDecimal getExecutedTotalBgn() {
        return executedTotalBgn;
    }

    public void setExecutedTotalBgn(BigDecimal executedTotalBgn) {
        this.executedTotalBgn = executedTotalBgn;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public String getSourceTitle() {
        return sourceTitle;
    }

    public void setSourceTitle(String sourceTitle) {
        this.sourceTitle = sourceTitle;
    }

    public LocalDate getExecutionAsOf() {
        return executionAsOf;
    }

    public void setExecutionAsOf(LocalDate executionAsOf) {
        this.executionAsOf = executionAsOf;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCitizenAssessmentJson() {
        return citizenAssessmentJson;
    }

    public void setCitizenAssessmentJson(String citizenAssessmentJson) {
        this.citizenAssessmentJson = citizenAssessmentJson;
    }

    public List<MonitorOfficialBudgetLineEntity> getLines() {
        return lines;
    }

    public void setLines(List<MonitorOfficialBudgetLineEntity> lines) {
        this.lines = lines;
    }

    public void addLine(MonitorOfficialBudgetLineEntity line) {
        line.setBudget(this);
        lines.add(line);
    }
}

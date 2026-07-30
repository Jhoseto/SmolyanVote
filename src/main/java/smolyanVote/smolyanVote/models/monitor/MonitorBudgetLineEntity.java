package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.math.BigDecimal;

/**
 * Admin-editable planned municipal budget line for a given year.
 * Executed amounts are always computed live from contracts; only the plan is stored here.
 */
@Entity
@Table(name = "monitor_budget_lines", indexes = {
        @Index(name = "idx_monitor_budget_lines_year", columnList = "budget_year")
})
public class MonitorBudgetLineEntity extends BaseEntity {

    @Column(name = "category_key", nullable = false, length = 64)
    private String categoryKey;

    @Column(name = "label", nullable = false, length = 200)
    private String label;

    @Column(name = "planned_eur", nullable = false, precision = 18, scale = 2)
    private BigDecimal plannedEur;

    @Column(name = "cpv_prefix", length = 8)
    private String cpvPrefix;

    @Column(name = "budget_year", nullable = false)
    private int budgetYear;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public String getCategoryKey() {
        return categoryKey;
    }

    public void setCategoryKey(String categoryKey) {
        this.categoryKey = categoryKey;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public BigDecimal getPlannedEur() {
        return plannedEur;
    }

    public void setPlannedEur(BigDecimal plannedEur) {
        this.plannedEur = plannedEur;
    }

    public String getCpvPrefix() {
        return cpvPrefix;
    }

    public void setCpvPrefix(String cpvPrefix) {
        this.cpvPrefix = cpvPrefix;
    }

    public int getBudgetYear() {
        return budgetYear;
    }

    public void setBudgetYear(int budgetYear) {
        this.budgetYear = budgetYear;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}

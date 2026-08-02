package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.math.BigDecimal;

@Entity
@Table(name = "monitor_official_budget_lines")
public class MonitorOfficialBudgetLineEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "budget_id", nullable = false)
    private MonitorOfficialBudgetEntity budget;

    @Column(name = "category_key", nullable = false, length = 64)
    private String categoryKey;

    @Column(name = "label", nullable = false, length = 200)
    private String label;

    @Column(name = "adopted_bgn", nullable = false, precision = 18, scale = 2)
    private BigDecimal adoptedBgn;

    @Column(name = "executed_bgn", precision = 18, scale = 2)
    private BigDecimal executedBgn;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public MonitorOfficialBudgetEntity getBudget() {
        return budget;
    }

    public void setBudget(MonitorOfficialBudgetEntity budget) {
        this.budget = budget;
    }

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

    public BigDecimal getAdoptedBgn() {
        return adoptedBgn;
    }

    public void setAdoptedBgn(BigDecimal adoptedBgn) {
        this.adoptedBgn = adoptedBgn;
    }

    public BigDecimal getExecutedBgn() {
        return executedBgn;
    }

    public void setExecutedBgn(BigDecimal executedBgn) {
        this.executedBgn = executedBgn;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}

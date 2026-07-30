package smolyanVote.smolyanVote.services.monitor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Planned municipal budget lines for Община Смолян (indicative, from публични бюджетни данни).
 * Executed amounts are computed live from SIGMA contracts.
 */
public final class MonitorBudgetConfig {

    public static final int BUDGET_YEAR = 2026;

    public static final List<BudgetLine> PLANNED_LINES = List.of(
            new BudgetLine("infrastructure", "Инфраструктура и строителство", new BigDecimal("8500000"), "45"),
            new BudgetLine("environment", "Околна среда и чистота", new BigDecimal("3200000"), "90"),
            new BudgetLine("education", "Образование и култура", new BigDecimal("2100000"), null),
            new BudgetLine("social", "Социални услуги", new BigDecimal("1800000"), null),
            new BudgetLine("administration", "Администрация", new BigDecimal("2400000"), null));

    public static final Map<String, String> CPV_PREFIX_TO_CATEGORY = Map.of(
            "45", "infrastructure",
            "90", "environment",
            "80", "education",
            "85", "social");

    private MonitorBudgetConfig() {
    }

    public record BudgetLine(String id, String label, BigDecimal plannedEur, String cpvPrefix) {
    }
}

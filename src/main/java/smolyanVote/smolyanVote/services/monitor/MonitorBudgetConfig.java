package smolyanVote.smolyanVote.services.monitor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;

/**
 * Indicative CPV-sector framework for Община Смолян — NOT the full adopted municipal budget.
 * Executed amounts are computed live from SIGMA/EOP contracts grouped by CPV prefix.
 */
public final class MonitorBudgetConfig {

    public static final String ANALYTICAL_MODULE_DISCLAIMER =
            "Това не е официалният общински бюджет. Планът е индикативна рамка за избрани CPV сектори; "
                    + "изпълнението е сума от договори в SIGMA/ЦАИС ЕОП за същия обхват.";

    public static final String DATA_BASIS =
            "Изпълнение: договори от SIGMA/ЦАИС ЕОП, групирани по CPV (45*, 90*, 80*, 85*, останалото → администрация). "
                    + "План: административно поддържани индикативни стойности — не целият бюджет на общината.";

    /** Defaults and admin UI — runtime year follows the calendar. */
    public static final int BUDGET_YEAR = LocalDate.now().getYear();

    public static int budgetYear() {
        return LocalDate.now().getYear();
    }

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

    /** Maps SIGMA CPV sector code to a budget category key. */
    public static String categoryForCpv(String sectorCode) {
        if (sectorCode == null || sectorCode.length() < 2) {
            return "administration";
        }
        String prefix = sectorCode.substring(0, 2);
        return CPV_PREFIX_TO_CATEGORY.getOrDefault(prefix, "administration");
    }

    private MonitorBudgetConfig() {
    }

    public record BudgetLine(String id, String label, BigDecimal plannedEur, String cpvPrefix) {
    }
}

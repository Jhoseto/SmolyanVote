package smolyanVote.smolyanVote.services.monitor;

import smolyanVote.smolyanVote.models.monitor.MonitorBudgetLineEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorOfficialBudgetEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Indicative CPV plan lines scaled by official ObS budget per year (Smolyan only). */
public final class MonitorBudgetPlanSeed {

    private static final int REFERENCE_YEAR = 2025;

    private MonitorBudgetPlanSeed() {
    }

    public static boolean supportsIndicativePlan(int year) {
        return year >= MonitorOfficialBudgetSeed.FIRST_YEAR
                && year <= MonitorBudgetConfig.budgetYear() + 1;
    }

    /** In-memory plan rows — not persisted unless admin edits or current-year DB seed runs. */
    public static List<MonitorBudgetLineEntity> virtualScaledLines(int year) {
        BigDecimal scale = scaleForYear(year);
        if (scale == null) {
            return List.of();
        }
        List<MonitorBudgetLineEntity> virtual = new ArrayList<>();
        int order = 0;
        for (MonitorBudgetConfig.BudgetLine line : MonitorBudgetConfig.PLANNED_LINES) {
            MonitorBudgetLineEntity entity = new MonitorBudgetLineEntity();
            entity.setCategoryKey(line.id());
            entity.setLabel(line.label());
            entity.setPlannedEur(line.plannedEur()
                    .multiply(scale)
                    .setScale(2, RoundingMode.HALF_UP));
            entity.setCpvPrefix(line.cpvPrefix());
            entity.setBudgetYear(year);
            entity.setSortOrder(order++);
            virtual.add(entity);
        }
        return virtual;
    }

    /** Scale vs 2025 reference indicative plan (1.0 = full ~18M € framework). */
    public static BigDecimal scaleFactor(int year) {
        BigDecimal scale = scaleForYear(year);
        return scale != null ? scale : BigDecimal.ONE;
    }

    private static BigDecimal scaleForYear(int year) {
        if (year >= MonitorBudgetConfig.budgetYear()) {
            return BigDecimal.ONE;
        }
        Optional<MonitorOfficialBudgetEntity> yearBudget = MonitorOfficialBudgetSeed.build(year);
        Optional<MonitorOfficialBudgetEntity> refBudget = MonitorOfficialBudgetSeed.build(REFERENCE_YEAR);
        if (yearBudget.isEmpty() || refBudget.isEmpty()) {
            return null;
        }
        BigDecimal adopted = yearBudget.get().getAdoptedTotalBgn();
        BigDecimal refAdopted = refBudget.get().getAdoptedTotalBgn();
        if (adopted.signum() <= 0 || refAdopted.signum() <= 0) {
            return null;
        }
        return adopted.divide(refAdopted, 6, RoundingMode.HALF_UP);
    }
}

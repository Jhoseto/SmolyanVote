package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorBudgetLineEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorBudgetLineRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorBudgetLineDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorBudgetLineRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin CRUD for planned municipal budget lines. Seeds sensible defaults on first use so the
 * public /monitor/budget page always has data, then lets admins edit them without a redeploy.
 */
@Service
public class MonitorBudgetAdminService {

    private final MonitorBudgetLineRepository budgetLineRepository;
    private final MonitorContractRepository contractRepository;

    public MonitorBudgetAdminService(
            MonitorBudgetLineRepository budgetLineRepository,
            MonitorContractRepository contractRepository) {
        this.budgetLineRepository = budgetLineRepository;
        this.contractRepository = contractRepository;
    }

    @Transactional
    public List<MonitorBudgetLineEntity> getOrSeedLines(int year) {
        List<MonitorBudgetLineEntity> lines = budgetLineRepository.findByBudgetYearOrderBySortOrderAsc(year);
        if (lines.isEmpty() && year == MonitorBudgetConfig.budgetYear()) {
            lines = seedDefaults(year);
        }
        if (lines.isEmpty() && year == MonitorBudgetConfig.budgetYear()) {
            lines = virtualDefaults(year);
        }
        if (lines.isEmpty() && MonitorBudgetPlanSeed.supportsIndicativePlan(year)) {
            lines = MonitorBudgetPlanSeed.virtualScaledLines(year);
        }
        if (!lines.isEmpty()) {
            backfillZeroPlannedFromConfig(lines);
        }
        return lines;
    }

    /** Category labels for charts — no auto-seeded plan amounts for arbitrary years. */
    @Transactional(readOnly = true)
    public List<MonitorBudgetLineEntity> getCategoryTemplate() {
        return virtualDefaults(MonitorBudgetConfig.budgetYear());
    }

    /** In-memory fallback when DB seed fails (e.g. first request before migration). */
    private List<MonitorBudgetLineEntity> virtualDefaults(int year) {
        List<MonitorBudgetLineEntity> virtual = new ArrayList<>();
        int order = 0;
        for (MonitorBudgetConfig.BudgetLine line : MonitorBudgetConfig.PLANNED_LINES) {
            MonitorBudgetLineEntity entity = new MonitorBudgetLineEntity();
            entity.setCategoryKey(line.id());
            entity.setLabel(line.label());
            entity.setPlannedEur(line.plannedEur());
            entity.setCpvPrefix(line.cpvPrefix());
            entity.setBudgetYear(year);
            entity.setSortOrder(order++);
            virtual.add(entity);
        }
        return virtual;
    }

    private List<MonitorBudgetLineEntity> seedDefaults(int year) {
        int order = 0;
        for (MonitorBudgetConfig.BudgetLine line : MonitorBudgetConfig.PLANNED_LINES) {
            MonitorBudgetLineEntity entity = new MonitorBudgetLineEntity();
            entity.setCategoryKey(line.id());
            entity.setLabel(line.label());
            entity.setPlannedEur(line.plannedEur());
            entity.setCpvPrefix(line.cpvPrefix());
            entity.setBudgetYear(year);
            entity.setSortOrder(order++);
            budgetLineRepository.save(entity);
        }
        return budgetLineRepository.findByBudgetYearOrderBySortOrderAsc(year);
    }

    private void backfillZeroPlannedFromConfig(List<MonitorBudgetLineEntity> lines) {
        if (lines.isEmpty()) {
            return;
        }
        Map<String, MonitorBudgetConfig.BudgetLine> defaults = new HashMap<>();
        for (MonitorBudgetConfig.BudgetLine line : MonitorBudgetConfig.PLANNED_LINES) {
            defaults.put(line.id(), line);
        }
        BigDecimal scale = MonitorBudgetPlanSeed.scaleFactor(lines.get(0).getBudgetYear());
        for (MonitorBudgetLineEntity entity : lines) {
            if (entity.getPlannedEur() != null && entity.getPlannedEur().signum() > 0) {
                continue;
            }
            MonitorBudgetConfig.BudgetLine def = defaults.get(entity.getCategoryKey());
            if (def != null && def.plannedEur() != null) {
                entity.setPlannedEur(def.plannedEur().multiply(scale).setScale(2, RoundingMode.HALF_UP));
                if (entity.getLabel() == null || entity.getLabel().isBlank()) {
                    entity.setLabel(def.label());
                }
                if (entity.getId() != null) {
                    budgetLineRepository.save(entity);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<MonitorBudgetLineDTO> list(int year) {
        Map<String, BigDecimal> executedByCategory = computeExecutedByCategory(year);
        return getOrSeedLinesReadOnly(year).stream()
                .map(l -> toDto(l, executedByCategory.getOrDefault(l.getCategoryKey(), BigDecimal.ZERO)))
                .toList();
    }

    private List<MonitorBudgetLineEntity> getOrSeedLinesReadOnly(int year) {
        List<MonitorBudgetLineEntity> lines = budgetLineRepository.findByBudgetYearOrderBySortOrderAsc(year);
        return lines.isEmpty() ? getOrSeedLines(year) : lines;
    }

    @Transactional
    public MonitorBudgetLineDTO create(MonitorBudgetLineRequest req) {
        if (req.categoryKey() == null || req.categoryKey().isBlank()) {
            throw new IllegalArgumentException("Категорията (key) е задължителна");
        }
        if (req.label() == null || req.label().isBlank()) {
            throw new IllegalArgumentException("Етикетът е задължителен");
        }
        MonitorBudgetLineEntity entity = new MonitorBudgetLineEntity();
        entity.setCategoryKey(req.categoryKey().trim());
        entity.setLabel(req.label().trim());
        entity.setPlannedEur(req.plannedEur() != null ? req.plannedEur() : BigDecimal.ZERO);
        entity.setCpvPrefix(req.cpvPrefix() != null && !req.cpvPrefix().isBlank() ? req.cpvPrefix().trim() : null);
        int year = req.budgetYear() != null ? req.budgetYear() : MonitorBudgetConfig.BUDGET_YEAR;
        entity.setBudgetYear(year);
        entity.setSortOrder(req.sortOrder() != null ? req.sortOrder() : (int) budgetLineRepository.countByBudgetYear(year));
        MonitorBudgetLineEntity saved = budgetLineRepository.save(entity);
        return toDto(saved, computeExecutedByCategory(year).getOrDefault(saved.getCategoryKey(), BigDecimal.ZERO));
    }

    @Transactional
    public MonitorBudgetLineDTO update(Long id, MonitorBudgetLineRequest req) {
        MonitorBudgetLineEntity entity = budgetLineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Бюджетният ред не е намерен"));
        if (req.categoryKey() != null && !req.categoryKey().isBlank()) {
            entity.setCategoryKey(req.categoryKey().trim());
        }
        if (req.label() != null && !req.label().isBlank()) {
            entity.setLabel(req.label().trim());
        }
        if (req.plannedEur() != null) {
            entity.setPlannedEur(req.plannedEur());
        }
        entity.setCpvPrefix(req.cpvPrefix() != null && !req.cpvPrefix().isBlank() ? req.cpvPrefix().trim() : null);
        if (req.sortOrder() != null) {
            entity.setSortOrder(req.sortOrder());
        }
        MonitorBudgetLineEntity saved = budgetLineRepository.save(entity);
        return toDto(saved, computeExecutedByCategory(saved.getBudgetYear()).getOrDefault(saved.getCategoryKey(), BigDecimal.ZERO));
    }

    @Transactional
    public void delete(Long id) {
        if (!budgetLineRepository.existsById(id)) {
            throw new IllegalArgumentException("Бюджетният ред не е намерен");
        }
        budgetLineRepository.deleteById(id);
    }

    private Map<String, BigDecimal> computeExecutedByCategory(int year) {
        Map<String, BigDecimal> executedByCategory = new HashMap<>();
        contractRepository.findAll().stream()
                .filter(c -> MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(c.getAuthorityEik()))
                .filter(c -> c.getAmountEur() != null && c.getAmountEur().signum() > 0)
                .filter(c -> MonitorContractDates.inCalendarYear(c, year))
                .forEach(c -> {
                    String category = MonitorBudgetConfig.categoryForCpv(c.getSectorCode());
                    executedByCategory.merge(category, c.getAmountEur(), BigDecimal::add);
                });
        return executedByCategory;
    }

    private MonitorBudgetLineDTO toDto(MonitorBudgetLineEntity l, BigDecimal executed) {
        return new MonitorBudgetLineDTO(
                l.getId(),
                l.getCategoryKey(),
                l.getLabel(),
                l.getPlannedEur(),
                executed.setScale(2, RoundingMode.HALF_UP),
                l.getCpvPrefix(),
                l.getBudgetYear(),
                l.getSortOrder());
    }
}

package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorBudgetLineEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorCouncilorEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCouncilorRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorBudgetDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCouncilorCardDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorEuFundsDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorOfficialBudgetDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorOfficialBudgetTrendPointDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@Service
public class MonitorDeepDataService {

    private static final String ZPKONPI_PORTAL = "https://app.court.bg/portal/";

    private final MonitorContractRepository contractRepository;
    private final MonitorCouncilorRepository councilorRepository;
    private final MonitorBudgetAdminService budgetAdminService;
    private final MonitorOfficialBudgetService officialBudgetService;
    private final SigmaBudgetAggregationService sigmaBudgetAggregationService;

    public MonitorDeepDataService(
            MonitorContractRepository contractRepository,
            MonitorCouncilorRepository councilorRepository,
            MonitorBudgetAdminService budgetAdminService,
            MonitorOfficialBudgetService officialBudgetService,
            SigmaBudgetAggregationService sigmaBudgetAggregationService) {
        this.contractRepository = contractRepository;
        this.councilorRepository = councilorRepository;
        this.budgetAdminService = budgetAdminService;
        this.officialBudgetService = officialBudgetService;
        this.sigmaBudgetAggregationService = sigmaBudgetAggregationService;
    }

    @Transactional(readOnly = true)
    public List<MonitorOfficialBudgetTrendPointDTO> getOfficialBudgetTrend() {
        return officialBudgetService.getTrend();
    }

    /**
     * Spend per budget category for the selected municipality.
     *
     * <p>Planned lines are curated for Община Смолян only, so for the other municipalities
     * the plan column is dropped and the page shows executed spend alone — comparing their
     * spending against Smolyan's plan would be meaningless.
     */
    @Transactional
    public MonitorBudgetDTO getBudget(MonitorScope scope, Integer year, Integer yearFrom, Integer yearTo) {
        String authorityFilter = scope.authorityFilter();
        boolean wholeOblast = scope.isWholeOblast();
        boolean plannedAvailable = wholeOblast
                || MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(scope.authorityEik());
        String municipalityLabel = scope.label();

        List<Integer> availableYears = collectAvailableYears(authorityFilter);
        int[] resolved = resolveYearRange(year, yearFrom, yearTo, authorityFilter, availableYears);
        int fromYear = resolved[0];
        int toYear = resolved[1];

        List<MonitorContractEntity> contracts = contractRepository.findAllInScope(authorityFilter).stream()
                .filter(c -> c.getAmountEur() != null && c.getAmountEur().signum() > 0)
                .filter(c -> MonitorContractDates.inYearRange(c, fromYear, toYear))
                .toList();

        Map<String, BigDecimal> executedByCategory = new HashMap<>();
        for (MonitorContractEntity c : contracts) {
            String category = MonitorBudgetConfig.categoryForCpv(c.getSectorCode());
            executedByCategory.merge(category, c.getAmountEur(), BigDecimal::add);
        }

        BigDecimal totalExecuted = executedByCategory.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        boolean singleYear = fromYear == toYear;
        boolean showPlan = plannedAvailable
                && singleYear
                && MonitorBudgetPlanSeed.supportsIndicativePlan(fromYear);

        Map<String, BigDecimal> plannedByCategory = showPlan
                ? plannedByCategoryForYear(fromYear)
                : Map.of();
        List<MonitorBudgetLineEntity> templateLines = budgetAdminService.getCategoryTemplate();
        List<MonitorBudgetDTO.BudgetRowDTO> rows = new ArrayList<>();
        BigDecimal totalPlanned = BigDecimal.ZERO;

        for (MonitorBudgetLineEntity line : templateLines) {
            BigDecimal executed = executedByCategory.getOrDefault(line.getCategoryKey(), BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal planned = showPlan
                    ? plannedByCategory.getOrDefault(line.getCategoryKey(), BigDecimal.ZERO)
                    : BigDecimal.ZERO;
            totalPlanned = totalPlanned.add(planned);
            double pct = planned.signum() > 0
                    ? executed.multiply(BigDecimal.valueOf(100)).divide(planned, 1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            rows.add(new MonitorBudgetDTO.BudgetRowDTO(line.getCategoryKey(), line.getLabel(), planned, executed, pct));
        }

        String note = buildBudgetNote(fromYear, toYear, wholeOblast, showPlan, totalExecuted, contracts.size());
        note = appendSigmaProcurementNote(note, scope, fromYear, toYear, totalExecuted);

        MonitorOfficialBudgetDTO officialBudget = resolveOfficialBudget(scope, fromYear, toYear);

        return new MonitorBudgetDTO(
                fromYear,
                toYear,
                availableYears,
                municipalityLabel,
                totalPlanned,
                totalExecuted,
                rows,
                plannedAvailable ? "https://smolyan.bg" : MonitorRegionalConfig.SIGMA_BASE_URL,
                showPlan,
                contracts.size(),
                MonitorBudgetConfig.DATA_BASIS,
                note,
                officialBudget);
    }

    private MonitorOfficialBudgetDTO resolveOfficialBudget(MonitorScope scope, int fromYear, int toYear) {
        if (fromYear != toYear) {
            return null;
        }
        if (!scope.isWholeOblast() && !MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(scope.authorityEik())) {
            return null;
        }
        return officialBudgetService.getOrSeedForYear(fromYear);
    }

    private Map<String, BigDecimal> plannedByCategoryForYear(int year) {
        Map<String, BigDecimal> plannedByCategory = new HashMap<>();
        for (MonitorBudgetLineEntity line : budgetAdminService.getOrSeedLines(year)) {
            if (line.getPlannedEur() != null && line.getPlannedEur().signum() > 0) {
                plannedByCategory.put(line.getCategoryKey(), line.getPlannedEur());
            }
        }
        return plannedByCategory;
    }

    private int[] resolveYearRange(
            Integer year,
            Integer yearFrom,
            Integer yearTo,
            String authorityFilter,
            List<Integer> availableYears) {
        if (year != null) {
            return new int[] { year, year };
        }
        if (yearFrom != null && yearTo != null) {
            int from = Math.min(yearFrom, yearTo);
            int to = Math.max(yearFrom, yearTo);
            return new int[] { from, to };
        }
        if (yearFrom != null) {
            return new int[] { yearFrom, yearFrom };
        }
        if (yearTo != null) {
            return new int[] { yearTo, yearTo };
        }
        int auto = resolveBudgetYear(authorityFilter, availableYears);
        return new int[] { auto, auto };
    }

    private static final int MIN_SELECTABLE_BUDGET_YEAR = 2010;
    private static final int SELECTABLE_YEAR_LOOKBACK = 12;

    private List<Integer> collectAvailableYears(String authorityFilter) {
        TreeSet<Integer> years = new TreeSet<>((a, b) -> Integer.compare(b, a));
        int current = MonitorBudgetConfig.budgetYear();
        int earliestFromData = current;

        for (Integer y : contractRepository.findYearsWithSpend(authorityFilter)) {
            if (y != null && y >= MIN_SELECTABLE_BUDGET_YEAR && y <= current + 1) {
                years.add(y);
                earliestFromData = Math.min(earliestFromData, y);
            }
        }

        for (MonitorContractEntity c : contractRepository.findAllInScope(authorityFilter)) {
            if (c.getAmountEur() == null || c.getAmountEur().signum() <= 0) {
                continue;
            }
            int y = MonitorContractDates.budgetSpendYear(c);
            if (y >= MIN_SELECTABLE_BUDGET_YEAR && y <= current + 1) {
                years.add(y);
                earliestFromData = Math.min(earliestFromData, y);
            }
        }

        int rangeStart = Math.min(earliestFromData, current - SELECTABLE_YEAR_LOOKBACK);
        rangeStart = Math.max(rangeStart, MIN_SELECTABLE_BUDGET_YEAR);
        for (int y = current; y >= rangeStart; y--) {
            years.add(y);
        }

        return new ArrayList<>(years);
    }

    private int resolveBudgetYear(String authorityFilter, List<Integer> availableYears) {
        int current = MonitorBudgetConfig.budgetYear();
        Map<Integer, BigDecimal> spendByYear = new HashMap<>();
        for (MonitorContractEntity c : contractRepository.findAllInScope(authorityFilter)) {
            if (c.getAmountEur() == null || c.getAmountEur().signum() <= 0) {
                continue;
            }
            int y = MonitorContractDates.budgetSpendYear(c);
            if (y > 0) {
                spendByYear.merge(y, c.getAmountEur(), BigDecimal::add);
            }
        }
        BigDecimal currentSpend = spendByYear.getOrDefault(current, BigDecimal.ZERO);
        if (currentSpend.signum() > 0) {
            return current;
        }
        return spendByYear.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(availableYears.isEmpty() ? current : availableYears.get(0));
    }

    private static String buildBudgetNote(
            int yearFrom,
            int yearTo,
            boolean wholeOblast,
            boolean showPlan,
            BigDecimal totalExecuted,
            int contractCount) {
        String period = yearFrom == yearTo
                ? yearFrom + " г."
                : yearFrom + "–" + yearTo + " г.";
        if (contractCount == 0) {
            return "Няма договори със стойност и известна дата за " + period + " в избрания обхват. "
                    + "Пуснете SIGMA import от Admin → Monitor или изберете друга година.";
        }
        if (!showPlan && yearFrom == yearTo) {
            return contractCount + " договора за " + period + " ("
                    + formatMillions(totalExecuted)
                    + "). Индикативен CPV план е наличен за Община Смолян "
                    + MonitorOfficialBudgetSeed.FIRST_YEAR + "–" + MonitorBudgetConfig.budgetYear()
                    + " г.; за други общини — само изпълнение.";
        }
        if (wholeOblast && showPlan) {
            return "Планът е индикативен за Община Смолян; изпълнението е сумирано за цялата област за "
                    + period + " (" + contractCount + " договора, "
                    + formatMillions(totalExecuted) + ").";
        }
        if (!showPlan) {
            return contractCount + " договора за периода " + period + " — "
                    + formatMillions(totalExecuted)
                    + ". Без сравнение с план (многогодишен период или община без индикативна рамка).";
        }
        return contractCount + " договора за " + period + ", "
                + formatMillions(totalExecuted)
                + " изпълнение по CPV сектори спрямо индикативен план (мащабиран по приет ObS бюджет за "
                + yearFrom + " г., не официален общински бюджет).";
    }

    private String appendSigmaProcurementNote(
            String note,
            MonitorScope scope,
            int fromYear,
            int toYear,
            BigDecimal localTotal) {
        if (fromYear != toYear) {
            return note;
        }
        String authorityEik = scope.isWholeOblast()
                ? MonitorRegionalConfig.SMOLYAN_CITY_EIK
                : scope.authorityEik();
        if (authorityEik == null || !MonitorRegionalConfig.isRegionalAuthority(authorityEik)) {
            return note;
        }
        try {
            SigmaBudgetAggregationService.YearAggregation sigma =
                    sigmaBudgetAggregationService.aggregateYear(authorityEik, fromYear, false);
            if (sigma.contractCount() == 0) {
                return note;
            }
            String sigmaLine = " SIGMA CSV (" + sigma.contractCount() + " дог., "
                    + formatMillions(sigma.totalEur()) + ", кеш "
                    + (sigma.cacheRefreshedAt() != null ? sigma.cacheRefreshedAt() : "—") + ").";
            if (localTotal != null && sigma.totalEur() != null
                    && localTotal.subtract(sigma.totalEur()).abs().compareTo(new BigDecimal("100")) > 0) {
                sigmaLine += " Локална база: " + formatMillions(localTotal) + ".";
            }
            return note + sigmaLine;
        } catch (Exception ex) {
            return note;
        }
    }

    private static String formatMillions(BigDecimal eur) {
        if (eur == null || eur.signum() == 0) {
            return "0 €";
        }
        if (eur.compareTo(new BigDecimal("1000000")) >= 0) {
            return eur.divide(new BigDecimal("1000000"), 1, RoundingMode.HALF_UP) + " млн €";
        }
        return eur.setScale(0, RoundingMode.HALF_UP) + " €";
    }

    @Transactional(readOnly = true)
    public MonitorEuFundsDTO getEuFunds(MonitorScope scope) {
        List<MonitorContractEntity> euContracts = contractRepository.findAllInScope(scope.authorityFilter()).stream()
                .filter(MonitorContractEntity::isEuFunded)
                .filter(c -> MonitorRegionalConfig.isRegionalAuthority(c.getAuthorityEik()))
                .filter(c -> c.getAmountEur() != null)
                .sorted((a, b) -> b.getAmountEur().compareTo(a.getAmountEur()))
                .limit(30)
                .toList();

        BigDecimal total = euContracts.stream()
                .map(MonitorContractEntity::getAmountEur)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<MonitorEuFundsDTO.EuProjectRowDTO> rows = euContracts.stream()
                .map(c -> new MonitorEuFundsDTO.EuProjectRowDTO(
                        c.getId(),
                        truncate(c.getSubject(), 120),
                        MonitorRegionalConfig.labelForAuthority(c.getAuthorityEik(), c.getAuthorityName()),
                        c.getContractorName(),
                        c.getAmountEur(),
                        c.getSignedAt(),
                        c.getSourceUrl()))
                .toList();

        return new MonitorEuFundsDTO(
                total.setScale(2, RoundingMode.HALF_UP),
                rows.size(),
                rows,
                "Данни от SIGMA/EOP (договори с eu_funded=1). Пълна ISUN интеграция — планирана за v2.");
    }

    /**
     * Councillor profiles are synced from smolyan.bg, so they describe ОбС Смолян. The other
     * municipalities have no such source — an empty list beats showing somebody else's council.
     */
    @Transactional(readOnly = true)
    public List<MonitorCouncilorCardDTO> getCouncilors(MonitorScope scope) {
        List<MonitorCouncilorEntity> rows = scope.isWholeOblast()
                ? councilorRepository.findAllByOrderByFullNameAsc()
                : councilorRepository.findByAuthorityEikOrderByFullNameAsc(scope.authorityEik());
        return rows.stream()
                .map(c -> new MonitorCouncilorCardDTO(
                        c.getId(),
                        c.getFullName(),
                        c.getRoleLabel(),
                        c.getParty(),
                        c.getMandatePeriod(),
                        c.isZpokonpiChecked(),
                        c.getZpokonpiNote(),
                        c.getZpokonpiStatus(),
                        c.getZpokonpiRegisterUrl(),
                        c.getSourceUrl(),
                        ZPKONPI_PORTAL))
                .sorted((a, b) -> MonitorCouncilorRoleOrder.compare(
                        a.roleLabel(), b.roleLabel(), a.fullName(), b.fullName()))
                .toList();
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        String t = value.trim();
        return t.length() <= max ? t : t.substring(0, max - 3) + "...";
    }
}

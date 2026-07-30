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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MonitorDeepDataService {

    private static final String ZPKONPI_PORTAL = "https://app.court.bg/portal/";

    private final MonitorContractRepository contractRepository;
    private final MonitorCouncilorRepository councilorRepository;
    private final MonitorBudgetAdminService budgetAdminService;

    public MonitorDeepDataService(
            MonitorContractRepository contractRepository,
            MonitorCouncilorRepository councilorRepository,
            MonitorBudgetAdminService budgetAdminService) {
        this.contractRepository = contractRepository;
        this.councilorRepository = councilorRepository;
        this.budgetAdminService = budgetAdminService;
    }

    @Transactional
    public MonitorBudgetDTO getSmolyanBudget() {
        int year = MonitorBudgetConfig.BUDGET_YEAR;
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to = LocalDate.of(year, 12, 31);

        List<MonitorContractEntity> contracts = contractRepository.findAll().stream()
                .filter(c -> MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(c.getAuthorityEik()))
                .filter(c -> c.getSignedAt() != null && !c.getSignedAt().isBefore(from) && !c.getSignedAt().isAfter(to))
                .filter(c -> c.getAmountEur() != null)
                .toList();

        Map<String, BigDecimal> executedByCategory = new HashMap<>();
        for (MonitorContractEntity c : contracts) {
            String category = mapCpvToCategory(c.getSectorCode());
            executedByCategory.merge(category, c.getAmountEur(), BigDecimal::add);
        }

        List<MonitorBudgetLineEntity> lines = budgetAdminService.getOrSeedLines(year);
        List<MonitorBudgetDTO.BudgetRowDTO> rows = new ArrayList<>();
        BigDecimal totalPlanned = BigDecimal.ZERO;
        BigDecimal totalExecuted = BigDecimal.ZERO;

        for (MonitorBudgetLineEntity line : lines) {
            BigDecimal executed = executedByCategory.getOrDefault(line.getCategoryKey(), BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal planned = line.getPlannedEur() != null ? line.getPlannedEur() : BigDecimal.ZERO;
            totalPlanned = totalPlanned.add(planned);
            totalExecuted = totalExecuted.add(executed);
            double pct = planned.signum() > 0
                    ? executed.multiply(BigDecimal.valueOf(100)).divide(planned, 1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            rows.add(new MonitorBudgetDTO.BudgetRowDTO(line.getCategoryKey(), line.getLabel(), planned, executed, pct));
        }

        return new MonitorBudgetDTO(
                year,
                MonitorRegionalConfig.AUTHORITY_LABELS.get(MonitorRegionalConfig.SMOLYAN_CITY_EIK),
                totalPlanned,
                totalExecuted,
                rows,
                "https://smolyan.bg");
    }

    @Transactional(readOnly = true)
    public MonitorEuFundsDTO getEuFunds() {
        List<MonitorContractEntity> euContracts = contractRepository.findAll().stream()
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

    @Transactional(readOnly = true)
    public List<MonitorCouncilorCardDTO> getCouncilors() {
        return councilorRepository.findAll().stream()
                .map(c -> new MonitorCouncilorCardDTO(
                        c.getId(),
                        c.getFullName(),
                        c.getRoleLabel(),
                        c.getParty(),
                        c.getMandatePeriod(),
                        c.isZpokonpiChecked(),
                        c.getZpokonpiNote(),
                        c.getSourceUrl(),
                        ZPKONPI_PORTAL))
                .toList();
    }

    private static String mapCpvToCategory(String sectorCode) {
        if (sectorCode == null || sectorCode.length() < 2) {
            return "administration";
        }
        String prefix = sectorCode.substring(0, 2);
        return MonitorBudgetConfig.CPV_PREFIX_TO_CATEGORY.getOrDefault(prefix, "administration");
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        String t = value.trim();
        return t.length() <= max ? t : t.substring(0, max - 3) + "...";
    }
}

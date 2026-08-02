package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorOfficialBudgetEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorOfficialBudgetLineEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorOfficialBudgetRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCitizenAssessmentDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorOfficialBudgetDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorOfficialBudgetRequest;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorOfficialBudgetTrendPointDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MonitorOfficialBudgetService {

    /** @deprecated Use {@link MonitorCurrencyUtil#BGN_PER_EUR}. */
    @Deprecated
    public static final BigDecimal BGN_PER_EUR = MonitorCurrencyUtil.BGN_PER_EUR;

    private final MonitorOfficialBudgetRepository repository;
    private final ObjectMapper objectMapper;

    public MonitorOfficialBudgetService(
            MonitorOfficialBudgetRepository repository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Optional<MonitorOfficialBudgetDTO> getForYear(String authorityEik, int year) {
        if (authorityEik == null || !MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(authorityEik)) {
            return Optional.empty();
        }
        return repository.findByAuthorityEikAndBudgetYear(authorityEik, year).map(this::toDto);
    }

    @Transactional
    public MonitorOfficialBudgetDTO getOrSeedForYear(int year) {
        String eik = MonitorRegionalConfig.SMOLYAN_CITY_EIK;
        return repository.findByAuthorityEikAndBudgetYear(eik, year)
                .map(this::toDto)
                .orElseGet(() -> seedYear(year).map(this::toDto).orElse(null));
    }

    @Transactional(readOnly = true)
    public List<MonitorOfficialBudgetDTO> listAll() {
        return repository.findByAuthorityEikOrderByBudgetYearDesc(MonitorRegionalConfig.SMOLYAN_CITY_EIK).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonitorOfficialBudgetTrendPointDTO> getTrend() {
        String eik = MonitorRegionalConfig.SMOLYAN_CITY_EIK;
        List<MonitorOfficialBudgetEntity> rows = repository.findByAuthorityEikOrderByBudgetYearDesc(eik).stream()
                .filter(e -> e.getBudgetYear() >= MonitorOfficialBudgetSeed.FIRST_YEAR
                        && e.getBudgetYear() <= MonitorOfficialBudgetSeed.LAST_YEAR)
                .sorted((a, b) -> Integer.compare(a.getBudgetYear(), b.getBudgetYear()))
                .toList();

        List<MonitorOfficialBudgetTrendPointDTO> points = new ArrayList<>();
        BigDecimal previousAdopted = null;
        for (MonitorOfficialBudgetEntity entity : rows) {
            Double yoy = null;
            if (previousAdopted != null && previousAdopted.signum() > 0) {
                yoy = entity.getAdoptedTotalBgn()
                        .subtract(previousAdopted)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(previousAdopted, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            points.add(new MonitorOfficialBudgetTrendPointDTO(
                    entity.getBudgetYear(),
                    entity.getAdoptedTotalBgn(),
                    entity.getExecutedTotalBgn(),
                    percent(entity.getExecutedTotalBgn(), entity.getAdoptedTotalBgn()),
                    yoy));
            previousAdopted = entity.getAdoptedTotalBgn();
        }
        return points;
    }

    @Transactional
    public MonitorOfficialBudgetDTO upsert(MonitorOfficialBudgetRequest request) {
        if (request.budgetYear() == null) {
            throw new IllegalArgumentException("budgetYear е задължителна");
        }
        if (request.adoptedTotalBgn() == null || request.adoptedTotalBgn().signum() <= 0) {
            throw new IllegalArgumentException("adoptedTotalBgn трябва да е положителна сума");
        }
        String eik = MonitorRegionalConfig.SMOLYAN_CITY_EIK;
        int year = request.budgetYear();
        MonitorOfficialBudgetEntity entity = repository.findByAuthorityEikAndBudgetYear(eik, year)
                .orElseGet(MonitorOfficialBudgetEntity::new);
        entity.setAuthorityEik(eik);
        entity.setBudgetYear(year);
        entity.setAdoptedTotalBgn(request.adoptedTotalBgn().setScale(2, RoundingMode.HALF_UP));
        entity.setExecutedTotalBgn(scaleOrNull(request.executedTotalBgn()));
        entity.setSourceUrl(trimToNull(request.sourceUrl()));
        entity.setSourceTitle(trimToNull(request.sourceTitle()));
        entity.setExecutionAsOf(request.executionAsOf());
        entity.setNotes(trimToNull(request.notes()));

        entity.getLines().clear();
        if (request.lines() != null) {
            int order = 0;
            for (MonitorOfficialBudgetRequest.OfficialBudgetLineRequest line : request.lines()) {
                if (line.label() == null || line.label().isBlank()) {
                    continue;
                }
                MonitorOfficialBudgetLineEntity row = new MonitorOfficialBudgetLineEntity();
                row.setCategoryKey(line.categoryKey() != null && !line.categoryKey().isBlank()
                        ? line.categoryKey().trim()
                        : "line-" + order);
                row.setLabel(line.label().trim());
                row.setAdoptedBgn(line.adoptedBgn() != null
                        ? line.adoptedBgn().setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO);
                row.setExecutedBgn(scaleOrNull(line.executedBgn()));
                row.setSortOrder(line.sortOrder() != null ? line.sortOrder() : order);
                entity.addLine(row);
                order++;
            }
        }

        return toDto(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Официалният бюджет не е намерен");
        }
        repository.deleteById(id);
    }

    private Optional<MonitorOfficialBudgetEntity> seedYear(int year) {
        return MonitorOfficialBudgetSeed.build(year).map(repository::save);
    }

    private MonitorOfficialBudgetDTO toDto(MonitorOfficialBudgetEntity entity) {
        List<MonitorOfficialBudgetDTO.OfficialBudgetRowDTO> rows = entity.getLines().stream()
                .map(line -> new MonitorOfficialBudgetDTO.OfficialBudgetRowDTO(
                        line.getCategoryKey(),
                        line.getLabel(),
                        line.getAdoptedBgn(),
                        bgnToEur(line.getAdoptedBgn()),
                        line.getExecutedBgn(),
                        bgnToEur(line.getExecutedBgn()),
                        percent(line.getExecutedBgn(), line.getAdoptedBgn())))
                .toList();

        Double totalPct = percent(entity.getExecutedTotalBgn(), entity.getAdoptedTotalBgn());
        String note = entity.getNotes();
        if (entity.getExecutedTotalBgn() == null) {
            note = (note != null ? note + " " : "")
                    + "Усвоението (отчетено изпълнение) все още не е въведено — попълва се от Admin след публикуване на отчета.";
        }

        return new MonitorOfficialBudgetDTO(
                entity.getBudgetYear(),
                MonitorRegionalConfig.labelForAuthority(entity.getAuthorityEik(), null),
                entity.getAdoptedTotalBgn(),
                bgnToEur(entity.getAdoptedTotalBgn()),
                entity.getExecutedTotalBgn(),
                bgnToEur(entity.getExecutedTotalBgn()),
                totalPct,
                entity.getExecutionAsOf(),
                rows,
                entity.getSourceUrl(),
                entity.getSourceTitle(),
                note,
                parseCitizenAssessment(entity.getCitizenAssessmentJson()));
    }

    private MonitorCitizenAssessmentDTO parseCitizenAssessment(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, MonitorCitizenAssessmentDTO.class);
        } catch (Exception ex) {
            return null;
        }
    }

    public static BigDecimal bgnToEur(BigDecimal bgn) {
        return MonitorCurrencyUtil.bgnToEur(bgn);
    }

    private static Double percent(BigDecimal executed, BigDecimal adopted) {
        if (executed == null || adopted == null || adopted.signum() <= 0) {
            return null;
        }
        return executed.multiply(BigDecimal.valueOf(100))
                .divide(adopted, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private static BigDecimal scaleOrNull(BigDecimal value) {
        return value != null ? value.setScale(2, RoundingMode.HALF_UP) : null;
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

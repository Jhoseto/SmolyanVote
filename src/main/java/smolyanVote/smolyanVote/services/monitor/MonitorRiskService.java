package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Regional risk scoring — ported from SIGMA riskLogic.ts.
 */
@Service
public class MonitorRiskService {

    public static final int FLAG_THRESHOLD = 40;
    private static final BigDecimal FRAGMENTATION_THRESHOLD_EUR = new BigDecimal("143000");
    private static final BigDecimal LARGE_CONTRACT_EUR = new BigDecimal("100000");
    private static final BigDecimal MEDIAN_MULTIPLIER = new BigDecimal("5");
    private static final double REPEAT_WINNER_SHARE = 0.5;
    private static final BigDecimal ABOVE_ESTIMATE_MULTIPLIER = new BigDecimal("1.10");
    private static final BigDecimal AMENDMENT_GROWTH_MULTIPLIER = new BigDecimal("1.20");
    private static final int NEW_COMPANY_MONTHS = 6;

    private static final Map<String, String> TOOLTIPS = Map.ofEntries(
            Map.entry("SINGLE_BID", "Получена е само една оферта — липса на конкуренция."),
            Map.entry("ABOVE_TYPICAL", "Стойност ≥ 5× медианата за същия CPV сектор в региона."),
            Map.entry("REPEAT_WINNER", "Фирмата печели >50% от договорите в сектора при регионални възложители."),
            Map.entry("EU_LOW_COMPETITION", "ЕС финансиране с ≤1 оферта."),
            Map.entry("FRAGMENTATION", "Множество договори под прага за една фирма и CPV за 90 дни."),
            Map.entry("LARGE_SINGLE_BID", "Голям договор (>100k EUR) с единствен оферент."),
            Map.entry("ABOVE_ESTIMATE", "Подписана стойност ≥ 10% над прогнозната от обявлението."),
            Map.entry("AMENDMENT_GROWTH", "Стойността е нараснала с ≥ 20% чрез анекси спрямо подписването."),
            Map.entry("NEW_COMPANY_LARGE_CONTRACT", "Фирмата е регистрирана до 6 месеца преди подписването на голям договор (>100k EUR)."),
            Map.entry("SIGNED_BEFORE_PUBLICATION", "Датата на подписване предхожда датата на публикуване на обявлението — възможна грешка в данните или нередност."));

    private final MonitorContractRepository contractRepository;
    private final MonitorCompanyRepository companyRepository;
    private final ObjectMapper objectMapper;

    public MonitorRiskService(
            MonitorContractRepository contractRepository,
            MonitorCompanyRepository companyRepository,
            ObjectMapper objectMapper) {
        this.contractRepository = contractRepository;
        this.companyRepository = companyRepository;
        this.objectMapper = objectMapper;
    }

    /** Scores one contract, reading the regional comparisons it needs straight from the database. */
    public void scoreContract(MonitorContractEntity contract) {
        scoreContract(contract, new RepositoryFacts());
    }

    private void scoreContract(MonitorContractEntity contract, RiskFacts facts) {
        List<RiskFlag> flags = new ArrayList<>();

        if (contract.getBidsReceived() != null && contract.getBidsReceived() == 1) {
            flags.add(new RiskFlag("SINGLE_BID", "Единствена оферта", 25));
            if (contract.getAmountEur() != null
                    && contract.getAmountEur().compareTo(LARGE_CONTRACT_EUR) >= 0) {
                flags.add(new RiskFlag("LARGE_SINGLE_BID", "Голям договор с един оферент", 20));
            }
        }

        if (contract.getAmountEur() != null && contract.getSectorCode() != null) {
            BigDecimal median = facts.medianForSector(contract.getSectorCode(), contract.getId());
            if (median != null && median.compareTo(BigDecimal.ZERO) > 0
                    && contract.getAmountEur().compareTo(median.multiply(MEDIAN_MULTIPLIER)) >= 0) {
                flags.add(new RiskFlag("ABOVE_TYPICAL", "Далеч над типичното за сектора в региона", 30));
            }
        }

        if (contract.getContractorEik() != null && contract.getSectorCode() != null) {
            double share = facts.winnerShareInSector(contract.getContractorEik(), contract.getSectorCode());
            if (share > REPEAT_WINNER_SHARE) {
                flags.add(new RiskFlag("REPEAT_WINNER", "Повтарящ се победител в сектора", 20));
            }
        }

        if (contract.isEuFunded() && contract.getBidsReceived() != null && contract.getBidsReceived() <= 1) {
            flags.add(new RiskFlag("EU_LOW_COMPETITION", "ЕС финансиране с ниска конкуренция", 15));
        }

        if (contract.getContractorEik() != null && contract.getSectorCode() != null && contract.getSignedAt() != null) {
            LocalDate since = contract.getSignedAt().minusDays(90);
            long fragments = facts.fragmentationCount(
                    contract.getContractorEik(), contract.getSectorCode(), since);
            if (fragments >= 3) {
                flags.add(new RiskFlag("FRAGMENTATION", "Възможно раздробяване на поръчки", 25));
            }
        }

        if (contract.getAmountEur() != null && contract.getEstimatedValueEur() != null
                && contract.getEstimatedValueEur().signum() > 0
                && contract.getAmountEur().compareTo(contract.getEstimatedValueEur().multiply(ABOVE_ESTIMATE_MULTIPLIER)) >= 0) {
            flags.add(new RiskFlag("ABOVE_ESTIMATE", "Подписан над прогнозната стойност", 20));
        }

        if (contract.getAmountEur() != null && contract.getOriginalAmountEur() != null
                && contract.getOriginalAmountEur().signum() > 0
                && contract.getAmountEur().compareTo(contract.getOriginalAmountEur()) > 0
                && contract.getAmountEur().compareTo(contract.getOriginalAmountEur().multiply(AMENDMENT_GROWTH_MULTIPLIER)) >= 0) {
            flags.add(new RiskFlag("AMENDMENT_GROWTH", "Ръст на стойността чрез анекси", 20));
        }

        if (contract.getSignedAt() != null && contract.getPublicationDate() != null
                && contract.getSignedAt().isBefore(contract.getPublicationDate())) {
            flags.add(new RiskFlag("SIGNED_BEFORE_PUBLICATION", "Подписан преди публикуване на обявлението", 30));
        }

        if (contract.getContractorEik() != null && contract.getSignedAt() != null
                && contract.getAmountEur() != null
                && contract.getAmountEur().compareTo(LARGE_CONTRACT_EUR) >= 0) {
            LocalDate foundedAt = facts.foundedAt(contract.getContractorEik().trim());
            if (foundedAt != null && !foundedAt.isAfter(contract.getSignedAt())
                    && Period.between(foundedAt, contract.getSignedAt()).toTotalMonths() < NEW_COMPANY_MONTHS) {
                flags.add(new RiskFlag("NEW_COMPANY_LARGE_CONTRACT", "Ново дружество с голяма поръчка", 20));
            }
        }

        int score = Math.min(100, flags.stream().mapToInt(RiskFlag::weight).sum());
        contract.setRiskScore(flags.isEmpty() ? 0 : score);
        contract.setRiskFlagsJson(serializeFlags(flags));
    }

    /**
     * Rescores the whole region. Every comparison is precomputed from a single pass over the
     * contracts — scoring row by row against the database costs thousands of queries.
     */
    public void scoreAllContracts() {
        List<MonitorContractEntity> all = contractRepository.findAll();
        RiskFacts facts = new InMemoryFacts(all, companyRepository.findAll());
        for (MonitorContractEntity contract : all) {
            scoreContract(contract, facts);
        }
        contractRepository.saveAll(all);
    }

    /** The regional comparisons a risk rule needs, so scoring works the same in bulk and one-off. */
    private interface RiskFacts {
        BigDecimal medianForSector(String sectorCode, Long excludeId);

        double winnerShareInSector(String contractorEik, String sectorCode);

        long fragmentationCount(String contractorEik, String sectorCode, LocalDate since);

        LocalDate foundedAt(String contractorEik);
    }

    private final class RepositoryFacts implements RiskFacts {

        @Override
        public BigDecimal medianForSector(String sectorCode, Long excludeId) {
            return median(contractRepository.findBySectorWithAmount(sectorCode), excludeId);
        }

        @Override
        public double winnerShareInSector(String contractorEik, String sectorCode) {
            return winnerShare(contractRepository.findBySectorWithAmount(sectorCode), contractorEik);
        }

        @Override
        public long fragmentationCount(String contractorEik, String sectorCode, LocalDate since) {
            return contractRepository.countFragmentationCandidates(
                    contractorEik, sectorCode, since, FRAGMENTATION_THRESHOLD_EUR);
        }

        @Override
        public LocalDate foundedAt(String contractorEik) {
            return companyRepository.findByEik(contractorEik)
                    .map(MonitorCompanyEntity::getFoundedAt)
                    .orElse(null);
        }
    }

    private static final class InMemoryFacts implements RiskFacts {

        private final Map<String, List<MonitorContractEntity>> bySector = new HashMap<>();
        private final Map<String, LocalDate> foundedByEik = new HashMap<>();

        InMemoryFacts(List<MonitorContractEntity> contracts, List<MonitorCompanyEntity> companies) {
            for (MonitorContractEntity contract : contracts) {
                if (contract.getSectorCode() != null && contract.getAmountEur() != null) {
                    bySector.computeIfAbsent(contract.getSectorCode(), key -> new ArrayList<>()).add(contract);
                }
            }
            for (MonitorCompanyEntity company : companies) {
                if (company.getEik() != null && company.getFoundedAt() != null) {
                    foundedByEik.put(company.getEik().trim(), company.getFoundedAt());
                }
            }
        }

        @Override
        public BigDecimal medianForSector(String sectorCode, Long excludeId) {
            return median(bySector.getOrDefault(sectorCode, List.of()), excludeId);
        }

        @Override
        public double winnerShareInSector(String contractorEik, String sectorCode) {
            return winnerShare(bySector.getOrDefault(sectorCode, List.of()), contractorEik);
        }

        @Override
        public long fragmentationCount(String contractorEik, String sectorCode, LocalDate since) {
            return bySector.getOrDefault(sectorCode, List.of()).stream()
                    .filter(c -> contractorEik.equals(c.getContractorEik()))
                    .filter(c -> c.getSignedAt() != null && !c.getSignedAt().isBefore(since))
                    .filter(c -> c.getAmountEur().compareTo(FRAGMENTATION_THRESHOLD_EUR) < 0)
                    .count();
        }

        @Override
        public LocalDate foundedAt(String contractorEik) {
            return foundedByEik.get(contractorEik);
        }
    }

    /** Composite regional risk index for a company (0–100), weighted by contract value. */
    public int computeCompanyCri(String contractorEik) {
        return computeCompanyCri(contractRepository.findByContractorEikOrderBySignedAtDesc(
                contractorEik, org.springframework.data.domain.PageRequest.of(0, 100)));
    }

    /** Same index from contracts already in hand — used when rescoring every company at once. */
    public int computeCompanyCri(List<MonitorContractEntity> contracts) {
        if (contracts.isEmpty()) {
            return 0;
        }
        BigDecimal weightedSum = BigDecimal.ZERO;
        BigDecimal totalWeight = BigDecimal.ZERO;
        for (MonitorContractEntity c : contracts) {
            if (c.getRiskScore() == null || c.getRiskScore() <= 0) {
                continue;
            }
            BigDecimal weight = c.getAmountEur() != null && c.getAmountEur().signum() > 0
                    ? c.getAmountEur()
                    : BigDecimal.ONE;
            weightedSum = weightedSum.add(weight.multiply(BigDecimal.valueOf(c.getRiskScore())));
            totalWeight = totalWeight.add(weight);
        }
        if (totalWeight.signum() == 0) {
            return contracts.stream()
                    .map(MonitorContractEntity::getRiskScore)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .max()
                    .orElse(0);
        }
        return weightedSum.divide(totalWeight, 0, RoundingMode.HALF_UP).intValue();
    }

    public static String tooltipFor(String code) {
        return TOOLTIPS.getOrDefault(code, "");
    }

    private static BigDecimal median(List<MonitorContractEntity> sectorContracts, Long excludeId) {
        List<BigDecimal> amounts = sectorContracts.stream()
                .filter(c -> excludeId == null || !excludeId.equals(c.getId()))
                .map(MonitorContractEntity::getAmountEur)
                .filter(Objects::nonNull)
                .sorted()
                .toList();
        if (amounts.isEmpty()) {
            return null;
        }
        int mid = amounts.size() / 2;
        if (amounts.size() % 2 == 1) {
            return amounts.get(mid);
        }
        return amounts.get(mid - 1).add(amounts.get(mid)).divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
    }

    private static double winnerShare(List<MonitorContractEntity> sectorContracts, String contractorEik) {
        if (sectorContracts.isEmpty()) {
            return 0;
        }
        long wins = sectorContracts.stream()
                .filter(c -> contractorEik.equals(c.getContractorEik()))
                .count();
        return (double) wins / sectorContracts.size();
    }

    private String serializeFlags(List<RiskFlag> flags) {
        try {
            List<Map<String, Object>> payload = flags.stream()
                    .map(f -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("code", f.code());
                        m.put("label", f.label());
                        m.put("weight", f.weight());
                        m.put("tooltip", TOOLTIPS.getOrDefault(f.code(), f.label()));
                        return m;
                    })
                    .toList();
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    public record RiskFlag(String code, String label, int weight) {
    }
}

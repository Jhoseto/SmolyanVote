package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCompetitionDTO;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MonitorCompetitionService {

    private final MonitorContractRepository contractRepository;

    public MonitorCompetitionService(MonitorContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    @Transactional(readOnly = true)
    public MonitorCompetitionDTO computeRegionalCompetition(MonitorScope scope) {
        List<MonitorContractEntity> contracts = contractRepository.findAllWithBids(scope.authorityFilter());
        if (contracts.isEmpty()) {
            return new MonitorCompetitionDTO(0, 0, "Няма данни", List.of());
        }

        long singleBid = contracts.stream().filter(c -> c.getBidsReceived() != null && c.getBidsReceived() == 1).count();
        double singleBidShare = 100.0 * singleBid / contracts.size();

        Map<String, BigDecimal> contractorTotals = new HashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        for (MonitorContractEntity c : contracts) {
            if (c.getAmountEur() == null || c.getContractorEik() == null) {
                continue;
            }
            contractorTotals.merge(c.getContractorEik(), c.getAmountEur(), BigDecimal::add);
            total = total.add(c.getAmountEur());
        }

        double hhi = computeHhi(contractorTotals, total);
        String label = competitionLabel(hhi, singleBidShare);

        Map<String, List<MonitorContractEntity>> bySector = contracts.stream()
                .filter(c -> c.getSectorCode() != null)
                .collect(Collectors.groupingBy(MonitorContractEntity::getSectorCode));

        List<MonitorCompetitionDTO.SectorCompetitionDTO> sectors = bySector.entrySet().stream()
                .map(e -> sectorStats(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingDouble(MonitorCompetitionDTO.SectorCompetitionDTO::hhiIndex).reversed())
                .limit(10)
                .toList();

        return new MonitorCompetitionDTO(
                Math.round(singleBidShare * 10) / 10.0,
                Math.round(hhi * 10) / 10.0,
                label,
                sectors);
    }

    private static MonitorCompetitionDTO.SectorCompetitionDTO sectorStats(String sector, List<MonitorContractEntity> list) {
        Map<String, BigDecimal> totals = new HashMap<>();
        Map<String, String> names = new HashMap<>();
        BigDecimal sum = BigDecimal.ZERO;
        for (MonitorContractEntity c : list) {
            if (c.getAmountEur() == null || c.getContractorEik() == null) {
                continue;
            }
            totals.merge(c.getContractorEik(), c.getAmountEur(), BigDecimal::add);
            names.putIfAbsent(c.getContractorEik(), c.getContractorName());
            sum = sum.add(c.getAmountEur());
        }
        double hhi = computeHhi(totals, sum);
        String top = totals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> names.getOrDefault(e.getKey(), e.getKey()))
                .orElse("—");
        return new MonitorCompetitionDTO.SectorCompetitionDTO(sector, Math.round(hhi * 10) / 10.0, list.size(), top);
    }

    private static double computeHhi(Map<String, BigDecimal> contractorTotals, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) <= 0 || contractorTotals.isEmpty()) {
            return 0;
        }
        double hhi = 0;
        for (BigDecimal amount : contractorTotals.values()) {
            double share = amount.doubleValue() / total.doubleValue();
            hhi += share * share;
        }
        return hhi * 10_000;
    }

    private static String competitionLabel(double hhi, double singleBidShare) {
        if (hhi >= 2500 || singleBidShare >= 60) {
            return "Ниска конкуренция";
        }
        if (hhi >= 1500 || singleBidShare >= 40) {
            return "Умерена конкуренция";
        }
        return "Добра конкуренция";
    }
}

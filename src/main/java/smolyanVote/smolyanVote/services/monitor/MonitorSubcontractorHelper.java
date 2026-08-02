package smolyanVote.smolyanVote.services.monitor;

import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Aggregates EOP-declared subcontractor facts on contracts and money-flow links. */
public final class MonitorSubcontractorHelper {

    private MonitorSubcontractorHelper() {
    }

    public record LinkSubcontractSummary(
            int contractsWithSubcontractor,
            String subcontractorName,
            String subcontractorEik,
            BigDecimal subcontractingTotalEur) {
    }

    public static boolean hasDeclaredSubcontractor(MonitorContractEntity c) {
        if (c == null) {
            return false;
        }
        if (c.isHasSubcontractors()) {
            return true;
        }
        if (c.getSubcontractorEik() != null && !c.getSubcontractorEik().isBlank()) {
            return true;
        }
        return c.getSubcontractorName() != null && !c.getSubcontractorName().isBlank();
    }

    /**
     * EOP amount when present; otherwise estimate from contract value × declared percent.
     * Persist subcontractor fields via SIGMA JSON enrichment or EOP import — CSV alone is not enough.
     */
    public static BigDecimal effectiveSubcontractingAmountEur(MonitorContractEntity c) {
        if (c == null) {
            return null;
        }
        if (c.getSubcontractingAmountEur() != null && c.getSubcontractingAmountEur().signum() > 0) {
            return c.getSubcontractingAmountEur();
        }
        if (c.getSubcontractingPercent() != null
                && c.getAmountEur() != null
                && c.getSubcontractingPercent().signum() > 0
                && c.getAmountEur().signum() > 0) {
            return c.getAmountEur()
                    .multiply(c.getSubcontractingPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return null;
    }

    public static LinkSubcontractSummary summarizeLink(List<MonitorContractEntity> contracts) {
        if (contracts == null || contracts.isEmpty()) {
            return new LinkSubcontractSummary(0, null, null, null);
        }
        int withSub = 0;
        BigDecimal total = BigDecimal.ZERO;
        Map<String, Integer> eikCounts = new HashMap<>();
        Map<String, String> eikNames = new HashMap<>();
        for (MonitorContractEntity c : contracts) {
            if (!hasDeclaredSubcontractor(c)) {
                continue;
            }
            withSub++;
            BigDecimal effective = effectiveSubcontractingAmountEur(c);
            if (effective != null) {
                total = total.add(effective);
            }
            String eik = c.getSubcontractorEik();
            if (eik != null && !eik.isBlank()) {
                String key = eik.trim();
                eikCounts.merge(key, 1, Integer::sum);
                if (c.getSubcontractorName() != null && !c.getSubcontractorName().isBlank()) {
                    eikNames.putIfAbsent(key, c.getSubcontractorName().trim());
                }
            }
        }
        if (withSub == 0) {
            return new LinkSubcontractSummary(0, null, null, null);
        }
        String topEik = null;
        int topCount = 0;
        for (Map.Entry<String, Integer> entry : eikCounts.entrySet()) {
            if (entry.getValue() > topCount) {
                topCount = entry.getValue();
                topEik = entry.getKey();
            }
        }
        String topName = null;
        if (topEik != null) {
            topName = eikNames.get(topEik);
        } else {
            for (MonitorContractEntity c : contracts) {
                if (hasDeclaredSubcontractor(c) && c.getSubcontractorName() != null) {
                    topName = c.getSubcontractorName();
                    break;
                }
            }
        }
        return new LinkSubcontractSummary(
                withSub,
                topName,
                topEik,
                total.signum() > 0 ? total : null);
    }
}

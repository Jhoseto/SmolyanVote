package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Citizen-facing hints for authority → contractor money flows. */
public final class MonitorFlowHintBuilder {

    private static final List<String> CONCERN_PRIORITY = List.of(
            "FRAGMENTATION", "SIGNED_BEFORE_PUBLICATION", "ABOVE_TYPICAL", "AMENDMENT_GROWTH",
            "LARGE_SINGLE_BID", "SINGLE_BID", "REPEAT_WINNER", "NEW_COMPANY_LARGE_CONTRACT",
            "ABOVE_ESTIMATE", "EU_LOW_COMPETITION");

    private MonitorFlowHintBuilder() {
    }

    public record FlowHint(int flaggedCount, String concernLabel, String citizenHint) {
    }

    public static FlowHint forLinkContracts(
            List<MonitorContractEntity> contracts,
            BigDecimal linkValueEur,
            BigDecimal authorityTotalEur,
            ObjectMapper mapper) {
        FlowHint risk = forContracts(contracts, mapper);
        String dominance = dominanceHint(linkValueEur, authorityTotalEur);
        if (dominance == null) {
            return risk;
        }
        if (risk.citizenHint() == null || risk.citizenHint().isBlank()) {
            return new FlowHint(risk.flaggedCount(), "Концентрация", dominance);
        }
        return new FlowHint(
                risk.flaggedCount(),
                risk.flaggedCount() > 0 ? risk.concernLabel() : "Концентрация",
                risk.citizenHint() + " " + dominance);
    }

    public static FlowHint forContracts(List<MonitorContractEntity> contracts, ObjectMapper mapper) {
        if (contracts.isEmpty()) {
            return new FlowHint(0, null, null);
        }
        int flagged = 0;
        Map<String, Integer> codeCounts = new HashMap<>();
        for (MonitorContractEntity c : contracts) {
            if (c.getRiskScore() != null && c.getRiskScore() >= MonitorRiskService.FLAG_THRESHOLD) {
                flagged++;
            }
            for (Map<String, Object> flag : parseFlags(c.getRiskFlagsJson(), mapper)) {
                String code = String.valueOf(flag.get("code"));
                if (!code.isBlank() && !"null".equals(code)) {
                    codeCounts.merge(code, 1, Integer::sum);
                }
            }
        }

        int total = contracts.size();
        if (flagged == 0 && codeCounts.isEmpty()) {
            return new FlowHint(0, "Стандартна поръчка", "Няма активирани индикатори — обикновена общинска поръчка.");
        }

        String primary = pickPrimary(codeCounts);
        String label = MonitorInsightBuilder.concernLabel(primary);
        String explanation = citizenExplanation(primary);
        String hint;
        if (flagged > 0 && total > 1) {
            hint = flagged + " от " + total + " договора: " + explanation;
        } else if (flagged > 0) {
            hint = explanation;
        } else {
            hint = "Слаби сигнали: " + explanation;
        }
        return new FlowHint(flagged, label, hint);
    }

    private static String dominanceHint(BigDecimal linkValueEur, BigDecimal authorityTotalEur) {
        if (linkValueEur == null || authorityTotalEur == null || authorityTotalEur.signum() <= 0) {
            return null;
        }
        double share = linkValueEur.divide(authorityTotalEur, 4, RoundingMode.HALF_UP).doubleValue();
        if (share < 0.35) {
            return null;
        }
        int pct = (int) Math.round(share * 100);
        return "Една фирма получава " + pct + "% от поръчките на общината — висока концентрация на парите.";
    }

    private static String pickPrimary(Map<String, Integer> codeCounts) {
        for (String code : CONCERN_PRIORITY) {
            if (codeCounts.containsKey(code)) {
                return code;
            }
        }
        return codeCounts.keySet().stream().findFirst().orElse("ROUTINE");
    }

    private static String citizenExplanation(String code) {
        return switch (code) {
            case "SINGLE_BID", "LARGE_SINGLE_BID" ->
                    "парите отиват без реална конкуренция (получена е само една оферта).";
            case "FRAGMENTATION" ->
                    "възможно е раздробяване на поръчки, за да се заобиколи по-строга процедура.";
            case "ABOVE_TYPICAL" ->
                    "сумата е далеч над типичното за същия сектор в региона.";
            case "AMENDMENT_GROWTH" ->
                    "стойността е нараснала значително след подписване чрез анекси.";
            case "REPEAT_WINNER" ->
                    "същата фирма печели отново в този сектор — концентрация на общински пари.";
            case "NEW_COMPANY_LARGE_CONTRACT" ->
                    "новорегистрирана фирма получава необичайно голяма поръчка.";
            case "ABOVE_ESTIMATE" ->
                    "договорът е сключен над прогнозната стойност от обявлението.";
            case "EU_LOW_COMPETITION" ->
                    "европейски средства с почти липсваща конкуренция.";
            case "SIGNED_BEFORE_PUBLICATION" ->
                    "датата на подписване предхожда обявлението — проверете процедурата.";
            default -> "има комбинация от индикатори за прозрачност и конкуренция.";
        };
    }

    private static List<Map<String, Object>> parseFlags(String json, ObjectMapper mapper) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return mapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }
}

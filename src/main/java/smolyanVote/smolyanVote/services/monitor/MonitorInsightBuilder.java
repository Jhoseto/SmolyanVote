package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Turns registry rows + risk flags into citizen-facing insight headlines.
 * Works without Gemini — AI batch can refine {@link MonitorContractEntity#getShortSummary()} later.
 */
public final class MonitorInsightBuilder {

    private static final NumberFormat EUR = NumberFormat.getNumberInstance(new Locale("bg", "BG"));
    private static final Set<String> CONCERN_PRIORITY = Set.of(
            "FRAGMENTATION", "SIGNED_BEFORE_PUBLICATION", "ABOVE_TYPICAL", "AMENDMENT_GROWTH",
            "LARGE_SINGLE_BID", "SINGLE_BID", "REPEAT_WINNER", "NEW_COMPANY_LARGE_CONTRACT",
            "ABOVE_ESTIMATE", "EU_LOW_COMPETITION");

    private MonitorInsightBuilder() {
    }

    public record ContractInsight(
            String headline,
            String whyItMatters,
            String concernType,
            String concernLabel,
            String category) {
    }

    public static ContractInsight build(MonitorContractEntity c, ObjectMapper objectMapper) {
        List<Map<String, Object>> flags = parseFlags(c.getRiskFlagsJson(), objectMapper);
        String contractor = c.getContractorName() != null ? c.getContractorName().trim() : "неизвестен изпълнител";
        String authority = c.getAuthorityName() != null ? c.getAuthorityName().trim() : "общината";
        String amount = formatEur(c.getAmountEur());
        int risk = c.getRiskScore() != null ? c.getRiskScore() : 0;

        String stored = c.getShortSummary();
        if (stored != null && !stored.isBlank() && !stored.equals(truncateSubject(c.getSubject()))
                && stored.length() > 40) {
            String why = c.getInsightWhy() != null && !c.getInsightWhy().isBlank()
                    ? c.getInsightWhy()
                    : buildWhyFromFlags(flags, c, contractor, authority, amount);
            return new ContractInsight(
                    stored,
                    why,
                    primaryConcern(flags),
                    concernLabel(primaryConcern(flags)),
                    c.getAiCategory() != null ? c.getAiCategory() : concernLabel(primaryConcern(flags)));
        }

        return buildFromRiskData(c, objectMapper);
    }

    /** Always derives headline + why from risk flags — used when persisting insights to DB. */
    public static ContractInsight buildFromRiskData(MonitorContractEntity c, ObjectMapper objectMapper) {
        List<Map<String, Object>> flags = parseFlags(c.getRiskFlagsJson(), objectMapper);
        String contractor = c.getContractorName() != null ? c.getContractorName().trim() : "неизвестен изпълнител";
        String authority = c.getAuthorityName() != null ? c.getAuthorityName().trim() : "общината";
        String amount = formatEur(c.getAmountEur());
        int risk = c.getRiskScore() != null ? c.getRiskScore() : 0;

        if (flags.isEmpty() && risk < MonitorRiskService.FLAG_THRESHOLD) {
            return lowRiskInsight(c, contractor, authority, amount);
        }

        String headline = buildHeadline(flags, c, contractor, authority, amount, risk);
        String why = buildWhyFromFlags(flags, c, contractor, authority, amount);
        String concern = primaryConcern(flags);
        return new ContractInsight(
                headline,
                why,
                concern,
                concernLabel(concern),
                c.getAiCategory() != null ? c.getAiCategory() : concernLabel(concern));
    }

    private static ContractInsight lowRiskInsight(
            MonitorContractEntity c, String contractor, String authority, String amount) {
        String sector = c.getSectorCode() != null ? " (CPV " + c.getSectorCode() + ")" : "";
        String headline = amount + " за " + contractor + sector;
        String why = authority + " е възложила поръчка на " + contractor + " на стойност " + amount
                + ". Няма активирани рискови индикатори — стандартна процедура.";
        return new ContractInsight(headline, why, "ROUTINE", "Стандартна поръчка", "Поръчки");
    }

    private static String buildHeadline(
            List<Map<String, Object>> flags,
            MonitorContractEntity c,
            String contractor,
            String authority,
            String amount,
            int risk) {
        String code = primaryConcern(flags);
        return switch (code) {
            case "FRAGMENTATION" -> amount + " — възможно раздробяване на поръчки (" + contractor + ")";
            case "SIGNED_BEFORE_PUBLICATION" -> "Подписан преди обявление — " + amount + " (" + authority + ")";
            case "ABOVE_TYPICAL" -> amount + " — далеч над типичното за сектора (" + contractor + ")";
            case "AMENDMENT_GROWTH" -> amount + " — значителен ръст след анекси (" + contractor + ")";
            case "LARGE_SINGLE_BID" -> amount + " с единствен оферент — " + contractor;
            case "SINGLE_BID" -> amount + " без конкуренция — " + contractor;
            case "REPEAT_WINNER" -> contractor + " печели отново в същия сектор — " + amount;
            case "NEW_COMPANY_LARGE_CONTRACT" -> "Нова фирма с голяма поръчка: " + contractor + " — " + amount;
            case "ABOVE_ESTIMATE" -> amount + " над прогнозната стойност — " + contractor;
            case "EU_LOW_COMPETITION" -> "ЕС средства (" + amount + ") с една оферта — " + contractor;
            default -> risk >= MonitorRiskService.FLAG_THRESHOLD
                    ? "Риск " + risk + "/100: " + amount + " — " + contractor
                    : amount + " — " + contractor;
        };
    }

    private static String buildWhyFromFlags(
            List<Map<String, Object>> flags,
            MonitorContractEntity c,
            String contractor,
            String authority,
            String amount) {
        if (flags.isEmpty()) {
            return authority + " е сключила договор на " + amount + " с " + contractor + ".";
        }
        List<String> parts = new ArrayList<>();
        for (Map<String, Object> f : flags) {
            Object tooltip = f.get("tooltip");
            if (tooltip != null && !tooltip.toString().isBlank()) {
                parts.add(tooltip.toString());
            }
        }
        if (c.getBidsReceived() != null) {
            parts.add("Получени оферти: " + c.getBidsReceived() + ".");
        }
        if (c.getOriginalAmountEur() != null && c.getAmountEur() != null
                && c.getOriginalAmountEur().compareTo(c.getAmountEur()) != 0) {
            parts.add("Първоначално " + formatEur(c.getOriginalAmountEur()) + ", сега " + amount + ".");
        }
        String joined = String.join(" ", parts);
        if (joined.length() > 320) {
            return joined.substring(0, 317) + "...";
        }
        return joined;
    }

    private static String primaryConcern(List<Map<String, Object>> flags) {
        for (String code : CONCERN_PRIORITY) {
            for (Map<String, Object> f : flags) {
                if (code.equals(String.valueOf(f.get("code")))) {
                    return code;
                }
            }
        }
        return flags.isEmpty() ? "ROUTINE" : String.valueOf(flags.get(0).get("code"));
    }

    static String concernLabel(String code) {
        if (code == null) {
            return "Поръчки";
        }
        return switch (code) {
            case "FRAGMENTATION" -> "Раздробяване";
            case "SIGNED_BEFORE_PUBLICATION" -> "Нередност в данни";
            case "ABOVE_TYPICAL" -> "Над типичното";
            case "AMENDMENT_GROWTH" -> "Ръст от анекси";
            case "LARGE_SINGLE_BID", "SINGLE_BID" -> "Слаба конкуренция";
            case "REPEAT_WINNER" -> "Повтарящ се победител";
            case "NEW_COMPANY_LARGE_CONTRACT" -> "Нова фирма";
            case "ABOVE_ESTIMATE" -> "Над прогнозата";
            case "EU_LOW_COMPETITION" -> "ЕС без конкуренция";
            case "ROUTINE" -> "Стандартна поръчка";
            default -> "Рисков индикатор";
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

    private static String formatEur(BigDecimal amount) {
        if (amount == null) {
            return "—";
        }
        return EUR.format(amount.setScale(0, java.math.RoundingMode.HALF_UP)) + " €";
    }

    private static String truncateSubject(String subject) {
        if (subject == null) {
            return "";
        }
        return subject.length() <= 280 ? subject : subject.substring(0, 277) + "...";
    }
}

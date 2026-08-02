package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.JsonNode;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/** Reads subcontractor facts from sigma.midt.bg contract JSON (nested {@code subcontractor} object). */
final class SigmaSubcontractorParser {

    private SigmaSubcontractorParser() {
    }

    /**
     * Applies subcontractor fields when SIGMA JSON declares one.
     *
     * @return true if the entity was updated with a declared subcontractor
     */
    static boolean applyFromJson(MonitorContractEntity entity, JsonNode node) {
        if (entity == null || node == null || node.isNull()) {
            return false;
        }
        JsonNode sub = node.get("subcontractor");
        if (sub == null || sub.isNull()) {
            return false;
        }
        String name = MonitorColumnLimits.clamp(text(sub, "name"), MonitorColumnLimits.CONTRACTOR_NAME);
        String eik = MonitorColumnLimits.clamp(text(sub, "eik"), MonitorColumnLimits.EIK);
        if ((name == null || name.isBlank()) && (eik == null || eik.isBlank())) {
            return false;
        }
        entity.setHasSubcontractors(true);
        entity.setSubcontractorName(name);
        entity.setSubcontractorEik(eik);
        BigDecimal valueEur = parseDecimal(sub.get("valueEur"));
        if (valueEur != null && valueEur.signum() > 0) {
            entity.setSubcontractingAmountEur(valueEur);
            if (entity.getAmountEur() != null && entity.getAmountEur().signum() > 0) {
                entity.setSubcontractingPercent(valueEur
                        .multiply(BigDecimal.valueOf(100))
                        .divide(entity.getAmountEur(), 2, RoundingMode.HALF_UP));
            }
        }
        LocalDate publishedAt = parseDate(text(node, "publishedAt"));
        if (publishedAt != null) {
            entity.setPublicationDate(publishedAt);
        }
        return true;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String trimmed = value.asText().trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private static BigDecimal parseDecimal(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.decimalValue().setScale(2, RoundingMode.HALF_UP);
        }
        String raw = node.asText().trim();
        if (raw.isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(raw.replace(" ", "").replace(",", "."))
                    .setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}

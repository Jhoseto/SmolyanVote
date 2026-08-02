package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.JsonNode;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;

/** Overlays fresh sigma.midt.bg JSON fields onto a local contract for detail reads. */
final class SigmaContractJsonOverlay {

    record Overlay(
            String subject,
            String authorityName,
            String contractorName,
            String contractorEik,
            String contractorKind,
            String sectorCode,
            String procedureType,
            LocalDate signedAt,
            BigDecimal amountEur,
            boolean euFunded,
            Integer bidsReceived,
            String unp,
            Instant refreshedAt) {
    }

    private SigmaContractJsonOverlay() {
    }

    static Overlay fromJson(JsonNode node, Instant fetchedAt) {
        if (node == null || node.isNull()) {
            return null;
        }
        return new Overlay(
                text(node, "subject"),
                firstNonBlank(text(node, "authority"), text(node, "authority_name")),
                firstNonBlank(text(node, "contractor"), text(node, "contractor_name")),
                text(node, "contractor_eik"),
                text(node, "kind"),
                firstNonBlank(text(node, "sector_code"), text(node, "sectorCode")),
                firstNonBlank(text(node, "procedure"), text(node, "procedure_type")),
                parseDate(firstNonBlank(text(node, "signed_at"), text(node, "signedAt"))),
                parseDecimal(firstNonBlank(text(node, "value_eur"), text(node, "amount_eur"), text(node, "amountEur"))),
                parseBoolean(firstNonBlank(text(node, "eu_funded"), text(node, "euFunded"))),
                parseInteger(firstNonBlank(text(node, "bids_received"), text(node, "bidsReceived"))),
                text(node, "unp"),
                fetchedAt);
    }

    static MonitorContractEntity apply(MonitorContractEntity entity, Overlay overlay) {
        if (overlay == null) {
            return entity;
        }
        if (overlay.subject() != null) {
            entity.setSubject(overlay.subject());
        }
        if (overlay.authorityName() != null) {
            entity.setAuthorityName(overlay.authorityName());
        }
        if (overlay.contractorName() != null) {
            entity.setContractorName(overlay.contractorName());
        }
        if (overlay.contractorEik() != null) {
            entity.setContractorEik(overlay.contractorEik());
        }
        if (overlay.contractorKind() != null) {
            entity.setContractorKind(overlay.contractorKind());
        }
        if (overlay.sectorCode() != null) {
            entity.setSectorCode(overlay.sectorCode());
        }
        if (overlay.procedureType() != null) {
            entity.setProcedureType(overlay.procedureType());
        }
        if (overlay.signedAt() != null) {
            entity.setSignedAt(overlay.signedAt());
        }
        if (overlay.amountEur() != null) {
            entity.setAmountEur(overlay.amountEur());
        }
        entity.setEuFunded(overlay.euFunded());
        if (overlay.bidsReceived() != null) {
            entity.setBidsReceived(overlay.bidsReceived());
        }
        if (overlay.unp() != null) {
            entity.setUnp(overlay.unp());
        }
        if (overlay.refreshedAt() != null) {
            entity.setFetchedAt(overlay.refreshedAt());
        }
        return entity;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String trimmed = value.asText().trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
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

    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return new BigDecimal(value.trim()).setScale(2, RoundingMode.HALF_UP);
    }

    private static boolean parseBoolean(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return "1".equals(value.trim()) || "true".equalsIgnoreCase(value.trim());
    }

    private static Integer parseInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Integer.parseInt(value.trim());
    }
}

package smolyanVote.smolyanVote.services.monitor;

/**
 * Column widths of {@code monitor_contracts} / {@code monitor_companies}.
 *
 * <p>SIGMA and EOP are external feeds we do not control — a single oversized field
 * (consortium names in particular run to hundreds of characters) would otherwise abort
 * the whole import at flush time with an opaque constraint violation.
 */
final class MonitorColumnLimits {

    static final int SIGMA_ID = 255;
    static final int UNP = 64;
    static final int AUTHORITY_NAME = 500;
    static final int EIK = 20;
    static final int CONTRACTOR_NAME = 500;
    static final int CONTRACTOR_KIND = 32;
    static final int SECTOR_CODE = 8;
    static final int PROCEDURE_TYPE = 128;
    static final int SHORT_SUMMARY = 280;
    static final int SOURCE_URL = 1000;
    static final int EOP_NOTICE_ID = 64;
    static final int CHANGE_REASON = 500;

    private MonitorColumnLimits() {
    }

    /** Trims to {@code max} characters; null and blank stay null. */
    static String clamp(String value, int max) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() <= max) {
            return trimmed;
        }
        return trimmed.substring(0, max - 3) + "...";
    }

    /**
     * Shortens an external identifier without losing uniqueness — a plain substring of two
     * long consortium ids can collide, which would silently merge two contracts.
     */
    static String clampIdentifier(String value, int max) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() <= max) {
            return trimmed;
        }
        String suffix = "~" + MonitorHashUtil.sha256(trimmed).substring(0, 16);
        return trimmed.substring(0, max - suffix.length()) + suffix;
    }
}

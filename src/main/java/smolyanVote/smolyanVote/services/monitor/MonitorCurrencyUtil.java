package smolyanVote.smolyanVote.services.monitor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Fixed BNB rate for indicative BGN→EUR conversion in the citizen monitor. */
public final class MonitorCurrencyUtil {

    public static final BigDecimal BGN_PER_EUR = new BigDecimal("1.95583");

    private static final Pattern AMOUNT_WITH_CURRENCY = Pattern.compile(
            "(\\d[\\d\\s.,]{2,})\\s*(лв\\.?|BGN|бгн|евро|EUR|€)",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private MonitorCurrencyUtil() {
    }

    public static BigDecimal bgnToEur(BigDecimal bgn) {
        if (bgn == null) {
            return null;
        }
        return bgn.divide(BGN_PER_EUR, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal toEur(BigDecimal amount, String currency) {
        if (amount == null) {
            return null;
        }
        if (isBgn(currency)) {
            return bgnToEur(amount);
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    public static boolean isBgn(String currency) {
        if (currency == null || currency.isBlank()) {
            return false;
        }
        String normalized = currency.trim().toLowerCase();
        return normalized.equals("bgn")
                || normalized.equals("бгн")
                || normalized.startsWith("лв")
                || normalized.contains("lev");
    }

    public static boolean isEur(String currency) {
        if (currency == null || currency.isBlank()) {
            return false;
        }
        String normalized = currency.trim().toLowerCase();
        return normalized.equals("eur")
                || normalized.equals("€")
                || normalized.contains("евро");
    }

    /** Normalizes scraper / free-text tokens to BGN, EUR, or null when unknown. */
    public static String normalizeCurrencyToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        if (isBgn(token)) {
            return "BGN";
        }
        if (isEur(token)) {
            return "EUR";
        }
        return null;
    }

    /** Normalizes EOP currency field — BGN, EUR, or null when blank/unrecognized. */
    public static String normalizeEopCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return null;
        }
        String normalized = normalizeCurrencyToken(currency);
        if (normalized != null) {
            return normalized;
        }
        String upper = currency.trim().toUpperCase();
        if ("EURO".equals(upper) || "EUROS".equals(upper)) {
            return "EUR";
        }
        return null;
    }

    /** Best-effort currency detection from municipal document text. */
    public static String detectCurrencyFromText(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        Matcher matcher = AMOUNT_WITH_CURRENCY.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return normalizeCurrencyToken(matcher.group(2));
    }
}

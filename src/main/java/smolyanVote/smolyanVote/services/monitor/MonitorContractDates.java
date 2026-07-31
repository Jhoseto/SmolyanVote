package smolyanVote.smolyanVote.services.monitor;

import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Best-effort contract dates when SIGMA/EOP fields are incomplete. */
public final class MonitorContractDates {

    private static final ZoneId BULGARIA = ZoneId.of("Europe/Sofia");
    /** UNP like 00092-2021-0001 — year is the second segment. */
    private static final Pattern UNP_YEAR = Pattern.compile("^\\d+-?(\\d{4})-");

    private MonitorContractDates() {
    }

    public static LocalDate effectiveSignedDate(MonitorContractEntity contract) {
        if (contract == null) {
            return null;
        }
        if (contract.getSignedAt() != null) {
            return contract.getSignedAt();
        }
        Integer unpYear = yearFromUnp(contract.getUnp());
        if (unpYear != null) {
            return LocalDate.of(unpYear, 7, 1);
        }
        if (contract.getFetchedAt() != null) {
            return contract.getFetchedAt().atZone(BULGARIA).toLocalDate();
        }
        return null;
    }

    public static int effectiveYear(MonitorContractEntity contract) {
        LocalDate date = effectiveSignedDate(contract);
        return date != null ? date.getYear() : 0;
    }

    public static boolean isWithinYear(MonitorContractEntity contract, int year) {
        return effectiveYear(contract) == year;
    }

    private static Integer yearFromUnp(String unp) {
        if (unp == null || unp.isBlank()) {
            return null;
        }
        Matcher matcher = UNP_YEAR.matcher(unp.trim());
        if (!matcher.find()) {
            return null;
        }
        try {
            int y = Integer.parseInt(matcher.group(1));
            return y >= 1990 && y <= 2100 ? y : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}

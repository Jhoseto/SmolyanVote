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
        LocalDate fromUnp = dateFromUnp(contract.getUnp());
        if (fromUnp != null) {
            return fromUnp;
        }
        if (contract.getFetchedAt() != null) {
            return contract.getFetchedAt().atZone(BULGARIA).toLocalDate();
        }
        return null;
    }

    /** Date used for budget year bucketing — never uses import/fetched time. */
    public static LocalDate budgetSpendDate(MonitorContractEntity contract) {
        if (contract == null) {
            return null;
        }
        if (contract.getSignedAt() != null) {
            return contract.getSignedAt();
        }
        return dateFromUnp(contract.getUnp());
    }

    public static int effectiveYear(MonitorContractEntity contract) {
        LocalDate date = effectiveSignedDate(contract);
        return date != null ? date.getYear() : 0;
    }

    public static boolean isWithinYear(MonitorContractEntity contract, int year) {
        return effectiveYear(contract) == year;
    }

    public static boolean inCalendarYear(MonitorContractEntity contract, int year) {
        return inYearRange(contract, year, year);
    }

    /** Whether contract spend falls within an inclusive calendar-year range (budget-safe dates). */
    public static boolean inYearRange(MonitorContractEntity contract, int yearFrom, int yearTo) {
        if (contract == null) {
            return false;
        }
        int y = budgetSpendYear(contract);
        if (y <= 0) {
            return false;
        }
        int from = Math.min(yearFrom, yearTo);
        int to = Math.max(yearFrom, yearTo);
        return y >= from && y <= to;
    }

    /** Calendar year for budget aggregation — signed date, then UNP; never import time. */
    public static int budgetSpendYear(MonitorContractEntity contract) {
        LocalDate date = budgetSpendDate(contract);
        return date != null ? date.getYear() : 0;
    }

    /** @deprecated Prefer {@link #budgetSpendYear}. */
    @Deprecated
    public static int spendYear(MonitorContractEntity contract) {
        return budgetSpendYear(contract);
    }

    public static LocalDate dateFromUnp(String unp) {
        Integer year = yearFromUnp(unp);
        return year != null ? LocalDate.of(year, 7, 1) : null;
    }

    static Integer yearFromUnp(String unp) {
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

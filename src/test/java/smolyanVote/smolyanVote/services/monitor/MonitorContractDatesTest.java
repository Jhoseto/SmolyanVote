package smolyanVote.smolyanVote.services.monitor;

import org.junit.jupiter.api.Test;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class MonitorContractDatesTest {

    @Test
    void inCalendarYear_usesSignedAtWhenPresent() {
        MonitorContractEntity c = new MonitorContractEntity();
        c.setSignedAt(LocalDate.of(2025, 3, 15));
        c.setFetchedAt(Instant.parse("2026-07-31T00:00:00Z"));

        assertTrue(MonitorContractDates.inCalendarYear(c, 2025));
        assertFalse(MonitorContractDates.inCalendarYear(c, 2026));
    }

    @Test
    void inCalendarYear_fallsBackToUnpYearWithoutSignedAt() {
        MonitorContractEntity c = new MonitorContractEntity();
        c.setUnp("00092-2024-0001");

        assertTrue(MonitorContractDates.inCalendarYear(c, 2024));
        assertFalse(MonitorContractDates.inCalendarYear(c, 2026));
    }

    @Test
    void budgetSpendYear_ignoresFetchedAtWhenUnpPresent() {
        MonitorContractEntity c = new MonitorContractEntity();
        c.setUnp("00092-2021-0001");
        c.setFetchedAt(Instant.parse("2026-07-31T00:00:00Z"));

        assertEquals(2021, MonitorContractDates.budgetSpendYear(c));
    }

    @Test
    void inYearRange_supportsMultiYearSpan() {
        MonitorContractEntity c = new MonitorContractEntity();
        c.setSignedAt(LocalDate.of(2024, 6, 1));

        assertTrue(MonitorContractDates.inYearRange(c, 2023, 2025));
        assertFalse(MonitorContractDates.inYearRange(c, 2025, 2026));
    }

    @Test
    void spendYear_prefersSignedAt() {
        MonitorContractEntity c = new MonitorContractEntity();
        c.setSignedAt(LocalDate.of(2026, 1, 10));
        c.setUnp("00092-2024-0001");

        assertEquals(2026, MonitorContractDates.spendYear(c));
    }
}

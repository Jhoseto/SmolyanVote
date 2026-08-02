package smolyanVote.smolyanVote.services.monitor;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class MonitorCurrencyUtilTest {

    @Test
    void bgnToEur_usesFixedRate() {
        assertEquals(new BigDecimal("511.29"), MonitorCurrencyUtil.bgnToEur(new BigDecimal("1000.00")));
    }

    @Test
    void toEur_convertsBgn() {
        assertEquals(new BigDecimal("100.00"), MonitorCurrencyUtil.toEur(new BigDecimal("195.58"), "BGN"));
    }

    @Test
    void toEur_keepsEur() {
        assertEquals(new BigDecimal("128656.76"), MonitorCurrencyUtil.toEur(new BigDecimal("128656.76"), "EUR"));
    }

    @Test
    void normalizeEopCurrency_recognizesVariants() {
        assertEquals("BGN", MonitorCurrencyUtil.normalizeEopCurrency("лв."));
        assertEquals("EUR", MonitorCurrencyUtil.normalizeEopCurrency("EURO"));
        assertNull(MonitorCurrencyUtil.normalizeEopCurrency(""));
    }

    @Test
    void detectCurrencyFromText_findsBgn() {
        assertEquals("BGN", MonitorCurrencyUtil.detectCurrencyFromText("Стойност 125 000,00 лв. с ДДС"));
    }

    @Test
    void detectCurrencyFromText_findsEur() {
        assertEquals("EUR", MonitorCurrencyUtil.detectCurrencyFromText("Сумата е 50 000 €"));
    }
}

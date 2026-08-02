package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Procurement spend by year and CPV from cached SIGMA CSV (contracts.csv?authority=&year=).
 */
@Service
public class SigmaBudgetAggregationService {

    private final SigmaProxyService proxyService;

    public SigmaBudgetAggregationService(SigmaProxyService proxyService) {
        this.proxyService = proxyService;
    }

    public record YearAggregation(
            int year,
            String authorityEik,
            BigDecimal totalEur,
            int contractCount,
            Map<String, BigDecimal> byCpvPrefix,
            Instant cacheRefreshedAt) {
    }

    public YearAggregation aggregateYear(String authorityEik, int year, boolean bypassCache) {
        SigmaProxyService.CachedCsv cached = proxyService.getContractsCsv(authorityEik, year, bypassCache);
        List<String[]> rows = MonitorCsvParser.parseRows(cached.body());
        if (rows.size() <= 1) {
            return new YearAggregation(year, authorityEik, BigDecimal.ZERO, 0, Map.of(), cached.fetchedAt());
        }

        String[] header = normalizeHeader(rows.get(0));
        Map<String, Integer> idx = indexHeader(header);
        BigDecimal total = BigDecimal.ZERO;
        int count = 0;
        Map<String, BigDecimal> byCpv = new HashMap<>();

        for (int i = 1; i < rows.size(); i++) {
            String[] row = rows.get(i);
            BigDecimal amount = parseDecimal(cell(row, idx, "value_eur"));
            if (amount == null || amount.signum() <= 0) {
                continue;
            }
            total = total.add(amount);
            count++;
            String cpv = cell(row, idx, "sector_code");
            String prefix = cpvPrefix(cpv);
            byCpv.merge(prefix, amount, BigDecimal::add);
        }

        return new YearAggregation(
                year,
                authorityEik,
                total.setScale(2, RoundingMode.HALF_UP),
                count,
                byCpv,
                cached.fetchedAt());
    }

    private static String cpvPrefix(String sectorCode) {
        if (sectorCode == null || sectorCode.isBlank()) {
            return "other";
        }
        String trimmed = sectorCode.trim();
        if (trimmed.length() >= 2) {
            return trimmed.substring(0, 2);
        }
        return trimmed;
    }

    private static String[] normalizeHeader(String[] header) {
        String[] out = new String[header.length];
        for (int i = 0; i < header.length; i++) {
            String h = header[i] == null ? "" : header[i].trim().toLowerCase();
            if (h.startsWith("\uFEFF")) {
                h = h.substring(1);
            }
            out[i] = h;
        }
        return out;
    }

    private static Map<String, Integer> indexHeader(String[] header) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            map.put(header[i], i);
        }
        return map;
    }

    private static String cell(String[] row, Map<String, Integer> idx, String key) {
        Integer i = idx.get(key);
        if (i == null || i >= row.length) {
            return null;
        }
        String v = row[i];
        return v == null ? null : v.trim();
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return new BigDecimal(value.trim()).setScale(2, RoundingMode.HALF_UP);
    }
}

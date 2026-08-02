package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorSigmaSpotCheckDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorSigmaSpotCheckDTO.SpotCheckRow;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Compares a sample of locally stored SIGMA contracts against live sigma.midt.bg CSV exports.
 */
@Service
public class MonitorSigmaSpotCheckService {

    private static final Logger log = LoggerFactory.getLogger(MonitorSigmaSpotCheckService.class);
    private static final BigDecimal TOLERANCE = new BigDecimal("0.02");

    private final MonitorContractRepository contractRepository;
    private final SigmaProxyService sigmaProxyService;

    public MonitorSigmaSpotCheckService(
            MonitorContractRepository contractRepository,
            SigmaProxyService sigmaProxyService) {
        this.contractRepository = contractRepository;
        this.sigmaProxyService = sigmaProxyService;
    }

    @Transactional(readOnly = true)
    public MonitorSigmaSpotCheckDTO runSpotCheck(int sampleSize) {
        int limit = Math.min(Math.max(sampleSize, 5), 50);
        List<MonitorContractEntity> sample = contractRepository
                .findSigmaContractsWithAmount(PageRequest.of(0, limit));
        if (sample.isEmpty()) {
            return new MonitorSigmaSpotCheckDTO(0, 0, 0, 0, 0, "Няма SIGMA договори за проверка", List.of());
        }

        Map<String, Map<String, BigDecimal>> sigmaByAuthority = new HashMap<>();
        int fetchErrors = 0;
        for (String eik : MonitorRegionalConfig.OBLAST_SMOLYAN_EIKS) {
            try {
                SigmaProxyService.CachedCsv csv = sigmaProxyService.getContractsCsv(eik, true);
                sigmaByAuthority.put(eik, indexSigmaAmounts(csv.body()));
            } catch (Exception ex) {
                fetchErrors++;
                log.warn("SIGMA spot-check CSV failed for {}: {}", eik, ex.getMessage());
            }
        }

        int matched = 0;
        int mismatched = 0;
        int notInSigma = 0;
        List<SpotCheckRow> rows = new ArrayList<>();

        for (MonitorContractEntity local : sample) {
            Map<String, BigDecimal> authorityIndex = sigmaByAuthority.get(local.getAuthorityEik());
            BigDecimal sigmaAmount = authorityIndex != null ? authorityIndex.get(local.getSigmaId()) : null;
            if (sigmaAmount == null) {
                notInSigma++;
                rows.add(new SpotCheckRow(
                        local.getSigmaId(),
                        local.getUnp(),
                        local.getAuthorityEik(),
                        local.getAmountEur(),
                        null,
                        false,
                        "Липсва в live SIGMA CSV за този ЕИК"));
                continue;
            }
            boolean ok = amountsMatch(local.getAmountEur(), sigmaAmount);
            if (ok) {
                matched++;
            } else {
                mismatched++;
            }
            rows.add(new SpotCheckRow(
                    local.getSigmaId(),
                    local.getUnp(),
                    local.getAuthorityEik(),
                    local.getAmountEur(),
                    sigmaAmount,
                    ok,
                    ok ? "OK" : "Разлика над 0,02 €"));
        }

        String message = String.format(
                "SIGMA spot-check: %d проби — %d съвпадения, %d разлики, %d липсващи в CSV, %d грешки при fetch",
                sample.size(),
                matched,
                mismatched,
                notInSigma,
                fetchErrors);
        log.info(message);
        return new MonitorSigmaSpotCheckDTO(
                sample.size(),
                matched,
                mismatched,
                notInSigma,
                fetchErrors,
                message,
                rows);
    }

    private static Map<String, BigDecimal> indexSigmaAmounts(String csv) {
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        List<String[]> rows = MonitorCsvParser.parseRows(csv);
        if (rows.size() <= 1) {
            return map;
        }
        String[] header = normalizeHeader(rows.get(0));
        Map<String, Integer> idx = indexHeader(header);
        for (int i = 1; i < rows.size(); i++) {
            String id = cell(rows.get(i), idx, "id");
            if (id == null || id.isBlank()) {
                continue;
            }
            BigDecimal amount = parseDecimal(cell(rows.get(i), idx, "value_eur"));
            if (amount != null) {
                map.put(id.trim(), amount);
            }
        }
        return map;
    }

    private static boolean amountsMatch(BigDecimal local, BigDecimal sigma) {
        if (local == null || sigma == null) {
            return false;
        }
        return local.subtract(sigma).abs().compareTo(TOLERANCE) <= 0;
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value.trim().replace(" ", "").replace(",", "."));
        } catch (NumberFormatException ex) {
            return null;
        }
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
}

package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.config.SigmaProxyProperties;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionStatus;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;

import java.util.ArrayList;
import java.util.List;

/**
 * Light SIGMA refresh: bust proxy cache, diff-import contracts, re-score only changes.
 */
@Service
public class SigmaRefreshService {

    private static final Logger log = LoggerFactory.getLogger(SigmaRefreshService.class);

    private final SigmaProxyService proxyService;
    private final SigmaProxyProperties proxyProperties;
    private final SigmaImportService importService;
    private final MonitorIngestionRunService runService;

    public SigmaRefreshService(
            SigmaProxyService proxyService,
            SigmaProxyProperties proxyProperties,
            SigmaImportService importService,
            MonitorIngestionRunService runService) {
        this.proxyService = proxyService;
        this.proxyProperties = proxyProperties;
        this.importService = importService;
        this.runService = runService;
    }

    public MonitorIngestionRunEntity refreshRegionalCache() {
        MonitorIngestionRunEntity run = runService.start(MonitorIngestionType.SIGMA);
        proxyService.invalidateAll();
        log.info("SIGMA cache refresh started (TTL {}h)", proxyProperties.getCacheTtlHours());

        List<String> failures = new ArrayList<>();
        SigmaImportService.RefreshResult result;
        try {
            result = importService.refreshRegionalContracts(true);
        } catch (Exception ex) {
            log.error("SIGMA cache refresh failed", ex);
            return runService.finish(
                    run.getId(),
                    MonitorIngestionStatus.FAILED,
                    0,
                    "SIGMA refresh: " + MonitorIngestionRunService.describe(ex));
        }

        if (!result.failures().isEmpty()) {
            failures.addAll(result.failures());
        }

        StringBuilder message = new StringBuilder("SIGMA cache refresh: ")
                .append(result.processed()).append(" договора");
        if (result.changed() > 0) {
            message.append(", ").append(result.changed()).append(" променени/нови");
        }
        if (result.skippedRows() > 0) {
            message.append(", ").append(result.skippedRows()).append(" пропуснати реда");
        }
        if (!failures.isEmpty()) {
            message.append(" | Грешки: ").append(String.join("; ", failures));
        }

        MonitorIngestionStatus status;
        if (failures.isEmpty()) {
            status = MonitorIngestionStatus.SUCCESS;
        } else {
            status = result.processed() > 0 ? MonitorIngestionStatus.PARTIAL : MonitorIngestionStatus.FAILED;
        }
        return runService.finish(run.getId(), status, result.processed(), message.toString());
    }
}

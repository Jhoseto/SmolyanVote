package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.config.MonitorIngestionProperties;

@Component
public class MonitorIngestionScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonitorIngestionScheduler.class);

    private final MonitorIngestionProperties properties;
    private final SigmaRefreshService sigmaRefreshService;
    private final EopImportService eopImportService;
    private final SmolyanBgScraperService scraperService;
    private final MonitorAiService aiService;
    private final MonitorAiAnalysisService aiAnalysisService;
    private final MonitorJobLauncher jobLauncher;
    private final MonitorZpokonpiVerificationService zpokonpiVerificationService;

    public MonitorIngestionScheduler(
            MonitorIngestionProperties properties,
            SigmaRefreshService sigmaRefreshService,
            EopImportService eopImportService,
            SmolyanBgScraperService scraperService,
            MonitorAiService aiService,
            MonitorAiAnalysisService aiAnalysisService,
            MonitorJobLauncher jobLauncher,
            MonitorZpokonpiVerificationService zpokonpiVerificationService) {
        this.properties = properties;
        this.sigmaRefreshService = sigmaRefreshService;
        this.eopImportService = eopImportService;
        this.scraperService = scraperService;
        this.aiService = aiService;
        this.aiAnalysisService = aiAnalysisService;
        this.jobLauncher = jobLauncher;
        this.zpokonpiVerificationService = zpokonpiVerificationService;
    }

    /** SIGMA cache refresh every 6h at 04:00 Sofia — diff import, regional whitelist only. */
    @Scheduled(cron = "0 0 4,10,16,22 * * *", zone = "Europe/Sofia")
    public void scheduledSigmaImport() {
        if (!properties.isSchedulerEnabled() || !properties.isSigmaEnabled()) {
            return;
        }
        log.info("Queueing scheduled SIGMA cache refresh for oblast Smolyan");
        jobLauncher.launch("SIGMA", "SIGMA cache refresh (по график)", () -> {
            var run = sigmaRefreshService.refreshRegionalCache();
            return MonitorJobLauncher.JobResult.ok(run == null ? "" : run.getMessage());
        });
    }

    /** EOP open-data buckets at 05:00 Sofia — complements SIGMA with recent annexes. */
    @Scheduled(cron = "0 0 5 * * *", zone = "Europe/Sofia")
    public void scheduledEopImport() {
        if (!properties.isSchedulerEnabled() || !properties.isEopEnabled()) {
            return;
        }
        log.info("Queueing scheduled EOP import ({} days)", properties.getEopDays());
        jobLauncher.launch("EOP", "EOP импорт (по график)", () -> {
            var run = eopImportService.importRecentDays(properties.getEopDays());
            return MonitorJobLauncher.JobResult.ok(run == null ? "" : run.getMessage());
        });
    }

    /** smolyan.bg scrape at 06:00 Sofia — requires Playwright sidecar. */
    @Scheduled(cron = "0 0 6 * * *", zone = "Europe/Sofia")
    public void scheduledSmolyanScrape() {
        if (!properties.isSchedulerEnabled() || !properties.isScrapeEnabled()) {
            return;
        }
        log.info("Queueing scheduled smolyan.bg scrape");
        jobLauncher.launch("SCRAPE", "smolyan.bg scrape (по график)", () -> {
            var run = scraperService.scrapeAll();
            return MonitorJobLauncher.JobResult.ok(run == null ? "" : run.getMessage());
        });
    }

    /** Gemini summaries for newly scraped documents at 06:30 Sofia. */
    @Scheduled(cron = "0 30 6 * * *", zone = "Europe/Sofia")
    public void scheduledAiBatch() {
        if (!properties.isSchedulerEnabled() || !properties.isAiBatchEnabled()) {
            return;
        }
        log.info("Queueing scheduled monitor AI batch (limit {})", properties.getAiBatchLimit());
        jobLauncher.launch("AI", "AI batch (по график)", () ->
                MonitorJobLauncher.JobResult.ok(
                        aiService.processPendingBatch(properties.getAiBatchLimit()).summaryMessage()));
    }

    /** Regional citizen report at 07:00 Sofia — after scrape + AI batch. */
    @Scheduled(cron = "0 0 7 * * *", zone = "Europe/Sofia")
    public void scheduledRegionalReport() {
        if (!properties.isSchedulerEnabled() || !properties.isAiBatchEnabled()) {
            return;
        }
        log.info("Queueing scheduled regional AI citizen report");
        jobLauncher.launch("AI_REPORT", "AI доклад (по график)", () -> {
            var report = aiAnalysisService.generateRegionalReport(MonitorScope.of(null));
            String msg = report.aiGenerated()
                    ? "AI доклад генериран"
                    : "AI доклад неуспешен — проверете GEMINI_API_KEY";
            return MonitorJobLauncher.JobResult.ok(msg);
        });
    }

    /** Weekly ZPKONPI cross-check for all regional councilor profiles — Sunday 08:00 Sofia. */
    @Scheduled(cron = "0 0 8 * * SUN", zone = "Europe/Sofia")
    public void scheduledZpokonpiVerification() {
        if (!properties.isSchedulerEnabled() || !properties.isZpokonpiEnabled()) {
            return;
        }
        log.info("Queueing scheduled ZPKONPI verification for oblast Smolyan councilors");
        jobLauncher.launch("ZPKONPI", "ЗПКОНПИ проверка (по график)", () ->
                MonitorJobLauncher.JobResult.ok(zpokonpiVerificationService.verifyAll().message()));
    }
}

package smolyanVote.smolyanVote.controllers;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.config.MonitorIngestionProperties;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionStatus;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;
import smolyanVote.smolyanVote.services.monitor.EopImportService;
import smolyanVote.smolyanVote.services.monitor.MonitorAdminService;
import smolyanVote.smolyanVote.services.monitor.MonitorAiAnalysisService;
import smolyanVote.smolyanVote.services.monitor.MonitorAiService;
import smolyanVote.smolyanVote.services.monitor.MonitorBudgetAdminService;
import smolyanVote.smolyanVote.services.monitor.MonitorCompanyAdminService;
import smolyanVote.smolyanVote.services.monitor.MonitorCompanyEnrichmentService;
import smolyanVote.smolyanVote.services.monitor.MonitorContractAdminService;
import smolyanVote.smolyanVote.services.monitor.MonitorCouncilorAdminService;
import smolyanVote.smolyanVote.services.monitor.MonitorCouncilorSyncService;
import smolyanVote.smolyanVote.services.monitor.MonitorIngestionRunService;
import smolyanVote.smolyanVote.services.monitor.MonitorInsightEnrichmentService;
import smolyanVote.smolyanVote.services.monitor.MonitorJobLauncher;
import smolyanVote.smolyanVote.services.monitor.MonitorOcrService;
import smolyanVote.smolyanVote.services.monitor.MonitorService;
import smolyanVote.smolyanVote.services.monitor.MonitorScope;
import smolyanVote.smolyanVote.services.monitor.MonitorSettingsService;
import smolyanVote.smolyanVote.services.monitor.SigmaImportService;
import smolyanVote.smolyanVote.services.monitor.SmolyanBgScraperService;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminAiStatsDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminCompanyDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminContractDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminDocumentDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminIngestionLogDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorBudgetLineDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorBudgetLineRequest;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCompanyUpdateRequest;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorContractUpdateRequest;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCouncilorCardDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCouncilorRequest;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorIngestionStatusDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorSchedulerSettingsDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/monitor")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMonitorController {

    private final MonitorAdminService monitorAdminService;
    private final MonitorService monitorService;
    private final SigmaImportService sigmaImportService;
    private final SmolyanBgScraperService scraperService;
    private final MonitorAiService aiService;
    private final MonitorInsightEnrichmentService insightEnrichmentService;
    private final MonitorAiAnalysisService aiAnalysisService;
    private final MonitorCompanyEnrichmentService enrichmentService;
    private final MonitorDocumentRepository documentRepository;
    private final EopImportService eopImportService;
    private final MonitorOcrService ocrService;
    private final MonitorCouncilorSyncService councilorSyncService;
    private final MonitorIngestionProperties ingestionProperties;
    private final MonitorContractAdminService contractAdminService;
    private final MonitorCompanyAdminService companyAdminService;
    private final MonitorCouncilorAdminService councilorAdminService;
    private final MonitorBudgetAdminService budgetAdminService;
    private final MonitorSettingsService settingsService;
    private final MonitorJobLauncher jobLauncher;

    public AdminMonitorController(
            MonitorAdminService monitorAdminService,
            MonitorService monitorService,
            SigmaImportService sigmaImportService,
            SmolyanBgScraperService scraperService,
            MonitorAiService aiService,
            MonitorInsightEnrichmentService insightEnrichmentService,
            MonitorAiAnalysisService aiAnalysisService,
            MonitorCompanyEnrichmentService enrichmentService,
            MonitorDocumentRepository documentRepository,
            EopImportService eopImportService,
            MonitorOcrService ocrService,
            MonitorCouncilorSyncService councilorSyncService,
            MonitorIngestionProperties ingestionProperties,
            MonitorContractAdminService contractAdminService,
            MonitorCompanyAdminService companyAdminService,
            MonitorCouncilorAdminService councilorAdminService,
            MonitorBudgetAdminService budgetAdminService,
            MonitorSettingsService settingsService,
            MonitorJobLauncher jobLauncher) {
        this.monitorAdminService = monitorAdminService;
        this.monitorService = monitorService;
        this.sigmaImportService = sigmaImportService;
        this.scraperService = scraperService;
        this.aiService = aiService;
        this.insightEnrichmentService = insightEnrichmentService;
        this.aiAnalysisService = aiAnalysisService;
        this.enrichmentService = enrichmentService;
        this.documentRepository = documentRepository;
        this.eopImportService = eopImportService;
        this.ocrService = ocrService;
        this.councilorSyncService = councilorSyncService;
        this.ingestionProperties = ingestionProperties;
        this.contractAdminService = contractAdminService;
        this.companyAdminService = companyAdminService;
        this.councilorAdminService = councilorAdminService;
        this.budgetAdminService = budgetAdminService;
        this.settingsService = settingsService;
        this.jobLauncher = jobLauncher;
    }

    private static ResponseEntity<Map<String, Object>> launched(MonitorJobLauncher.JobState state) {
        HttpStatus http = state.status() == MonitorJobLauncher.JobStatus.BUSY
                ? HttpStatus.OK
                : HttpStatus.ACCEPTED;
        return ResponseEntity.status(http).body(jobBody(state));
    }

    private static Map<String, Object> jobBody(MonitorJobLauncher.JobState state) {
        Map<String, Object> body = new HashMap<>();
        body.put("key", state.key());
        body.put("label", state.label());
        body.put("status", state.status().name());
        body.put("message", state.message());
        body.put("startedAt", state.startedAt() == null ? null : state.startedAt().toString());
        body.put("finishedAt", state.finishedAt() == null ? null : state.finishedAt().toString());
        return body;
    }

    private static MonitorJobLauncher.JobResult runResult(MonitorIngestionRunEntity run) {
        if (run == null) {
            return MonitorJobLauncher.JobResult.failed("Импортът не върна резултат.");
        }
        return new MonitorJobLauncher.JobResult(run.getStatus() != MonitorIngestionStatus.FAILED, summarize(run));
    }

    private static String summarize(MonitorIngestionRunEntity run) {
        if (run == null) {
            return "няма резултат";
        }
        if (run.getMessage() != null && !run.getMessage().isBlank()) {
            return run.getMessage();
        }
        return (run.getRecordsProcessed() == null ? 0 : run.getRecordsProcessed()) + " записа";
    }

    @GetMapping(value = "/ingestion/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorIngestionStatusDTO> ingestionStatus() {
        return ResponseEntity.ok(monitorService.getIngestionStatus());
    }

    @GetMapping(value = "/ingestion/logs", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<MonitorAdminIngestionLogDTO>> ingestionLogs(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(monitorAdminService.getIngestionLogs(limit));
    }

    @GetMapping(value = "/documents", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<MonitorAdminDocumentDTO>> documents(
            @RequestParam(defaultValue = "recent") String filter,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(monitorAdminService.listDocuments(filter, limit));
    }

    @GetMapping(value = "/ai/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorAdminAiStatsDTO> aiStats() {
        return ResponseEntity.ok(monitorAdminService.getAiStats());
    }

    /**
     * Live view of background ingestion jobs.
     *
     * <p>Imports run for minutes, so the panel starts them and then polls here instead of
     * holding an HTTP request open past the proxy timeout.
     */
    @GetMapping(value = "/ingestion/jobs", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Map<String, Object>>> ingestionJobs() {
        return ResponseEntity.ok(jobLauncher.snapshot().stream().map(AdminMonitorController::jobBody).toList());
    }

    @PostMapping("/ingestion/trigger-sigma")
    public ResponseEntity<Map<String, Object>> triggerSigma() {
        return launched(jobLauncher.launch("SIGMA", "SIGMA импорт",
                () -> runResult(sigmaImportService.importRegionalContracts())));
    }

    @PostMapping("/ingestion/trigger-scrape")
    public ResponseEntity<Map<String, Object>> triggerScrape() {
        return launched(jobLauncher.launch("SCRAPE", "smolyan.bg scrape",
                () -> runResult(scraperService.scrapeAll())));
    }

    @PostMapping("/ingestion/trigger-eop")
    public ResponseEntity<Map<String, Object>> triggerEop(
            @RequestParam(defaultValue = "7") int days) {
        int capped = Math.min(days, ingestionProperties.getEopMaxDays());
        return launched(jobLauncher.launch("EOP", "EOP импорт (" + capped + " дни)",
                () -> runResult(eopImportService.importRecentDays(capped))));
    }

    @PostMapping("/ingestion/ocr-batch")
    public ResponseEntity<Map<String, Object>> ocrBatch(
            @RequestParam(defaultValue = "10") int limit) {
        int capped = Math.min(limit, 25);
        return launched(jobLauncher.launch("OCR", "OCR batch", () -> {
            int processed = ocrService.processBatch(capped);
            String note = ocrService.isTesseractAvailable() ? "" : " (tesseract липсва на сървъра)";
            return MonitorJobLauncher.JobResult.ok("OCR: " + processed + " документа" + note);
        }));
    }

    @PostMapping("/ingestion/sync-councilors")
    public ResponseEntity<Map<String, Object>> syncCouncilors() {
        return launched(jobLauncher.launch("COUNCILORS", "Sync на съветници", () -> {
            var result = councilorSyncService.syncFromScraper();
            return new MonitorJobLauncher.JobResult(result.ok(), result.message());
        }));
    }

    @PostMapping("/ai/process-batch")
    public ResponseEntity<Map<String, Object>> processAiBatch(
            @RequestParam(defaultValue = "25") int limit) {
        int capped = Math.min(limit, 100);
        return launched(jobLauncher.launch("AI", "AI batch", () -> {
            MonitorAiService.AiBatchResult result = aiService.processPendingBatch(capped);
            return MonitorJobLauncher.JobResult.ok(result.summaryMessage());
        }));
    }

    @PostMapping("/ai/regional-report")
    public ResponseEntity<Map<String, Object>> generateRegionalReport(
            @RequestParam(required = false) String authority) {
        MonitorScope scope = MonitorScope.of(authority);
        return launched(jobLauncher.launch("AI_REPORT", "AI доклад", () -> {
            var report = aiAnalysisService.generateRegionalReport(scope);
            if (!report.aiGenerated()) {
                return MonitorJobLauncher.JobResult.failed(
                        "AI доклад не е генериран — проверете GEMINI_API_KEY и backend.log");
            }
            return MonitorJobLauncher.JobResult.ok("AI доклад готов — "
                    + report.conclusions().size() + " заключения");
        }));
    }

    @PostMapping("/enrich-insights")
    public ResponseEntity<Map<String, Object>> enrichInsights() {
        return launched(jobLauncher.launch("ENRICH", "Обогати анализи", () -> {
            int updated = insightEnrichmentService.enrichAllContracts();
            return MonitorJobLauncher.JobResult.ok("Анализ: обновени " + updated + " договора (без Gemini)");
        }));
    }

    @PostMapping("/enrichment/trade-register")
    public ResponseEntity<Map<String, Object>> enrichTradeRegister(
            @RequestParam(defaultValue = "25") int limit) {
        int capped = Math.min(limit, 100);
        return launched(jobLauncher.launch("TRADE_REGISTER", "Търговски регистър", () ->
                MonitorJobLauncher.JobResult.ok("Търговски регистър: обновени "
                        + enrichmentService.enrichBatch(capped) + " фирми")));
    }

    /** Whole chain in one background job — the steps share a queue, so they run in order. */
    @PostMapping("/ingestion/trigger-pipeline")
    public ResponseEntity<Map<String, Object>> triggerPipeline() {
        return launched(jobLauncher.launch("PIPELINE", "Пълен pipeline", () -> {
            List<String> parts = new java.util.ArrayList<>();
            List<String> problems = new java.util.ArrayList<>();

            record Step(String label, java.util.concurrent.Callable<String> action) {
            }
            List<Step> steps = List.of(
                    new Step("SIGMA", () -> summarize(sigmaImportService.importRegionalContracts())),
                    new Step("EOP", () -> summarize(eopImportService.importRecentDays(7))),
                    new Step("scrape", () -> summarize(scraperService.scrapeAll())),
                    new Step("OCR", () -> ocrService.processBatch(10) + " документа"),
                    new Step("AI", () -> aiService.processPendingBatch(50).summaryMessage()),
                    new Step("Търговски регистър", () -> enrichmentService.enrichBatch(50) + " фирми"),
                    new Step("съветници", () -> councilorSyncService.syncFromScraper().message()));

            for (Step step : steps) {
                try {
                    parts.add(step.label() + ": " + step.action().call());
                } catch (Exception ex) {
                    problems.add(step.label() + ": " + MonitorIngestionRunService.describe(ex));
                }
            }

            String message = "Pipeline — " + String.join(", ", parts)
                    + (problems.isEmpty() ? "" : " | Грешки: " + String.join("; ", problems));
            return new MonitorJobLauncher.JobResult(problems.isEmpty(), message);
        }));
    }

    @PostMapping("/enrichment/trade-register/{eik}")
    public ResponseEntity<Map<String, Object>> enrichTradeRegisterOne(@PathVariable String eik) {
        int updated = enrichmentService.enrichCompany(eik);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @PostMapping("/ingestion/documents")
    public ResponseEntity<Map<String, Object>> ingestDocuments(
            @RequestBody List<smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorScrapedDocumentDTO> documents) {
        int count = scraperService.ingestDocuments(documents);
        MonitorAiService.AiBatchResult ai = aiService.processPendingBatch(50);
        return ResponseEntity.ok(Map.of(
                "ingested", count,
                "aiProcessed", ai.total(),
                "aiDocuments", ai.documents(),
                "aiContracts", ai.contracts()));
    }

    @PostMapping("/ai/reprocess/{documentId}")
    public ResponseEntity<Map<String, String>> reprocessAi(@PathVariable Long documentId) {
        aiService.reprocessDocument(documentId);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    @GetMapping(value = "/logs", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<MonitorAdminIngestionLogDTO>> logs() {
        return ResponseEntity.ok(monitorAdminService.getIngestionLogs(20));
    }

    @GetMapping(value = "/documents/{id}/raw", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> rawDocument(@PathVariable Long id) {
        MonitorDocumentEntity doc = documentRepository.findById(id)
                .orElse(null);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }
        Map<String, Object> body = new HashMap<>();
        body.put("id", doc.getId());
        body.put("title", doc.getTitle());
        body.put("rawContent", doc.getRawContent());
        body.put("sourceUrl", doc.getSourceUrl());
        body.put("contentHash", doc.getContentHash());
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable Long id) {
        if (!documentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        documentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    // ---- Contracts ----------------------------------------------------

    @GetMapping(value = "/contracts", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Page<MonitorAdminContractDTO>> searchContracts(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(contractAdminService.search(search, page, size));
    }

    @GetMapping(value = "/contracts/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorAdminContractDTO> getContract(@PathVariable Long id) {
        return ResponseEntity.ok(contractAdminService.get(id));
    }

    @PutMapping(value = "/contracts/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorAdminContractDTO> updateContract(
            @PathVariable Long id, @RequestBody MonitorContractUpdateRequest request) {
        return ResponseEntity.ok(contractAdminService.update(id, request));
    }

    @DeleteMapping("/contracts/{id}")
    public ResponseEntity<Map<String, Object>> deleteContract(@PathVariable Long id) {
        contractAdminService.delete(id);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    // ---- Companies ------------------------------------------------------

    @GetMapping(value = "/companies", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Page<MonitorAdminCompanyDTO>> searchCompanies(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(companyAdminService.search(search, page, size));
    }

    @PutMapping(value = "/companies/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorAdminCompanyDTO> updateCompany(
            @PathVariable Long id, @RequestBody MonitorCompanyUpdateRequest request) {
        return ResponseEntity.ok(companyAdminService.update(id, request));
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<Map<String, Object>> deleteCompany(@PathVariable Long id) {
        companyAdminService.delete(id);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    // ---- Councilors ------------------------------------------------------

    @GetMapping(value = "/councilors", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<MonitorCouncilorCardDTO>> listCouncilors() {
        return ResponseEntity.ok(councilorAdminService.list());
    }

    @PostMapping(value = "/councilors", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorCouncilorCardDTO> createCouncilor(@RequestBody MonitorCouncilorRequest request) {
        return ResponseEntity.ok(councilorAdminService.create(request));
    }

    @PutMapping(value = "/councilors/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorCouncilorCardDTO> updateCouncilor(
            @PathVariable Long id, @RequestBody MonitorCouncilorRequest request) {
        return ResponseEntity.ok(councilorAdminService.update(id, request));
    }

    @DeleteMapping("/councilors/{id}")
    public ResponseEntity<Map<String, Object>> deleteCouncilor(@PathVariable Long id) {
        councilorAdminService.delete(id);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    // ---- Budget lines ------------------------------------------------------

    @GetMapping(value = "/budget-lines", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<MonitorBudgetLineDTO>> listBudgetLines(
            @RequestParam(required = false) Integer year) {
        int y = year != null ? year : smolyanVote.smolyanVote.services.monitor.MonitorBudgetConfig.BUDGET_YEAR;
        return ResponseEntity.ok(budgetAdminService.list(y));
    }

    @PostMapping(value = "/budget-lines", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorBudgetLineDTO> createBudgetLine(@RequestBody MonitorBudgetLineRequest request) {
        return ResponseEntity.ok(budgetAdminService.create(request));
    }

    @PutMapping(value = "/budget-lines/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorBudgetLineDTO> updateBudgetLine(
            @PathVariable Long id, @RequestBody MonitorBudgetLineRequest request) {
        return ResponseEntity.ok(budgetAdminService.update(id, request));
    }

    @DeleteMapping("/budget-lines/{id}")
    public ResponseEntity<Map<String, Object>> deleteBudgetLine(@PathVariable Long id) {
        budgetAdminService.delete(id);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    // ---- Scheduler settings ------------------------------------------------------

    @GetMapping(value = "/settings/scheduler", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorSchedulerSettingsDTO> getSchedulerSettings() {
        return ResponseEntity.ok(settingsService.getEffectiveSettings());
    }

    @PutMapping(value = "/settings/scheduler", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MonitorSchedulerSettingsDTO> updateSchedulerSettings(
            @RequestBody MonitorSchedulerSettingsDTO request) {
        return ResponseEntity.ok(settingsService.updateSettings(request));
    }
}

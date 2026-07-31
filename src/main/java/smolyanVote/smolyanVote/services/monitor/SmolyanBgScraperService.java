package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import smolyanVote.smolyanVote.config.MonitorScraperProperties;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorScrapedDocumentDTO;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class SmolyanBgScraperService {

    private static final Logger log = LoggerFactory.getLogger(SmolyanBgScraperService.class);

    private final MonitorIngestionRunService runService;
    private final MonitorDocumentIngestService ingestService;
    private final MonitorCouncilorSyncService councilorSyncService;
    private final MonitorScraperProperties scraperProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public SmolyanBgScraperService(
            MonitorIngestionRunService runService,
            MonitorDocumentIngestService ingestService,
            MonitorCouncilorSyncService councilorSyncService,
            MonitorScraperProperties scraperProperties,
            ObjectMapper objectMapper) {
        this.runService = runService;
        this.ingestService = ingestService;
        this.councilorSyncService = councilorSyncService;
        this.scraperProperties = scraperProperties;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(scraperProperties.getConnectTimeoutMs());
        factory.setReadTimeout(scraperProperties.getReadTimeoutMs());
        this.restTemplate = new RestTemplate(factory);
    }

    /** Not transactional: the run log is written separately so a failure still leaves a trace. */
    public MonitorIngestionRunEntity scrapeAll() {
        MonitorIngestionRunEntity run = runService.start(MonitorIngestionType.SMOLYAN_BG);
        try {
            List<MonitorScrapedDocumentDTO> documents = fetchFromSidecar();
            if (documents.isEmpty()) {
                throw new IllegalStateException(
                        "smolyan.bg върна 0 документа. Рестартирайте start-scraper.bat, проверете: cd scraper && npm run probe");
            }
            int processed = ingestService.ingestBatch(documents);
            MonitorCouncilorSyncService.SyncResult council = councilorSyncService.syncFromScraper();
            String councilPart = council.ok() && council.updated() > 0
                    ? ", " + council.updated() + " съветници"
                    : council.ok() ? "" : ", съветници: " + council.message();
            return runService.succeed(run.getId(), processed,
                    "smolyan.bg: " + processed + " документа" + councilPart
                            + " — AI: пуснете «AI batch» отделно");
        } catch (Exception ex) {
            log.error("smolyan.bg scrape failed", ex);
            return runService.fail(run.getId(), 0, MonitorIngestionRunService.describe(ex));
        }
    }

    private List<MonitorScrapedDocumentDTO> fetchFromSidecar() throws Exception {
        String base = scraperProperties.getUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String scrapeUrl = base + "/scrape?maxPerSection=" + scraperProperties.getMaxDocumentsPerSection();

        try {
            restTemplate.getForObject(base + "/health", String.class);
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Scraper sidecar not reachable at " + base + ". Start it: cd scraper && npm install && npx playwright install chromium && npm start",
                    ex);
        }

        String json = restTemplate.postForObject(scrapeUrl, Map.of(), String.class);
        if (json == null || json.isBlank()) {
            return List.of();
        }

        JsonNode root = objectMapper.readTree(json);
        if (root.hasNonNull("error")) {
            String code = root.path("code").asText("");
            String hint = root.path("hint").asText("");
            String msg = root.path("error").asText("Scrape failed");
            if ("CLOUDFLARE_BLOCKED".equals(code) || "SESSION_MISSING".equals(code) || "ZERO_DOCUMENTS".equals(code)) {
                throw new IllegalStateException(
                        msg + (hint.isBlank() ? "" : " — " + hint));
            }
            throw new IllegalStateException(msg);
        }
        JsonNode docs = root.path("documents");
        if (!docs.isArray()) {
            return List.of();
        }
        return objectMapper.convertValue(docs, new TypeReference<List<MonitorScrapedDocumentDTO>>() {
        });
    }

    /** Manual ingest when sidecar POSTs directly to admin API. */
    @Transactional
    public int ingestDocuments(List<MonitorScrapedDocumentDTO> documents) {
        return ingestService.ingestBatch(documents != null ? documents : new ArrayList<>());
    }
}

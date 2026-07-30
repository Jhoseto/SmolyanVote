package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;
import smolyanVote.smolyanVote.config.MonitorScraperProperties;
import smolyanVote.smolyanVote.models.monitor.MonitorCouncilorEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCouncilorRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MonitorCouncilorSyncService {

    private static final Logger log = LoggerFactory.getLogger(MonitorCouncilorSyncService.class);

    private final MonitorCouncilorRepository councilorRepository;
    private final MonitorScraperProperties scraperProperties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final TransactionTemplate transactionTemplate;

    public MonitorCouncilorSyncService(
            MonitorCouncilorRepository councilorRepository,
            MonitorScraperProperties scraperProperties,
            ObjectMapper objectMapper,
            PlatformTransactionManager transactionManager) {
        this.councilorRepository = councilorRepository;
        this.scraperProperties = scraperProperties;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(scraperProperties.getConnectTimeoutMs());
        factory.setReadTimeout(scraperProperties.getReadTimeoutMs());
        this.restTemplate = new RestTemplate(factory);
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    /** Outcome of a sync attempt — a sidecar that is not running is an expected state, not a fault. */
    public record SyncResult(int updated, boolean ok, String message) {
    }

    public SyncResult syncFromScraper() {
        String base = scraperProperties.getUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        try {
            restTemplate.getForObject(base + "/health", String.class);
        } catch (Exception ex) {
            log.warn("Councilor sync skipped — scraper sidecar unreachable at {}", base);
            return new SyncResult(0, false, "Scraper sidecar не отговаря на " + base
                    + ". Стартирайте го: cd scraper && npm install && npx playwright install chromium && npm start");
        }
        try {
            List<CouncilorRow> rows = fetchCouncilors(base);
            if (rows.isEmpty()) {
                return new SyncResult(0, true, "Scraper не върна съветници (страницата на ОбС може да е променена)");
            }
            Integer updated = transactionTemplate.execute(status -> persist(rows));
            int count = updated == null ? 0 : updated;
            return new SyncResult(count, true, "Обновени " + count + " профила на съветници");
        } catch (Exception ex) {
            log.error("Councilor sync failed", ex);
            return new SyncResult(0, false, MonitorIngestionRunService.describe(ex));
        }
    }

    private List<CouncilorRow> fetchCouncilors(String base) throws Exception {
        String json = restTemplate.postForObject(base + "/scrape-council", Map.of(), String.class);
        if (json == null || json.isBlank()) {
            return List.of();
        }
        JsonNode members = objectMapper.readTree(json).path("councilors");
        if (!members.isArray()) {
            return List.of();
        }
        return objectMapper.convertValue(members, new TypeReference<List<CouncilorRow>>() {
        });
    }

    private int persist(List<CouncilorRow> rows) {
        Map<String, MonitorCouncilorEntity> byName = new HashMap<>();
        for (MonitorCouncilorEntity existing : councilorRepository.findAll()) {
            if (existing.getFullName() != null) {
                byName.put(existing.getFullName().trim().toLowerCase(), existing);
            }
        }

        int updated = 0;
        for (CouncilorRow row : rows) {
            if (row.name() == null || row.name().isBlank()) {
                continue;
            }
            String name = row.name().trim();
            MonitorCouncilorEntity entity = byName.computeIfAbsent(
                    name.toLowerCase(), key -> new MonitorCouncilorEntity());
            entity.setFullName(name);
            entity.setRoleLabel(row.role() != null ? row.role().trim() : "Съветник");
            if (row.party() != null && !row.party().isBlank()) {
                entity.setParty(row.party().trim());
            }
            entity.setMandatePeriod(row.mandate() != null ? row.mandate() : "2023–2027");
            if (row.sourceUrl() != null) {
                entity.setSourceUrl(row.sourceUrl());
            }
            if (!entity.isZpokonpiChecked()) {
                entity.setZpokonpiNote("Кръстосана проверка с декларации по ЗПКОНПИ — предстои.");
            }
            councilorRepository.save(entity);
            updated++;
        }
        return updated;
    }

    private record CouncilorRow(String name, String role, String party, String mandate, String sourceUrl) {
    }
}

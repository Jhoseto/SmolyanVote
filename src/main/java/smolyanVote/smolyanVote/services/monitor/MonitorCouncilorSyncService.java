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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
        JsonNode root = objectMapper.readTree(json);
        if (root.hasNonNull("error")) {
            String msg = root.path("error").asText("Council scrape failed");
            if ("CLOUDFLARE_BLOCKED".equals(root.path("code").asText(""))) {
                throw new IllegalStateException(
                        msg + " — пуснете setup-session.bat в scraper/ и Sync съветници отново.");
            }
            throw new IllegalStateException(msg);
        }
        JsonNode members = root.path("councilors");
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
        Set<String> scrapedNames = new HashSet<>();
        for (CouncilorRow row : rows) {
            if (row.name() == null || row.name().isBlank()) {
                continue;
            }
            String name = row.name().trim();
            scrapedNames.add(name.toLowerCase());
            MonitorCouncilorEntity entity = byName.computeIfAbsent(
                    name.toLowerCase(), key -> new MonitorCouncilorEntity());
            entity.setFullName(clamp(name, 200));
            entity.setAuthorityEik(MonitorRegionalConfig.SMOLYAN_CITY_EIK);
            entity.setRoleLabel(clamp(row.role() != null ? row.role() : "Съветник", 120));
            String party = sanitizeParty(row.party());
            if (party != null) {
                entity.setParty(party);
            }
            entity.setMandatePeriod(clamp(row.mandate() != null ? row.mandate() : "2023–2027", 64));
            if (row.sourceUrl() != null) {
                entity.setSourceUrl(clamp(row.sourceUrl(), 1000));
            }
            if (!entity.isZpokonpiChecked()) {
                entity.setZpokonpiNote("Кръстосана проверка с декларации по ЗПКОНПИ — предстои.");
            }
            councilorRepository.save(entity);
            updated++;
        }

        if (scrapedNames.size() >= 10) {
            for (MonitorCouncilorEntity existing : councilorRepository.findByAuthorityEikOrderByFullNameAsc(
                    MonitorRegionalConfig.SMOLYAN_CITY_EIK)) {
                String key = existing.getFullName() != null ? existing.getFullName().trim().toLowerCase() : "";
                if (!key.isEmpty() && !scrapedNames.contains(key)) {
                    councilorRepository.delete(existing);
                }
            }
        }

        return updated;
    }

    private static String clamp(String value, int maxLen) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        if (trimmed.length() <= maxLen) {
            return trimmed;
        }
        return trimmed.substring(0, maxLen).trim();
    }

    /** Party from inline page text can be an entire paragraph — keep a short label only. */
    private static String sanitizeParty(String party) {
        if (party == null || party.isBlank()) {
            return null;
        }
        String trimmed = party.trim().replaceAll("\\s+", " ");
        if (trimmed.length() > 80) {
            int cut = trimmed.indexOf(';');
            if (cut < 0) {
                cut = trimmed.indexOf(" – ");
            }
            if (cut < 0) {
                cut = trimmed.indexOf(" - ");
            }
            if (cut > 0 && cut < trimmed.length()) {
                trimmed = trimmed.substring(0, cut).trim();
            }
        }
        trimmed = clamp(trimmed, 120);
        return trimmed != null && trimmed.length() >= 2 ? trimmed : null;
    }

    private record CouncilorRow(String name, String role, String party, String mandate, String sourceUrl) {
    }
}

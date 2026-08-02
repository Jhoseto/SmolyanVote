package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import smolyanVote.smolyanVote.config.MonitorScraperProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Playwright sidecar fetch for bot-protected ZPKONPI pages (smolyan.bg, banite.egov.bg). */
@Component
class MonitorZpokonpiScraperClient {

    private static final Logger log = LoggerFactory.getLogger(MonitorZpokonpiScraperClient.class);

    private final MonitorScraperProperties scraperProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    MonitorZpokonpiScraperClient(MonitorScraperProperties scraperProperties, ObjectMapper objectMapper) {
        this.scraperProperties = scraperProperties;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(scraperProperties.getConnectTimeoutMs());
        factory.setReadTimeout(Math.max(scraperProperties.getReadTimeoutMs(), 120_000));
        this.restTemplate = new RestTemplate(factory);
    }

    record PageResult(String url, boolean ok, String html, String error) {
    }

    List<PageResult> fetchPages(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return List.of();
        }
        String base = scraperProperties.getUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        try {
            restTemplate.getForObject(base + "/health", String.class);
        } catch (Exception ex) {
            log.warn("ZPKONPI scraper sidecar unavailable at {}: {}", base, ex.getMessage());
            return urls.stream()
                    .map(u -> new PageResult(u, false, null, "Scraper sidecar недостъпен — стартирайте scraper"))
                    .toList();
        }
        try {
            String json = restTemplate.postForObject(base + "/fetch-pages", Map.of("urls", urls), String.class);
            if (json == null || json.isBlank()) {
                return List.of();
            }
            JsonNode root = objectMapper.readTree(json);
            JsonNode pages = root.path("pages");
            if (!pages.isArray()) {
                return List.of();
            }
            return objectMapper.convertValue(pages, new TypeReference<List<PageResult>>() {
            });
        } catch (Exception ex) {
            log.warn("ZPKONPI fetch-pages failed: {}", ex.getMessage());
            List<PageResult> failed = new ArrayList<>();
            for (String url : urls) {
                failed.add(new PageResult(url, false, null, ex.getMessage()));
            }
            return failed;
        }
    }
}

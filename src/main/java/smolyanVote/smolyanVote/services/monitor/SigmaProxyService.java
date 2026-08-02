package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import smolyanVote.smolyanVote.config.SigmaProxyProperties;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Server-side cache for sigma.midt.bg CSV/JSON exports — one IP, shared TTL, 429-aware retries.
 */
@Service
public class SigmaProxyService {

    private static final Logger log = LoggerFactory.getLogger(SigmaProxyService.class);
    private static final int TOO_MANY_REQUESTS = 429;

    private final RestTemplate restTemplate;
    private final SigmaProxyProperties properties;
    private final ObjectMapper objectMapper;
    private final Cache<String, CachedCsv> csvCache;
    private final Cache<String, CachedJson> jsonCache;

    public SigmaProxyService(SigmaProxyProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
        Duration ttl = Duration.ofHours(Math.max(1, properties.getCacheTtlHours()));
        this.csvCache = Caffeine.newBuilder().expireAfterWrite(ttl).maximumSize(32).build();
        this.jsonCache = Caffeine.newBuilder().expireAfterWrite(ttl).maximumSize(5000).build();
    }

    public record CachedCsv(String body, Instant fetchedAt) {
    }

    public record CachedJson(JsonNode body, Instant fetchedAt) {
    }

    /** Cached CSV for authority EIK; bypassCache=true for admin refresh. */
    public CachedCsv getContractsCsv(String authorityEik, boolean bypassCache) {
        String key = "csv:" + authorityEik;
        if (!bypassCache) {
            CachedCsv hit = csvCache.getIfPresent(key);
            if (hit != null) {
                return hit;
            }
        }
        String url = MonitorRegionalConfig.SIGMA_CONTRACTS_CSV + "?authority=" + authorityEik;
        String body = fetchBytes(url);
        CachedCsv cached = new CachedCsv(body, Instant.now());
        csvCache.put(key, cached);
        return cached;
    }

    /** Optional year filter uses SIGMA query param. */
    public CachedCsv getContractsCsv(String authorityEik, Integer year, boolean bypassCache) {
        if (year == null) {
            return getContractsCsv(authorityEik, bypassCache);
        }
        String key = "csv:" + authorityEik + ":y" + year;
        if (!bypassCache) {
            CachedCsv hit = csvCache.getIfPresent(key);
            if (hit != null) {
                return hit;
            }
        }
        String url = MonitorRegionalConfig.SIGMA_CONTRACTS_CSV
                + "?authority=" + authorityEik + "&year=" + year;
        String body = fetchBytes(url);
        CachedCsv cached = new CachedCsv(body, Instant.now());
        csvCache.put(key, cached);
        return cached;
    }

    public Optional<CachedJson> getContractJson(String sigmaId, boolean bypassCache) {
        if (sigmaId == null || sigmaId.isBlank() || sigmaId.startsWith("eop:")) {
            return Optional.empty();
        }
        String key = "json:" + sigmaId;
        if (!bypassCache) {
            CachedJson hit = jsonCache.getIfPresent(key);
            if (hit != null) {
                return Optional.of(hit);
            }
        }
        String encoded = URLEncoder.encode(sigmaId, StandardCharsets.UTF_8);
        String url = MonitorRegionalConfig.SIGMA_BASE_URL + "/contracts/" + encoded + ".json";
        try {
            byte[] bytes = fetchBytesRaw(url);
            if (bytes == null || bytes.length == 0) {
                return Optional.empty();
            }
            JsonNode node = objectMapper.readTree(bytes);
            CachedJson cached = new CachedJson(node, Instant.now());
            jsonCache.put(key, cached);
            return Optional.of(cached);
        } catch (Exception ex) {
            log.warn("SIGMA JSON fetch failed for {}: {}", sigmaId, ex.getMessage());
            return Optional.empty();
        }
    }

    public void invalidateAll() {
        csvCache.invalidateAll();
        jsonCache.invalidateAll();
        log.info("SIGMA proxy cache invalidated");
    }

    public Instant csvCacheRefreshedAt(String authorityEik) {
        CachedCsv cached = csvCache.getIfPresent("csv:" + authorityEik);
        return cached != null ? cached.fetchedAt() : null;
    }

    private String fetchBytes(String url) {
        byte[] bytes = fetchBytesRaw(url);
        if (bytes == null || bytes.length == 0) {
            return "";
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private byte[] fetchBytesRaw(String url) {
        for (int attempt = 1; ; attempt++) {
            try {
                return restTemplate.getForObject(url, byte[].class);
            } catch (HttpStatusCodeException ex) {
                boolean retryable = ex.getStatusCode().value() == TOO_MANY_REQUESTS
                        || ex.getStatusCode().is5xxServerError();
                if (!retryable || attempt >= properties.getMaxFetchAttempts()) {
                    throw ex;
                }
                log.warn("SIGMA {} attempt {}/{} got {} — retrying",
                        url, attempt, properties.getMaxFetchAttempts(), ex.getStatusCode());
                pause(properties.getRetryBaseDelayMs() * attempt);
            }
        }
    }

    private void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("SIGMA fetch interrupted", ex);
        }
    }
}

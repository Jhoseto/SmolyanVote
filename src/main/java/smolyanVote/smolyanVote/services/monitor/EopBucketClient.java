package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Fetches daily open-data buckets from storage.eop.bg (MinIO S3-compatible listing).
 *
 * <p>Object keys are Bulgarian sentences ("Автоматично генерирани данни за Договори,
 * публикувани в РОП ЦАИС от 29.07.2026.json"), so both the listing and the object URL
 * must be handled as UTF-8 throughout.
 */
@Component
public class EopBucketClient {

    private static final Logger log = LoggerFactory.getLogger(EopBucketClient.class);
    private static final Pattern KEY_PATTERN = Pattern.compile("<Key>([^<]+)</Key>");
    private static final String BASE_URL = "https://storage.eop.bg";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public EopBucketClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public record DayBucket(LocalDate day, String contractsKey, String annexesKey) {
    }

    public DayBucket listDay(LocalDate day) {
        // MinIO S3 listing requires list-type=2; bare bucket URL returns 403.
        String bucketUrl = BASE_URL + "/open-data-" + day + "/?list-type=2";
        byte[] raw;
        try {
            raw = restTemplate.getForObject(URI.create(bucketUrl), byte[].class);
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode().value() == 403 || ex.getStatusCode().value() == 404) {
                log.debug("EOP bucket missing or not published yet for {}: {}", day, ex.getStatusCode());
                return null;
            }
            throw ex;
        }
        if (raw == null || raw.length == 0) {
            return null;
        }
        // Read as bytes and decode explicitly: the response has no charset, so the default
        // String converter would fall back to ISO-8859-1 and mangle the Cyrillic keys.
        String xml = new String(raw, StandardCharsets.UTF_8);

        String contractsKey = null;
        String annexesKey = null;
        Matcher m = KEY_PATTERN.matcher(xml);
        while (m.find()) {
            String key = unescapeXml(m.group(1));
            String lower = key.toLowerCase();
            if (contractsKey == null && lower.contains("договор")) {
                contractsKey = key;
            }
            if (annexesKey == null && lower.contains("анекс")) {
                annexesKey = key;
            }
        }
        if (contractsKey == null && annexesKey == null) {
            log.warn("EOP bucket for {} contained no contract/annex objects", day);
            return null;
        }
        return new DayBucket(day, contractsKey, annexesKey);
    }

    public List<JsonNode> fetchArray(LocalDate day, String objectKey) throws Exception {
        if (objectKey == null || objectKey.isBlank()) {
            return List.of();
        }
        String encoded = URLEncoder.encode(objectKey, StandardCharsets.UTF_8).replace("+", "%20");
        String url = BASE_URL + "/open-data-" + day + "/" + encoded;
        byte[] bytes = restTemplate.getForObject(URI.create(url), byte[].class);
        if (bytes == null || bytes.length == 0) {
            return List.of();
        }
        JsonNode root = objectMapper.readTree(bytes);
        if (!root.isArray()) {
            return List.of();
        }
        List<JsonNode> out = new ArrayList<>();
        root.forEach(out::add);
        return out;
    }

    private static String unescapeXml(String value) {
        return value.replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#34;", "\"")
                .replace("&apos;", "'")
                .replace("&#39;", "'")
                .replace("&amp;", "&");
    }
}

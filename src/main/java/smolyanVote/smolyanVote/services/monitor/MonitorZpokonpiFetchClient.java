package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
class MonitorZpokonpiFetchClient {

    private static final Logger log = LoggerFactory.getLogger(MonitorZpokonpiFetchClient.class);

    private final RestTemplate restTemplate;

    MonitorZpokonpiFetchClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(12).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(25).toMillis());
        this.restTemplate = new RestTemplate(factory);
    }

    FetchResult fetch(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
            headers.set(HttpHeaders.ACCEPT, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8");
            headers.set(HttpHeaders.ACCEPT_LANGUAGE, "bg-BG,bg;q=0.9,en;q=0.8");
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return FetchResult.failed("HTTP " + response.getStatusCode().value());
            }
            String html = new String(response.getBody(), StandardCharsets.UTF_8);
            if (MonitorZpokonpiHtmlParser.looksLikeBotBlock(html)) {
                return FetchResult.failed("Страницата изисква браузър (Cloudflare/бот проверка).");
            }
            return FetchResult.ok(html);
        } catch (RestClientException ex) {
            log.debug("ZPKONPI fetch failed for {}: {}", url, ex.getMessage());
            return FetchResult.failed(ex.getMessage() == null ? "Мрежова грешка" : ex.getMessage());
        }
    }

    record FetchResult(boolean ok, String html, String error) {
        static FetchResult ok(String html) {
            return new FetchResult(true, html, null);
        }

        static FetchResult failed(String error) {
            return new FetchResult(false, null, error);
        }
    }
}

package smolyanVote.smolyanVote.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "monitor.scraper")
public class MonitorScraperProperties {

    /** Playwright sidecar base URL, e.g. http://localhost:3099 */
    private String url = "http://localhost:3099";

    /** Max documents per listing section per scrape run */
    private int maxDocumentsPerSection = 40;

    private int connectTimeoutMs = 15_000;

    /** Full scrape can take several minutes */
    private int readTimeoutMs = 600_000;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public int getMaxDocumentsPerSection() {
        return maxDocumentsPerSection;
    }

    public void setMaxDocumentsPerSection(int maxDocumentsPerSection) {
        this.maxDocumentsPerSection = maxDocumentsPerSection;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }
}

package smolyanVote.smolyanVote.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Next.js frontend origin — OAuth redirects, email links, logout. */
@Component
@ConfigurationProperties(prefix = "smolyanvote.frontend")
public class FrontendProperties {

    /** e.g. http://localhost:3000 or https://smolyanvote.com */
    private String url = "http://localhost:3000";

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String origin() {
        if (url == null || url.isBlank()) return "http://localhost:3000";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}

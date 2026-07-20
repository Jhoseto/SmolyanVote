package smolyanVote.smolyanVote.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Next.js frontend origin — used to isolate legacy Thymeleaf UI
 * ({@code LegacyUiIsolationFilter}) and OAuth redirects.
 */
@Component
@ConfigurationProperties(prefix = "smolyanvote.frontend")
public class FrontendProperties {

    /** e.g. http://localhost:3000 or https://smolyanvote.com */
    private String url = "http://localhost:3000";

    /**
     * When true, browser document navigations to Spring HTML routes are 302'd
     * to {@link #url} so only the Next.js UI is used for manual testing.
     */
    private boolean legacyRedirectEnabled = true;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isLegacyRedirectEnabled() {
        return legacyRedirectEnabled;
    }

    public void setLegacyRedirectEnabled(boolean legacyRedirectEnabled) {
        this.legacyRedirectEnabled = legacyRedirectEnabled;
    }

    public String origin() {
        if (url == null || url.isBlank()) return "http://localhost:3000";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}

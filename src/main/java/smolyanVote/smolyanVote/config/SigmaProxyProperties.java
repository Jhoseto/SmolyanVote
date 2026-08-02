package smolyanVote.smolyanVote.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "monitor.sigma-proxy")
public class SigmaProxyProperties {

    /** CSV/JSON cache TTL in hours (align with SIGMA ETL ~6h). */
    private int cacheTtlHours = 6;

    private long authorityPauseMs = 1500;
    private int maxFetchAttempts = 4;
    private long retryBaseDelayMs = 3000;

    public int getCacheTtlHours() {
        return cacheTtlHours;
    }

    public void setCacheTtlHours(int cacheTtlHours) {
        this.cacheTtlHours = cacheTtlHours;
    }

    public long getAuthorityPauseMs() {
        return authorityPauseMs;
    }

    public void setAuthorityPauseMs(long authorityPauseMs) {
        this.authorityPauseMs = authorityPauseMs;
    }

    public int getMaxFetchAttempts() {
        return maxFetchAttempts;
    }

    public void setMaxFetchAttempts(int maxFetchAttempts) {
        this.maxFetchAttempts = maxFetchAttempts;
    }

    public long getRetryBaseDelayMs() {
        return retryBaseDelayMs;
    }

    public void setRetryBaseDelayMs(long retryBaseDelayMs) {
        this.retryBaseDelayMs = retryBaseDelayMs;
    }
}

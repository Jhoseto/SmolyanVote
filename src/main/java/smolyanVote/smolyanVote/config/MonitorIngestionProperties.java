package smolyanVote.smolyanVote.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "monitor.ingestion")
public class MonitorIngestionProperties {

    /** Master switch for all scheduled monitor ingestion jobs. */
    private boolean schedulerEnabled = true;

    private boolean sigmaEnabled = true;
    private boolean eopEnabled = true;
    private boolean scrapeEnabled = true;
    private boolean aiBatchEnabled = true;

    /** Days to import on scheduled EOP runs. */
    private int eopDays = 7;

    /** Upper cap for manual/admin EOP backfill requests. */
    private int eopMaxDays = 30;

    /** Documents processed per scheduled AI batch after scrape. */
    private int aiBatchLimit = 25;

    public boolean isSchedulerEnabled() {
        return schedulerEnabled;
    }

    public void setSchedulerEnabled(boolean schedulerEnabled) {
        this.schedulerEnabled = schedulerEnabled;
    }

    public boolean isSigmaEnabled() {
        return sigmaEnabled;
    }

    public void setSigmaEnabled(boolean sigmaEnabled) {
        this.sigmaEnabled = sigmaEnabled;
    }

    public boolean isEopEnabled() {
        return eopEnabled;
    }

    public void setEopEnabled(boolean eopEnabled) {
        this.eopEnabled = eopEnabled;
    }

    public boolean isScrapeEnabled() {
        return scrapeEnabled;
    }

    public void setScrapeEnabled(boolean scrapeEnabled) {
        this.scrapeEnabled = scrapeEnabled;
    }

    public boolean isAiBatchEnabled() {
        return aiBatchEnabled;
    }

    public void setAiBatchEnabled(boolean aiBatchEnabled) {
        this.aiBatchEnabled = aiBatchEnabled;
    }

    public int getEopDays() {
        return eopDays;
    }

    public void setEopDays(int eopDays) {
        this.eopDays = eopDays;
    }

    public int getEopMaxDays() {
        return eopMaxDays;
    }

    public void setEopMaxDays(int eopMaxDays) {
        this.eopMaxDays = eopMaxDays;
    }

    public int getAiBatchLimit() {
        return aiBatchLimit;
    }

    public void setAiBatchLimit(int aiBatchLimit) {
        this.aiBatchLimit = aiBatchLimit;
    }
}

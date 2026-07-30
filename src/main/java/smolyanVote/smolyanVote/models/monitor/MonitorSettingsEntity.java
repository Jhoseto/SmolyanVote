package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

/**
 * Singleton row (id always 1) holding admin overrides for scheduled ingestion jobs.
 * When present, these values take precedence over application.properties defaults
 * so admins can pause/resume jobs without a redeploy, and the choice survives restarts.
 */
@Entity
@Table(name = "monitor_settings")
public class MonitorSettingsEntity extends BaseEntity {

    @Column(name = "scheduler_enabled", nullable = false)
    private boolean schedulerEnabled = true;

    @Column(name = "sigma_enabled", nullable = false)
    private boolean sigmaEnabled = true;

    @Column(name = "eop_enabled", nullable = false)
    private boolean eopEnabled = true;

    @Column(name = "scrape_enabled", nullable = false)
    private boolean scrapeEnabled = true;

    @Column(name = "ai_batch_enabled", nullable = false)
    private boolean aiBatchEnabled = true;

    @Column(name = "eop_days", nullable = false)
    private int eopDays = 7;

    @Column(name = "ai_batch_limit", nullable = false)
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

    public int getAiBatchLimit() {
        return aiBatchLimit;
    }

    public void setAiBatchLimit(int aiBatchLimit) {
        this.aiBatchLimit = aiBatchLimit;
    }
}

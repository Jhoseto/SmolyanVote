package smolyanVote.smolyanVote.services.monitor;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.config.MonitorIngestionProperties;
import smolyanVote.smolyanVote.models.monitor.MonitorSettingsEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorSettingsRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorSchedulerSettingsDTO;

/**
 * Bridges the DB-persisted admin overrides ({@link MonitorSettingsEntity}) with the live
 * {@link MonitorIngestionProperties} bean read by {@link MonitorIngestionScheduler}. On boot,
 * any saved override replaces the application.properties defaults; every admin write updates
 * both the DB row (so it survives restarts) and the in-memory bean (so it takes effect instantly).
 */
@Service
public class MonitorSettingsService {

    private static final Logger log = LoggerFactory.getLogger(MonitorSettingsService.class);

    private final MonitorSettingsRepository settingsRepository;
    private final MonitorIngestionProperties properties;

    public MonitorSettingsService(
            MonitorSettingsRepository settingsRepository,
            MonitorIngestionProperties properties) {
        this.settingsRepository = settingsRepository;
        this.properties = properties;
    }

    @PostConstruct
    @Transactional
    public void applyPersistedOverrides() {
        settingsRepository.findTopByOrderByIdAsc().ifPresent(saved -> {
            properties.setSchedulerEnabled(saved.isSchedulerEnabled());
            properties.setSigmaEnabled(saved.isSigmaEnabled());
            properties.setEopEnabled(saved.isEopEnabled());
            properties.setScrapeEnabled(saved.isScrapeEnabled());
            properties.setAiBatchEnabled(saved.isAiBatchEnabled());
            properties.setEopDays(saved.getEopDays());
            properties.setAiBatchLimit(saved.getAiBatchLimit());
            log.info("Applied persisted monitor scheduler overrides from admin panel");
        });
    }

    @Transactional(readOnly = true)
    public MonitorSchedulerSettingsDTO getEffectiveSettings() {
        return toDto();
    }

    @Transactional
    public MonitorSchedulerSettingsDTO updateSettings(MonitorSchedulerSettingsDTO req) {
        int eopDays = Math.min(Math.max(req.eopDays(), 1), properties.getEopMaxDays());
        int aiBatchLimit = Math.min(Math.max(req.aiBatchLimit(), 1), 200);

        properties.setSchedulerEnabled(req.schedulerEnabled());
        properties.setSigmaEnabled(req.sigmaEnabled());
        properties.setEopEnabled(req.eopEnabled());
        properties.setScrapeEnabled(req.scrapeEnabled());
        properties.setAiBatchEnabled(req.aiBatchEnabled());
        properties.setEopDays(eopDays);
        properties.setAiBatchLimit(aiBatchLimit);

        MonitorSettingsEntity entity = settingsRepository.findTopByOrderByIdAsc().orElseGet(MonitorSettingsEntity::new);
        entity.setSchedulerEnabled(req.schedulerEnabled());
        entity.setSigmaEnabled(req.sigmaEnabled());
        entity.setEopEnabled(req.eopEnabled());
        entity.setScrapeEnabled(req.scrapeEnabled());
        entity.setAiBatchEnabled(req.aiBatchEnabled());
        entity.setEopDays(eopDays);
        entity.setAiBatchLimit(aiBatchLimit);
        settingsRepository.save(entity);

        return toDto();
    }

    private MonitorSchedulerSettingsDTO toDto() {
        return new MonitorSchedulerSettingsDTO(
                properties.isSchedulerEnabled(),
                properties.isSigmaEnabled(),
                properties.isEopEnabled(),
                properties.isScrapeEnabled(),
                properties.isAiBatchEnabled(),
                properties.getEopDays(),
                properties.getEopMaxDays(),
                properties.getAiBatchLimit());
    }
}

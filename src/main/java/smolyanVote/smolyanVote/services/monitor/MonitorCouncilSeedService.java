package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCouncilorRepository;

/**
 * Legacy placeholder seeds removed — real profiles come from smolyan.bg scraper sync.
 * Empty table is OK; admin UI shows instructions until Sync съветници runs.
 */
@Component
public class MonitorCouncilSeedService {

    private static final Logger log = LoggerFactory.getLogger(MonitorCouncilSeedService.class);

    private final MonitorCouncilorRepository councilorRepository;

    public MonitorCouncilSeedService(MonitorCouncilorRepository councilorRepository) {
        this.councilorRepository = councilorRepository;
    }

    @jakarta.annotation.PostConstruct
    public void logCouncilorState() {
        long count = councilorRepository.count();
        if (count == 0) {
            log.info(
                    "Monitor councilors: none yet — run scraper setup-session, then Admin → Monitor → Sync съветници");
        }
    }
}

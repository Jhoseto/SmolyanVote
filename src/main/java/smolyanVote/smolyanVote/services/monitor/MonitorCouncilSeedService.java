package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCouncilorRepository;

/** Legacy hook — councilors are seeded from {@link MonitorCouncilorSeed} at startup. */
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
        log.info("Monitor councilors: {} profile(s) in database (curated seed, mandate {})", count,
                MonitorCouncilorSeed.MANDATE);
    }
}

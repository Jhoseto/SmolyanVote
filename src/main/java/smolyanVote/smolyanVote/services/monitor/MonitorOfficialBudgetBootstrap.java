package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorOfficialBudgetEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorOfficialBudgetRepository;

import java.util.Optional;

@Component
public class MonitorOfficialBudgetBootstrap {

    private static final Logger log = LoggerFactory.getLogger(MonitorOfficialBudgetBootstrap.class);

    private final MonitorOfficialBudgetRepository repository;

    public MonitorOfficialBudgetBootstrap(MonitorOfficialBudgetRepository repository) {
        this.repository = repository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedHistoricalBudgets() {
        String eik = MonitorRegionalConfig.SMOLYAN_CITY_EIK;
        int seeded = 0;
        for (int year = MonitorOfficialBudgetSeed.FIRST_YEAR; year <= MonitorOfficialBudgetSeed.LAST_YEAR; year++) {
            if (repository.findByAuthorityEikAndBudgetYear(eik, year).isPresent()) {
                continue;
            }
            Optional<MonitorOfficialBudgetEntity> seed = MonitorOfficialBudgetSeed.build(year);
            if (seed.isPresent()) {
                repository.save(seed.get());
                seeded++;
            }
        }
        if (seeded > 0) {
            log.info("Seeded {} official budget year(s) for Smolyan ({}–{})", seeded,
                    MonitorOfficialBudgetSeed.FIRST_YEAR, MonitorOfficialBudgetSeed.LAST_YEAR);
        }
    }
}

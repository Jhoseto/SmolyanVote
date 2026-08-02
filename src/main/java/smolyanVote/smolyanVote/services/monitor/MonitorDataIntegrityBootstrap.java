package smolyanVote.smolyanVote.services.monitor;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class MonitorDataIntegrityBootstrap {

    private final MonitorDataIntegrityService integrityService;
    private final MonitorDataQualityService dataQualityService;

    public MonitorDataIntegrityBootstrap(
            MonitorDataIntegrityService integrityService,
            MonitorDataQualityService dataQualityService) {
        this.integrityService = integrityService;
        this.dataQualityService = dataQualityService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void repairOnStartup() {
        integrityService.backfillMissingSignedDates();
        integrityService.backfillDocumentCurrencies();
        dataQualityService.backfillContractCurrencies();
    }
}

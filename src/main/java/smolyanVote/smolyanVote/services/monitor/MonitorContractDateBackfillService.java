package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;

/**
 * Repairs contract dates after import — SIGMA rows should carry {@code signed_at}, but older
 * imports or partial rows may only have UNP (e.g. {@code 00092-2021-0001}).
 */
@Service
public class MonitorContractDateBackfillService {

    private final MonitorContractRepository contractRepository;

    public MonitorContractDateBackfillService(MonitorContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    @Transactional
    public int backfillSignedDatesFromUnp() {
        int updated = 0;
        for (MonitorContractEntity contract : contractRepository.findAll()) {
            if (contract.getSignedAt() != null) {
                continue;
            }
            var fromUnp = MonitorContractDates.dateFromUnp(contract.getUnp());
            if (fromUnp != null) {
                contract.setSignedAt(fromUnp);
                contractRepository.save(contract);
                updated++;
            }
        }
        return updated;
    }
}

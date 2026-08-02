package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;

import java.time.LocalDate;
import java.util.List;

/** One-shot repairs so charts and citizen-facing amounts stay truthful. */
@Service
public class MonitorDataIntegrityService {

    private static final Logger log = LoggerFactory.getLogger(MonitorDataIntegrityService.class);

    private final MonitorContractRepository contractRepository;
    private final MonitorDocumentRepository documentRepository;

    public MonitorDataIntegrityService(
            MonitorContractRepository contractRepository,
            MonitorDocumentRepository documentRepository) {
        this.contractRepository = contractRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional
    public int backfillMissingSignedDates() {
        List<MonitorContractEntity> missing = contractRepository.findBySignedAtIsNull();
        int updated = 0;
        for (MonitorContractEntity contract : missing) {
            LocalDate fromUnp = MonitorContractDates.dateFromUnp(contract.getUnp());
            if (fromUnp != null) {
                contract.setSignedAt(fromUnp);
                contractRepository.save(contract);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("Monitor integrity: backfilled signed_at for {} contracts from UNP", updated);
        }
        return updated;
    }

    @Transactional
    public int backfillDocumentCurrencies() {
        List<MonitorDocumentEntity> docs = documentRepository.findByAmountIsNotNullAndAmountCurrencyIsNull();
        int updated = 0;
        for (MonitorDocumentEntity doc : docs) {
            String detected = MonitorCurrencyUtil.detectCurrencyFromText(doc.getRawContent());
            if (detected != null) {
                doc.setAmountCurrency(detected);
                documentRepository.save(doc);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("Monitor integrity: inferred amount currency for {} scraped documents", updated);
        }
        return updated;
    }
}

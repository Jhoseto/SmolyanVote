package smolyanVote.smolyanVote.services.monitor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorDataQualityReportDTO;

import java.util.ArrayList;
import java.util.List;

@Service
public class MonitorDataQualityService {

    private final MonitorContractRepository contractRepository;
    private final MonitorDocumentRepository documentRepository;

    public MonitorDataQualityService(
            MonitorContractRepository contractRepository,
            MonitorDocumentRepository documentRepository) {
        this.contractRepository = contractRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional(readOnly = true)
    public MonitorDataQualityReportDTO buildReport() {
        long total = contractRepository.count();
        long eop = contractRepository.countBySigmaIdStartingWith("eop:");
        long sigma = total - eop;
        long missingSigned = contractRepository.countBySignedAtIsNull();
        long missingCurrency = contractRepository.countByOriginalCurrencyIsNull();
        long currencyWarnings = contractRepository.countByCurrencyWarningIsNotNull();
        long docCurrencyGaps = documentRepository.countByAmountIsNotNullAndAmountCurrencyIsNull();

        List<String> alerts = new ArrayList<>();
        if (missingSigned > 0) {
            alerts.add(missingSigned + " договора без дата на подписване (изключени от месечни графики)");
        }
        if (currencyWarnings > 0) {
            alerts.add(currencyWarnings + " договора с предупреждение за валута — проверете в admin");
        }
        if (missingCurrency > 0) {
            alerts.add(missingCurrency + " договора без записана оригинална валута — пуснете integrity repair");
        }
        if (docCurrencyGaps > 0) {
            alerts.add(docCurrencyGaps + " документа от smolyan.bg с сума, но без валута — re-scrape");
        }

        return new MonitorDataQualityReportDTO(
                total,
                sigma,
                eop,
                missingSigned,
                missingCurrency,
                currencyWarnings,
                docCurrencyGaps,
                alerts);
    }

    @Transactional
    public int backfillContractCurrencies() {
        int updated = 0;
        for (MonitorContractEntity contract : contractRepository.findByOriginalCurrencyIsNull()) {
            if (contract.getSigmaId() != null && contract.getSigmaId().startsWith("eop:")) {
                contract.setOriginalCurrency("UNKNOWN");
                if (contract.getCurrencyWarning() == null) {
                    contract.setCurrencyWarning("Legacy EOP — валута не е била записана при импорт");
                }
            } else {
                contract.setOriginalCurrency("EUR");
                contract.setCurrencyWarning(null);
            }
            contractRepository.save(contract);
            updated++;
        }
        return updated;
    }
}

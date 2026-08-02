package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;

import java.util.List;

/**
 * Persists citizen-facing headlines and „Защо е важно“ on contract rows.
 * Runs without Gemini — the monitor must be useful even when AI batch fails.
 */
@Service
public class MonitorInsightEnrichmentService {

    private final MonitorContractRepository contractRepository;
    private final ObjectMapper objectMapper;

    public MonitorInsightEnrichmentService(
            MonitorContractRepository contractRepository, ObjectMapper objectMapper) {
        this.contractRepository = contractRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public int enrichAllContracts() {
        List<MonitorContractEntity> all = contractRepository.findAll();
        int updated = 0;
        for (MonitorContractEntity contract : all) {
            if (enrichContract(contract)) {
                updated++;
            }
        }
        contractRepository.saveAll(all);
        return updated;
    }

    @Transactional
    public int enrichContracts(List<Long> contractIds) {
        if (contractIds == null || contractIds.isEmpty()) {
            return 0;
        }
        int updated = 0;
        for (Long id : contractIds) {
            MonitorContractEntity contract = contractRepository.findById(id).orElse(null);
            if (contract != null && enrichContract(contract)) {
                contractRepository.save(contract);
                updated++;
            }
        }
        return updated;
    }

    /** Returns true if the row was changed. */
    public boolean enrichContract(MonitorContractEntity contract) {
        MonitorInsightBuilder.ContractInsight insight =
                MonitorInsightBuilder.buildFromRiskData(contract, objectMapper);
        String headline = MonitorColumnLimits.clamp(insight.headline(), MonitorColumnLimits.SHORT_SUMMARY);
        String why = MonitorColumnLimits.clamp(insight.whyItMatters(), MonitorColumnLimits.INSIGHT_WHY);
        boolean changed = false;
        if (headline != null && !headline.equals(contract.getShortSummary())) {
            contract.setShortSummary(headline);
            changed = true;
        }
        if (why != null && !why.equals(contract.getInsightWhy())) {
            contract.setInsightWhy(why);
            changed = true;
        }
        if (contract.getAiCategory() == null && insight.category() != null) {
            contract.setAiCategory(insight.category());
            changed = true;
        }
        if (contract.getImpactScore() == null && contract.getRiskScore() != null && contract.getRiskScore() > 0) {
            contract.setImpactScore(Math.min(10, Math.max(1, contract.getRiskScore() / 10)));
            changed = true;
        }
        return changed;
    }
}

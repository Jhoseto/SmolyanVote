package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionStatus;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.config.SigmaProxyProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Persists subcontractor declarations from sigma.midt.bg JSON into regional contracts.
 *
 * <p>SIGMA CSV exports omit subcontractor fields; EOP daily buckets only cover recent publications.
 * This pass fetches {@code /contracts/{id}.json} for each local SIGMA contract.
 */
@Service
public class SigmaSubcontractorEnrichmentService {

    private static final Logger log = LoggerFactory.getLogger(SigmaSubcontractorEnrichmentService.class);

    private final MonitorContractRepository contractRepository;
    private final MonitorCompanyRepository companyRepository;
    private final SigmaProxyService sigmaProxyService;
    private final SigmaProxyProperties sigmaProxyProperties;
    private final MonitorIngestionRunService runService;

    public SigmaSubcontractorEnrichmentService(
            MonitorContractRepository contractRepository,
            MonitorCompanyRepository companyRepository,
            SigmaProxyService sigmaProxyService,
            SigmaProxyProperties sigmaProxyProperties,
            MonitorIngestionRunService runService) {
        this.contractRepository = contractRepository;
        this.companyRepository = companyRepository;
        this.sigmaProxyService = sigmaProxyService;
        this.sigmaProxyProperties = sigmaProxyProperties;
        this.runService = runService;
    }

    @Transactional
    public MonitorIngestionRunEntity enrichRegionalContracts(boolean refreshAll) {
        MonitorIngestionRunEntity run = runService.start(MonitorIngestionType.EOP);

        List<MonitorContractEntity> contracts = contractRepository.findAllInScope(null);
        int scanned = 0;
        int enriched = 0;
        int skipped = 0;
        int fetchErrors = 0;
        List<String> failures = new ArrayList<>();

        for (MonitorContractEntity contract : contracts) {
            String sigmaId = contract.getSigmaId();
            if (sigmaId == null || sigmaId.isBlank() || sigmaId.startsWith("eop:")) {
                skipped++;
                continue;
            }
            if (!refreshAll && MonitorSubcontractorHelper.hasDeclaredSubcontractor(contract)) {
                skipped++;
                continue;
            }
            scanned++;
            try {
                var cached = sigmaProxyService.getContractJson(sigmaId, true);
                if (cached.isEmpty()) {
                    fetchErrors++;
                    continue;
                }
                JsonNode body = cached.get().body();
                if (SigmaSubcontractorParser.applyFromJson(contract, body)) {
                    contractRepository.save(contract);
                    upsertSubcontractorCompany(contract);
                    enriched++;
                }
            } catch (Exception ex) {
                fetchErrors++;
                log.warn("SIGMA subcontractor enrich failed for {}: {}", sigmaId, ex.getMessage());
                if (failures.size() < 5) {
                    failures.add(sigmaId + ": " + MonitorIngestionRunService.describe(ex));
                }
            }
            pause(sigmaProxyProperties.getAuthorityPauseMs() / 3);
        }

        StringBuilder message = new StringBuilder("Подизпълнители (SIGMA JSON): "
                + enriched + " обогатени от " + scanned + " договора");
        if (skipped > 0) {
            message.append(", ").append(skipped).append(" пропуснати");
        }
        if (fetchErrors > 0) {
            message.append(", ").append(fetchErrors).append(" без отговор от SIGMA");
        }
        if (!failures.isEmpty()) {
            message.append(" | ").append(String.join("; ", failures));
        }

        MonitorIngestionStatus status = failures.isEmpty()
                ? MonitorIngestionStatus.SUCCESS
                : enriched > 0 ? MonitorIngestionStatus.PARTIAL : MonitorIngestionStatus.FAILED;
        return runService.finish(run.getId(), status, enriched, message.toString());
    }

    private void upsertSubcontractorCompany(MonitorContractEntity contract) {
        String eik = contract.getSubcontractorEik();
        if (eik == null || eik.isBlank()) {
            return;
        }
        MonitorCompanyEntity company = companyRepository.findByEik(eik.trim())
                .orElseGet(MonitorCompanyEntity::new);
        company.setEik(eik.trim());
        if (contract.getSubcontractorName() != null && !contract.getSubcontractorName().isBlank()) {
            company.setName(contract.getSubcontractorName().trim());
        } else if (company.getName() == null) {
            company.setName("ЕИК " + eik.trim());
        }
        companyRepository.save(company);
    }

    private static void pause(long millis) {
        if (millis <= 0) {
            return;
        }
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("SIGMA subcontractor enrichment interrupted", ex);
        }
    }
}

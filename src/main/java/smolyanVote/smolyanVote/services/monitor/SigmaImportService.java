package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionStatus;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;
import smolyanVote.smolyanVote.models.enums.MonitorRegionScope;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.config.SigmaProxyProperties;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SigmaImportService {

    private static final Logger log = LoggerFactory.getLogger(SigmaImportService.class);

    /** sigma.midt.bg answers 429 when the eight municipalities are requested back to back. */
    private static final int ENRICHMENT_VERSION = 1;

    private final MonitorContractRepository contractRepository;
    private final MonitorCompanyRepository companyRepository;
    private final MonitorIngestionRunService runService;
    private final MonitorRiskService riskService;
    private final MonitorInsightEnrichmentService insightEnrichmentService;
    private final EopImportService eopImportService;
    private final MonitorCompanyAggregateService aggregateService;
    private final MonitorContractDateBackfillService contractDateBackfillService;
    private final SigmaProxyService sigmaProxyService;
    private final SigmaProxyProperties sigmaProxyProperties;
    private final TransactionTemplate authorityTransaction;

    public SigmaImportService(
            MonitorContractRepository contractRepository,
            MonitorCompanyRepository companyRepository,
            MonitorIngestionRunService runService,
            MonitorRiskService riskService,
            MonitorInsightEnrichmentService insightEnrichmentService,
            EopImportService eopImportService,
            MonitorCompanyAggregateService aggregateService,
            MonitorContractDateBackfillService contractDateBackfillService,
            SigmaProxyService sigmaProxyService,
            SigmaProxyProperties sigmaProxyProperties,
            PlatformTransactionManager transactionManager) {
        this.contractRepository = contractRepository;
        this.companyRepository = companyRepository;
        this.runService = runService;
        this.riskService = riskService;
        this.insightEnrichmentService = insightEnrichmentService;
        this.eopImportService = eopImportService;
        this.aggregateService = aggregateService;
        this.contractDateBackfillService = contractDateBackfillService;
        this.sigmaProxyService = sigmaProxyService;
        this.sigmaProxyProperties = sigmaProxyProperties;
        this.authorityTransaction = new TransactionTemplate(transactionManager);
        this.authorityTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Imports contracts for every municipality in oblast Smolyan.
     *
     * <p>Deliberately not transactional: each municipality commits on its own, so a feed
     * outage or a single malformed row cannot discard the work already done, and the run
     * log survives to explain what happened.
     */
    public MonitorIngestionRunEntity importRegionalContracts() {
        MonitorIngestionRunEntity run = runService.start(MonitorIngestionType.SIGMA);
        RefreshResult result = refreshRegionalContracts(false);
        MonitorIngestionStatus status;
        if (result.failures().isEmpty()) {
            status = MonitorIngestionStatus.SUCCESS;
        } else {
            status = result.processed() > 0 ? MonitorIngestionStatus.PARTIAL : MonitorIngestionStatus.FAILED;
        }
        StringBuilder message = new StringBuilder("SIGMA: " + result.processed() + " договора");
        if (result.changed() > 0) {
            message.append(", ").append(result.changed()).append(" променени/нови");
        }
        if (result.skippedRows() > 0) {
            message.append(", ").append(result.skippedRows()).append(" пропуснати реда");
        }
        if (!result.failures().isEmpty()) {
            message.append(" | Грешки: ").append(String.join("; ", result.failures()));
        }
        return runService.finish(run.getId(), status, result.processed(), message.toString());
    }

    public record RefreshResult(int processed, int changed, int skippedRows, List<String> failures) {
    }

    /**
     * Fetches CSV via {@link SigmaProxyService}, upserts only new/changed rows, re-scores deltas.
     */
    public RefreshResult refreshRegionalContracts(boolean bypassCache) {
        int processed = 0;
        int changed = 0;
        int skippedRows = 0;
        List<String> failures = new ArrayList<>();
        List<Long> changedContractIds = new ArrayList<>();
        boolean first = true;

        for (String eik : MonitorRegionalConfig.AUTHORITY_LABELS.keySet()) {
            MonitorJobCancellation.check();
            if (!first) {
                pause(sigmaProxyProperties.getAuthorityPauseMs());
            }
            first = false;
            String label = MonitorRegionalConfig.labelForAuthority(eik, eik);
            try {
                String csv = fetchCsv(eik, bypassCache);
                if (csv == null || csv.isBlank()) {
                    continue;
                }
                AuthorityResult result = authorityTransaction.execute(status -> importForAuthority(eik, csv));
                if (result != null) {
                    processed += result.imported();
                    changed += result.changed();
                    skippedRows += result.skipped();
                    changedContractIds.addAll(result.changedContractIds());
                }
            } catch (MonitorJobCancelledException ex) {
                throw ex;
            } catch (Exception ex) {
                log.error("SIGMA import failed for {}", label, ex);
                failures.add(label + ": " + MonitorIngestionRunService.describe(ex));
            }
        }

        if (processed > 0) {
            try {
                int datesFixed = contractDateBackfillService.backfillSignedDatesFromUnp();
                log.info("SIGMA contract date backfill: {} rows updated from UNP", datesFixed);
            } catch (Exception ex) {
                log.error("SIGMA contract date backfill failed", ex);
                failures.add("Дати на договори: " + MonitorIngestionRunService.describe(ex));
            }
            try {
                if (!changedContractIds.isEmpty()) {
                    for (Long id : changedContractIds) {
                        contractRepository.findById(id).ifPresent(riskService::scoreContract);
                    }
                    log.info("SIGMA risk scoring: {} changed contracts", changedContractIds.size());
                } else {
                    riskService.scoreAllContracts();
                }
            } catch (Exception ex) {
                log.error("SIGMA risk scoring failed", ex);
                failures.add("Риск скоринг: " + MonitorIngestionRunService.describe(ex));
            }
            try {
                int enriched = changedContractIds.isEmpty()
                        ? insightEnrichmentService.enrichAllContracts()
                        : insightEnrichmentService.enrichContracts(changedContractIds);
                log.info("SIGMA insight enrichment: {} contracts updated", enriched);
            } catch (Exception ex) {
                log.error("SIGMA insight enrichment failed", ex);
                failures.add("Анализ на договори: " + MonitorIngestionRunService.describe(ex));
            }
            try {
                aggregateService.refreshFromAllContracts();
            } catch (Exception ex) {
                log.error("SIGMA company aggregation failed", ex);
                failures.add("Агрегиране на фирми: " + MonitorIngestionRunService.describe(ex));
            }
        }

        return new RefreshResult(processed, changed, skippedRows, failures);
    }

    private record AuthorityResult(int imported, int changed, int skipped, List<Long> changedContractIds) {
    }

    private record RowResult(boolean imported, boolean changed, Long contractId) {
    }

    private AuthorityResult importForAuthority(String authorityEik, String csv) {
        List<String[]> rows = MonitorCsvParser.parseRows(csv);
        if (rows.size() <= 1) {
            return new AuthorityResult(0, 0, 0, List.of());
        }

        String[] header = normalizeHeader(rows.get(0));
        Map<String, Integer> idx = indexHeader(header);
        ImportContext context = new ImportContext(
                indexBySigmaId(contractRepository.findAllByAuthorityEik(authorityEik)),
                indexByEik(companyRepository.findAll()),
                Instant.now());

        int count = 0;
        int changed = 0;
        int skipped = 0;
        List<Long> changedIds = new ArrayList<>();
        for (int i = 1; i < rows.size(); i++) {
            try {
                RowResult rowResult = importRow(rows.get(i), idx, context);
                if (rowResult.imported()) {
                    count++;
                    if (rowResult.changed()) {
                        changed++;
                        if (rowResult.contractId() != null) {
                            changedIds.add(rowResult.contractId());
                        }
                    }
                }
            } catch (Exception ex) {
                skipped++;
                log.warn("SIGMA row {} skipped for {}: {}", i, authorityEik, ex.getMessage());
            }
        }
        return new AuthorityResult(count, changed, skipped, changedIds);
    }

    private record ImportContext(
            Map<String, MonitorContractEntity> contractsBySigmaId,
            Map<String, MonitorCompanyEntity> companiesByEik,
            Instant fetchedAt) {
    }

    private RowResult importRow(String[] row, Map<String, Integer> idx, ImportContext context) {
        if (row.length == 0) {
            return new RowResult(false, false, null);
        }
        String rowAuthorityEik = cell(row, idx, "authority_eik");
        if (!MonitorRegionalConfig.isRegionalAuthority(rowAuthorityEik)) {
            return new RowResult(false, false, null);
        }
        String sigmaId = MonitorColumnLimits.clampIdentifier(cell(row, idx, "id"), MonitorColumnLimits.SIGMA_ID);
        if (sigmaId == null) {
            return new RowResult(false, false, null);
        }

        MonitorContractEntity known = context.contractsBySigmaId().get(sigmaId);
        boolean isNew = known == null;
        MonitorContractEntity entity = isNew ? new MonitorContractEntity() : known;
        String beforeSignature = isNew ? null : sigmaFieldSignature(entity);
        BigDecimal previousAmount = entity.getAmountEur();

        entity.setSigmaId(sigmaId);
        entity.setUnp(MonitorColumnLimits.clamp(cell(row, idx, "unp"), MonitorColumnLimits.UNP));
        entity.setSubject(require(cell(row, idx, "subject"), "subject"));
        entity.setAuthorityName(MonitorColumnLimits.clamp(cell(row, idx, "authority"), MonitorColumnLimits.AUTHORITY_NAME));
        entity.setAuthorityEik(rowAuthorityEik.trim());
        entity.setContractorName(MonitorColumnLimits.clamp(cell(row, idx, "contractor"), MonitorColumnLimits.CONTRACTOR_NAME));
        entity.setContractorEik(MonitorColumnLimits.clamp(cell(row, idx, "contractor_eik"), MonitorColumnLimits.EIK));
        entity.setContractorKind(MonitorColumnLimits.clamp(cell(row, idx, "kind"), MonitorColumnLimits.CONTRACTOR_KIND));
        entity.setSectorCode(MonitorColumnLimits.clamp(cell(row, idx, "sector_code"), MonitorColumnLimits.SECTOR_CODE));
        entity.setProcedureType(MonitorColumnLimits.clamp(cell(row, idx, "procedure"), MonitorColumnLimits.PROCEDURE_TYPE));
        entity.setSignedAt(resolveSignedDate(cell(row, idx, "signed_at"), entity.getUnp()));
        entity.setAmountEur(parseDecimal(cell(row, idx, "value_eur")));
        entity.setOriginalCurrency("EUR");
        entity.setCurrencyWarning(null);
        entity.setEuFunded(parseBoolean(cell(row, idx, "eu_funded")));
        entity.setBidsReceived(parseInteger(cell(row, idx, "bids_received")));
        entity.setRegionScope(MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(rowAuthorityEik.trim())
                ? MonitorRegionScope.SMOLYAN_CITY
                : MonitorRegionScope.OBLAST_SMOLYAN);
        entity.setSourceUrl(null);
        entity.setFetchedAt(context.fetchedAt());
        if (isNew) {
            entity.setOriginalAmountEur(entity.getAmountEur());
        }

        boolean changed = isNew || !sigmaFieldSignature(entity).equals(beforeSignature);
        if (!changed) {
            return new RowResult(true, false, entity.getId());
        }

        entity.setEnrichmentVersion(ENRICHMENT_VERSION);
        if (entity.getShortSummary() == null || entity.getShortSummary().isBlank()) {
            entity.setShortSummary(MonitorColumnLimits.clamp(entity.getSubject(), MonitorColumnLimits.SHORT_SUMMARY));
        }

        contractRepository.save(entity);
        context.contractsBySigmaId().put(sigmaId, entity);
        if (previousAmount != null && entity.getAmountEur() != null
                && previousAmount.compareTo(entity.getAmountEur()) != 0 && entity.getId() != null) {
            eopImportService.recordAmountChangeAmendment(entity, previousAmount, entity.getAmountEur(), "SIGMA re-import");
        }
        upsertCompany(entity, context.companiesByEik());
        return new RowResult(true, true, entity.getId());
    }

    private static String sigmaFieldSignature(MonitorContractEntity entity) {
        return String.join("|",
                nullSafe(entity.getUnp()),
                nullSafe(entity.getSubject()),
                nullSafe(entity.getAuthorityName()),
                nullSafe(entity.getContractorName()),
                nullSafe(entity.getContractorEik()),
                nullSafe(entity.getSectorCode()),
                nullSafe(entity.getProcedureType()),
                entity.getSignedAt() != null ? entity.getSignedAt().toString() : "",
                entity.getAmountEur() != null ? entity.getAmountEur().toPlainString() : "",
                String.valueOf(entity.isEuFunded()),
                entity.getBidsReceived() != null ? entity.getBidsReceived().toString() : "");
    }

    private static String nullSafe(String value) {
        return value == null ? "" : value.trim();
    }

    private String fetchCsv(String authorityEik, boolean bypassCache) {
        SigmaProxyService.CachedCsv cached = sigmaProxyService.getContractsCsv(authorityEik, bypassCache);
        String body = cached.body();
        if (body == null || body.isBlank()) {
            return null;
        }
        return body;
    }

    private static void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("SIGMA import interrupted", ex);
        }
    }

    private void upsertCompany(MonitorContractEntity contract, Map<String, MonitorCompanyEntity> companiesByEik) {
        String eik = contract.getContractorEik();
        if (eik == null || eik.isBlank()) {
            return;
        }
        String key = eik.trim();
        MonitorCompanyEntity company = companiesByEik.computeIfAbsent(key, k -> new MonitorCompanyEntity());
        company.setEik(key);
        if (contract.getContractorName() != null && !contract.getContractorName().isBlank()) {
            company.setName(contract.getContractorName().trim());
        } else if (company.getName() == null) {
            company.setName("ЕИК " + key);
        }
        company.setConsortium("consortium".equalsIgnoreCase(contract.getContractorKind()));
        companyRepository.save(company);
    }

    private static Map<String, MonitorContractEntity> indexBySigmaId(List<MonitorContractEntity> contracts) {
        Map<String, MonitorContractEntity> map = new HashMap<>();
        for (MonitorContractEntity contract : contracts) {
            if (contract.getSigmaId() != null) {
                map.put(contract.getSigmaId(), contract);
            }
        }
        return map;
    }

    private static Map<String, MonitorCompanyEntity> indexByEik(List<MonitorCompanyEntity> companies) {
        Map<String, MonitorCompanyEntity> map = new HashMap<>();
        for (MonitorCompanyEntity company : companies) {
            if (company.getEik() != null) {
                map.put(company.getEik().trim(), company);
            }
        }
        return map;
    }

    private static String[] normalizeHeader(String[] header) {
        String[] out = new String[header.length];
        for (int i = 0; i < header.length; i++) {
            String h = header[i] == null ? "" : header[i].trim().toLowerCase();
            if (h.startsWith("\uFEFF")) {
                h = h.substring(1);
            }
            out[i] = h;
        }
        return out;
    }

    private static Map<String, Integer> indexHeader(String[] header) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            map.put(header[i], i);
        }
        return map;
    }

    private static String cell(String[] row, Map<String, Integer> idx, String key) {
        Integer i = idx.get(key);
        if (i == null || i >= row.length) {
            return null;
        }
        String v = row[i];
        return v == null ? null : v.trim();
    }

    private static String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing required field: " + field);
        }
        return value.trim();
    }

    private static LocalDate resolveSignedDate(String signedAtRaw, String unp) {
        LocalDate parsed = parseDate(signedAtRaw);
        if (parsed != null) {
            return parsed;
        }
        return MonitorContractDates.dateFromUnp(unp);
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        try {
            return LocalDate.parse(trimmed);
        } catch (Exception ignored) {
            // SIGMA usually uses ISO; tolerate blank/unexpected without failing the row.
        }
        return null;
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return new BigDecimal(value.trim()).setScale(2, RoundingMode.HALF_UP);
    }

    private static boolean parseBoolean(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return "1".equals(value.trim()) || "true".equalsIgnoreCase(value.trim());
    }

    private static Integer parseInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Integer.parseInt(value.trim());
    }
}

package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionStatus;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;
import smolyanVote.smolyanVote.models.enums.MonitorRegionScope;
import smolyanVote.smolyanVote.models.monitor.MonitorAmendmentEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorAmendmentRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EopImportService {

    private static final Logger log = LoggerFactory.getLogger(EopImportService.class);

    private final EopBucketClient bucketClient;
    private final MonitorContractRepository contractRepository;
    private final MonitorCompanyRepository companyRepository;
    private final MonitorAmendmentRepository amendmentRepository;
    private final MonitorIngestionRunService runService;
    private final MonitorRiskService riskService;
    private final MonitorCompanyAggregateService aggregateService;
    private final TransactionTemplate dayTransaction;

    public EopImportService(
            EopBucketClient bucketClient,
            MonitorContractRepository contractRepository,
            MonitorCompanyRepository companyRepository,
            MonitorAmendmentRepository amendmentRepository,
            MonitorIngestionRunService runService,
            MonitorRiskService riskService,
            MonitorCompanyAggregateService aggregateService,
            PlatformTransactionManager transactionManager) {
        this.bucketClient = bucketClient;
        this.contractRepository = contractRepository;
        this.companyRepository = companyRepository;
        this.amendmentRepository = amendmentRepository;
        this.runService = runService;
        this.riskService = riskService;
        this.aggregateService = aggregateService;
        this.dayTransaction = new TransactionTemplate(transactionManager);
        this.dayTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Walks back over the daily open-data buckets.
     *
     * <p>Each day is downloaded outside any transaction and then persisted in its own, so a
     * missing bucket or a malformed row costs only that day.
     *
     * @param days number of calendar days to walk back (capped at 30)
     */
    public MonitorIngestionRunEntity importRecentDays(int days) {
        int cappedDays = Math.max(1, Math.min(days, 30));
        MonitorIngestionRunEntity run = runService.start(MonitorIngestionType.EOP);

        int contracts = 0;
        int annexes = 0;
        int rowErrors = 0;
        int daysWithData = 0;
        List<String> failures = new ArrayList<>();
        LocalDate end = LocalDate.now();

        for (int i = 0; i < cappedDays; i++) {
            LocalDate day = end.minusDays(i);
            try {
                EopBucketClient.DayBucket bucket = bucketClient.listDay(day);
                if (bucket == null) {
                    continue;
                }
                List<JsonNode> contractRows = regionalRows(day, bucket.contractsKey());
                List<JsonNode> annexRows = regionalRows(day, bucket.annexesKey());
                daysWithData++;
                if (contractRows.isEmpty() && annexRows.isEmpty()) {
                    continue;
                }
                DayResult result = dayTransaction.execute(status -> persistDay(day, contractRows, annexRows));
                if (result != null) {
                    contracts += result.contracts();
                    annexes += result.annexes();
                    rowErrors += result.rowErrors();
                }
            } catch (Exception ex) {
                log.error("EOP import failed for {}", day, ex);
                failures.add(day + ": " + MonitorIngestionRunService.describe(ex));
            }
        }

        if (contracts + annexes > 0) {
            try {
                riskService.scoreAllContracts();
            } catch (Exception ex) {
                log.error("EOP risk scoring failed", ex);
                failures.add("Риск скоринг: " + MonitorIngestionRunService.describe(ex));
            }
            try {
                aggregateService.refreshFromAllContracts();
            } catch (Exception ex) {
                log.error("EOP company aggregation failed", ex);
                failures.add("Агрегиране на фирми: " + MonitorIngestionRunService.describe(ex));
            }
        }

        StringBuilder message = new StringBuilder("EOP: " + contracts + " договора, " + annexes
                + " анекса за област Смолян (" + daysWithData + "/" + cappedDays + " дни с публикувани данни)");
        if (rowErrors > 0) {
            message.append(", ").append(rowErrors).append(" пропуснати реда");
        }
        if (!failures.isEmpty()) {
            message.append(" | Грешки: ").append(String.join("; ", failures));
        }

        MonitorIngestionStatus status;
        if (failures.isEmpty()) {
            status = MonitorIngestionStatus.SUCCESS;
        } else {
            status = daysWithData > 0 ? MonitorIngestionStatus.PARTIAL : MonitorIngestionStatus.FAILED;
        }
        return runService.finish(run.getId(), status, contracts + annexes, message.toString());
    }

    private record DayResult(int contracts, int annexes, int rowErrors) {
    }

    /** Downloads a bucket object and keeps only rows whose buyer is a Smolyan-oblast authority. */
    private List<JsonNode> regionalRows(LocalDate day, String objectKey) throws Exception {
        if (objectKey == null) {
            return List.of();
        }
        List<JsonNode> kept = new ArrayList<>();
        for (JsonNode row : bucketClient.fetchArray(day, objectKey)) {
            if (MonitorRegionalConfig.isRegionalAuthority(text(row, "buyerRegistryNumber"))) {
                kept.add(row);
            }
        }
        return kept;
    }

    private DayResult persistDay(LocalDate day, List<JsonNode> contractRows, List<JsonNode> annexRows) {
        int contracts = 0;
        int annexes = 0;
        int rowErrors = 0;
        for (JsonNode row : contractRows) {
            try {
                if (importContract(row, day)) {
                    contracts++;
                }
            } catch (Exception ex) {
                rowErrors++;
                log.warn("EOP contract row skipped ({}): {}", day, ex.getMessage());
            }
        }
        for (JsonNode row : annexRows) {
            try {
                if (importAnnex(row, day)) {
                    annexes++;
                }
            } catch (Exception ex) {
                rowErrors++;
                log.warn("EOP annex row skipped ({}): {}", day, ex.getMessage());
            }
        }
        return new DayResult(contracts, annexes, rowErrors);
    }

    private boolean importContract(JsonNode row, LocalDate day) {
        String buyerEik = text(row, "buyerRegistryNumber");
        if (!MonitorRegionalConfig.isRegionalAuthority(buyerEik)) {
            return false;
        }
        String noticeId = text(row, "noticeId");
        if (noticeId == null || noticeId.isBlank()) {
            return false;
        }
        String sigmaId = "eop:" + noticeId;
        Optional<MonitorContractEntity> existing = contractRepository.findBySigmaId(sigmaId)
                .or(() -> findByUnp(text(row, "uniqueProcurementNumber")));
        boolean isNew = existing.isEmpty();
        MonitorContractEntity entity = existing.orElseGet(MonitorContractEntity::new);

        entity.setSigmaId(entity.getSigmaId() != null ? entity.getSigmaId() : sigmaId);
        entity.setUnp(MonitorColumnLimits.clamp(text(row, "uniqueProcurementNumber"), MonitorColumnLimits.UNP));
        entity.setSubject(require(text(row, "contractSubject"), text(row, "tenderName"), "subject"));
        entity.setAuthorityName(MonitorColumnLimits.clamp(text(row, "buyerName"), MonitorColumnLimits.AUTHORITY_NAME));
        entity.setAuthorityEik(buyerEik.trim());
        entity.setContractorName(MonitorColumnLimits.clamp(text(row, "supplierName"), MonitorColumnLimits.CONTRACTOR_NAME));
        entity.setContractorEik(MonitorColumnLimits.clamp(text(row, "supplierRegisterNumber"), MonitorColumnLimits.EIK));
        applySubcontractorFields(entity, row);
        // EOP publishes full CPV codes ("45233142-6"); sector_code only holds the division.
        entity.setSectorCode(cpvDivision(text(row, "tenderMainCpv")));
        entity.setProcedureType(MonitorColumnLimits.clamp(text(row, "procedureType"), MonitorColumnLimits.PROCEDURE_TYPE));
        entity.setSignedAt(parseDate(text(row, "contractDate"), text(row, "publicationDate")));
        entity.setPublicationDate(parseDate(text(row, "publicationDate"), null));
        String contractCurrency = text(row, "contractCurrency");
        entity.setAmountEur(toEur(text(row, "contractValue"), contractCurrency));
        applyContractCurrency(entity, contractCurrency, text(row, "contractValue"));
        entity.setEstimatedValueEur(toEur(text(row, "estimatedValue"), text(row, "currency")));
        entity.setEuFunded(parseBool(row, "isEuFunded"));
        entity.setBidsReceived(parseInt(row, "offersCount"));
        entity.setRegionScope(MonitorRegionalConfig.SMOLYAN_CITY_EIK.equals(buyerEik.trim())
                ? MonitorRegionScope.SMOLYAN_CITY
                : MonitorRegionScope.OBLAST_SMOLYAN);
        if (entity.getSourceUrl() == null || entity.getSourceUrl().isBlank()) {
            entity.setSourceUrl("https://storage.eop.bg/open-data-" + day);
        }
        entity.setFetchedAt(Instant.now());
        if (isNew) {
            entity.setOriginalAmountEur(entity.getAmountEur());
        }
        if (entity.getShortSummary() == null || entity.getShortSummary().isBlank()) {
            entity.setShortSummary(MonitorColumnLimits.clamp(entity.getSubject(), MonitorColumnLimits.SHORT_SUMMARY));
        }
        contractRepository.save(entity);
        upsertCompany(entity);
        upsertSubcontractorCompany(entity);
        return true;
    }

    private void applySubcontractorFields(MonitorContractEntity entity, JsonNode row) {
        String subName = MonitorColumnLimits.clamp(text(row, "subcontractorName"), MonitorColumnLimits.CONTRACTOR_NAME);
        String subEik = MonitorColumnLimits.clamp(text(row, "subcontractorRegistryNumber"), MonitorColumnLimits.EIK);
        boolean declared = parseYesNo(row, "hasSubcontractors") || subName != null || subEik != null;
        entity.setHasSubcontractors(declared);
        entity.setSubcontractorName(subName);
        entity.setSubcontractorEik(subEik);
        entity.setSubcontractingPercent(parsePercent(text(row, "subcontractingPercent")));
        entity.setSubcontractingAmountEur(toEur(text(row, "subcontractingAmount"), text(row, "contractCurrency")));
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

    private static BigDecimal parsePercent(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().replace(" ", "").replace(",", ".");
        try {
            return new BigDecimal(normalized);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static boolean parseYesNo(JsonNode row, String field) {
        String v = text(row, field);
        if (v == null) {
            return false;
        }
        String lower = v.toLowerCase();
        return "да".equals(lower) || "yes".equals(lower) || "1".equals(v) || "true".equals(lower);
    }

    private boolean importAnnex(JsonNode row, LocalDate day) {
        String buyerEik = text(row, "buyerRegistryNumber");
        if (!MonitorRegionalConfig.isRegionalAuthority(buyerEik)) {
            return false;
        }
        String noticeId = text(row, "noticeId");
        if (noticeId == null || noticeId.isBlank()) {
            return false;
        }
        if (amendmentRepository.findByEopNoticeId(noticeId).isPresent()) {
            return false;
        }

        String unp = text(row, "uniqueProcurementNumber");
        MonitorContractEntity contract = findByUnp(unp).orElse(null);

        MonitorAmendmentEntity amendment = new MonitorAmendmentEntity();
        amendment.setContractId(contract != null ? contract.getId() : null);
        amendment.setUnp(MonitorColumnLimits.clamp(unp, MonitorColumnLimits.UNP));
        amendment.setEopNoticeId(MonitorColumnLimits.clamp(noticeId, MonitorColumnLimits.EOP_NOTICE_ID));
        amendment.setPreviousAmountEur(toEur(text(row, "lastContractValue"), text(row, "contractCurrency")));
        amendment.setNewAmountEur(toEur(text(row, "currentContractValue"), text(row, "contractCurrency")));
        amendment.setDeltaEur(toEur(text(row, "contractValueDifference"), text(row, "contractCurrency")));
        amendment.setChangeDescription(text(row, "changeDescription"));
        amendment.setChangeReason(MonitorColumnLimits.clamp(
                firstNonBlank(text(row, "changeReasonDescription"), text(row, "changeReason")),
                MonitorColumnLimits.CHANGE_REASON));
        amendment.setAmendedAt(parseDate(text(row, "contractDate"), text(row, "publicationDate")));
        amendment.setSourceUrl("https://storage.eop.bg/open-data-" + day);
        amendment.setFetchedAt(Instant.now());
        amendmentRepository.save(amendment);

        if (contract != null && amendment.getNewAmountEur() != null) {
            contract.setAmountEur(amendment.getNewAmountEur());
            contract.setFetchedAt(Instant.now());
            contractRepository.save(contract);
        }
        return true;
    }

    /** Called from SIGMA re-import when contract value changes. */
    public void recordAmountChangeAmendment(
            MonitorContractEntity contract, BigDecimal previous, BigDecimal current, String reason) {
        MonitorAmendmentEntity amendment = new MonitorAmendmentEntity();
        amendment.setContractId(contract.getId());
        amendment.setUnp(contract.getUnp());
        amendment.setPreviousAmountEur(previous);
        amendment.setNewAmountEur(current);
        amendment.setDeltaEur(current.subtract(previous));
        amendment.setChangeDescription(reason);
        amendment.setAmendedAt(LocalDate.now());
        amendment.setSourceUrl(contract.getSourceUrl());
        amendment.setFetchedAt(Instant.now());
        amendmentRepository.save(amendment);
    }

    private Optional<MonitorContractEntity> findByUnp(String unp) {
        if (unp == null || unp.isBlank()) {
            return Optional.empty();
        }
        return contractRepository.findFirstByUnp(unp);
    }

    private void upsertCompany(MonitorContractEntity contract) {
        String eik = contract.getContractorEik();
        if (eik == null || eik.isBlank()) {
            return;
        }
        MonitorCompanyEntity company = companyRepository.findByEik(eik.trim())
                .orElseGet(MonitorCompanyEntity::new);
        company.setEik(eik.trim());
        if (contract.getContractorName() != null && !contract.getContractorName().isBlank()) {
            company.setName(contract.getContractorName().trim());
        } else if (company.getName() == null) {
            company.setName("ЕИК " + eik.trim());
        }
        companyRepository.save(company);
    }

    private static String text(JsonNode row, String field) {
        JsonNode n = row.get(field);
        if (n == null || n.isNull()) {
            return null;
        }
        String v = n.asText().trim();
        return v.isEmpty() ? null : v;
    }

    private static boolean parseBool(JsonNode row, String field) {
        String v = text(row, field);
        return v != null && ("1".equals(v) || "true".equalsIgnoreCase(v) || "yes".equalsIgnoreCase(v));
    }

    private static Integer parseInt(JsonNode row, String field) {
        String v = text(row, field);
        if (v == null) {
            return null;
        }
        try {
            return Integer.parseInt(v.replaceAll("[^0-9-]", ""));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static LocalDate parseDate(String primary, String fallback) {
        String v = firstNonBlank(primary, fallback);
        if (v == null) {
            return null;
        }
        if (v.length() >= 10) {
            try {
                return LocalDate.parse(v.substring(0, 10));
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private static BigDecimal toEur(String value, String currency) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().replace(" ", "").replace(",", ".");
        try {
            BigDecimal amount = new BigDecimal(normalized);
            return MonitorCurrencyUtil.toEur(amount, currency);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static void applyContractCurrency(MonitorContractEntity entity, String currencyRaw, String valueRaw) {
        String normalized = MonitorCurrencyUtil.normalizeEopCurrency(currencyRaw);
        if (normalized != null) {
            entity.setOriginalCurrency(normalized);
            entity.setCurrencyWarning(null);
            return;
        }
        if (valueRaw == null || valueRaw.isBlank()) {
            entity.setOriginalCurrency(null);
            entity.setCurrencyWarning(null);
            return;
        }
        entity.setOriginalCurrency("UNKNOWN");
        if (currencyRaw == null || currencyRaw.isBlank()) {
            entity.setCurrencyWarning("EOP: липсва contractCurrency — сумата е записана като EUR без потвърждение");
        } else {
            entity.setCurrencyWarning("EOP: неразпозната валута «" + currencyRaw.trim() + "»");
        }
    }

    private static String require(String primary, String fallback, String field) {
        String v = firstNonBlank(primary, fallback);
        if (v == null) {
            throw new IllegalArgumentException("Missing EOP field: " + field);
        }
        return v;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a.trim();
        }
        if (b != null && !b.isBlank()) {
            return b.trim();
        }
        return null;
    }

    /** SIGMA exports the two-digit CPV division; normalise EOP's full code so both feeds agree. */
    private static String cpvDivision(String cpv) {
        if (cpv == null) {
            return null;
        }
        String digits = cpv.trim().replaceAll("\\D", "");
        return digits.length() >= 2 ? digits.substring(0, 2) : null;
    }
}

package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorRegionalReportEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorRegionalReportRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAiFindingDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAiReportDTO;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Full AI accountability analyses — regional reports and per-contract deep dives. */
@Service
public class MonitorAiAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(MonitorAiAnalysisService.class);
    private static final int MAX_ANALYSIS_CHARS = 8000;

    private final MonitorGeminiClient geminiClient;
    private final MonitorAnalysisContextBuilder contextBuilder;
    private final MonitorRegionalReportRepository reportRepository;
    private final ObjectMapper objectMapper;

    public MonitorAiAnalysisService(
            MonitorGeminiClient geminiClient,
            MonitorAnalysisContextBuilder contextBuilder,
            MonitorRegionalReportRepository reportRepository,
            ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.contextBuilder = contextBuilder;
        this.reportRepository = reportRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public MonitorAiReportDTO loadLatestReport(MonitorScope scope) {
        String authority = scope.authorityFilter();
        Optional<MonitorRegionalReportEntity> entity = authority == null
                ? reportRepository.findFirstByAuthorityEikIsNullOrderByGeneratedAtDesc()
                : reportRepository.findFirstByAuthorityEikOrderByGeneratedAtDesc(authority);
        return entity.map(this::toDto).orElse(MonitorAiReportDTO.empty());
    }

    public MonitorAiReportDTO generateRegionalReport(MonitorScope scope) {
        if (!geminiClient.isAvailable()) {
            return MonitorAiReportDTO.empty();
        }
        try {
            String facts = contextBuilder.buildRegionalContext(scope);
            MonitorGeminiClient.MonitorRegionalReportResult result =
                    geminiClient.generateRegionalReport(facts);
            if (result == null) {
                return MonitorAiReportDTO.empty();
            }
            MonitorAiReportDTO dto = toDto(result, Instant.now());
            persistReport(scope, dto);
            return dto;
        } catch (MonitorGeminiAccessException | MonitorRateLimitException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Regional AI report failed: {}", ex.getMessage());
            return MonitorAiReportDTO.empty();
        }
    }

    /** Gemini HTTP runs outside a DB transaction to avoid connection leaks. */
    public boolean analyzeDocument(MonitorDocumentEntity document) {
        if (!geminiClient.isAvailable()) {
            return false;
        }
        try {
            String facts = contextBuilder.buildDocumentContext(document);
            MonitorGeminiClient.MonitorDocumentDeepAnalysis result =
                    geminiClient.analyzeDocumentDeep(facts);
            if (result == null || result.analysis() == null || result.analysis().isBlank()) {
                return false;
            }
            applyDocumentAnalysis(document, result);
            return true;
        } catch (MonitorGeminiAccessException | MonitorRateLimitException ex) {
            throw ex;
        } catch (Exception ex) {
            if (MonitorGeminiAccessException.isAccessDeniedMessage(ex.getMessage())) {
                throw new MonitorGeminiAccessException(403, ex.getMessage());
            }
            log.warn("Deep document analysis failed for {}: {}", document.getId(), ex.getMessage());
            return false;
        }
    }

    private void applyDocumentAnalysis(
            MonitorDocumentEntity document, MonitorGeminiClient.MonitorDocumentDeepAnalysis result) {
        StringBuilder full = new StringBuilder(result.analysis());
        if (result.criticalAngle() != null && !result.criticalAngle().isBlank()) {
            full.append("\n\nКритичен ъгъл: ").append(result.criticalAngle());
        }
        String analysis = full.length() > MAX_ANALYSIS_CHARS
                ? full.substring(0, MAX_ANALYSIS_CHARS - 3) + "..."
                : full.toString();
        document.setAiAnalysis(analysis);
        if (result.headline() != null && !result.headline().isBlank()) {
            document.setShortSummary(MonitorColumnLimits.clamp(
                    result.headline(), MonitorColumnLimits.SHORT_SUMMARY));
        }
        if (result.whyItMatters() != null && !result.whyItMatters().isBlank()) {
            document.setInsightWhy(MonitorColumnLimits.clamp(
                    result.whyItMatters(), MonitorColumnLimits.INSIGHT_WHY));
        }
        document.setAiCategory(result.category());
        document.setImpactScore(result.impactScore());
    }

    /** Gemini HTTP runs outside a DB transaction to avoid connection leaks. */
    public boolean analyzeContract(MonitorContractEntity contract) {
        if (!geminiClient.isAvailable()) {
            return false;
        }
        try {
            String facts = contextBuilder.buildContractContext(contract);
            MonitorGeminiClient.MonitorContractDeepAnalysis result =
                    geminiClient.analyzeContractDeep(facts);
            if (result == null || result.analysis() == null || result.analysis().isBlank()) {
                return false;
            }
            applyDeepAnalysis(contract, result);
            return true;
        } catch (MonitorGeminiAccessException | MonitorRateLimitException ex) {
            throw ex;
        } catch (Exception ex) {
            if (MonitorGeminiAccessException.isAccessDeniedMessage(ex.getMessage())) {
                throw new MonitorGeminiAccessException(403, ex.getMessage());
            }
            log.warn("Deep contract analysis failed for {}: {}", contract.getId(), ex.getMessage());
            return false;
        }
    }

    private void applyDeepAnalysis(
            MonitorContractEntity contract, MonitorGeminiClient.MonitorContractDeepAnalysis result) {
        StringBuilder full = new StringBuilder(result.analysis());
        if (result.moneyAtStake() != null && !result.moneyAtStake().isBlank()) {
            full.append("\n\nПари: ").append(result.moneyAtStake());
        }
        if (result.whatIsWrong() != null && !result.whatIsWrong().isBlank()) {
            full.append("\n\nКакво е нередно: ").append(result.whatIsWrong());
        }
        String analysis = full.length() > MAX_ANALYSIS_CHARS
                ? full.substring(0, MAX_ANALYSIS_CHARS - 3) + "..."
                : full.toString();
        contract.setAiAnalysis(analysis);
        if (result.headline() != null && !result.headline().isBlank()) {
            contract.setShortSummary(MonitorColumnLimits.clamp(
                    result.headline(), MonitorColumnLimits.SHORT_SUMMARY));
        }
        if (result.citizenTakeaway() != null && !result.citizenTakeaway().isBlank()) {
            contract.setInsightWhy(MonitorColumnLimits.clamp(
                    result.citizenTakeaway(), MonitorColumnLimits.INSIGHT_WHY));
        }
        contract.setAiCategory(result.category());
        contract.setImpactScore(result.impactScore());
        contract.setGeminiRefined(true);
    }

    private void persistReport(MonitorScope scope, MonitorAiReportDTO dto) {
        try {
            MonitorRegionalReportEntity entity = new MonitorRegionalReportEntity();
            entity.setAuthorityEik(scope.authorityFilter());
            entity.setScopeLabel(scope.label());
            entity.setReportJson(objectMapper.writeValueAsString(dto));
            entity.setGeneratedAt(dto.generatedAt() != null ? dto.generatedAt() : Instant.now());
            reportRepository.save(entity);
        } catch (Exception ex) {
            log.warn("Could not persist regional report: {}", ex.getMessage());
        }
    }

    private MonitorAiReportDTO toDto(MonitorRegionalReportEntity entity) {
        try {
            return objectMapper.readValue(entity.getReportJson(), MonitorAiReportDTO.class);
        } catch (Exception ex) {
            log.warn("Could not parse stored report: {}", ex.getMessage());
            return MonitorAiReportDTO.empty();
        }
    }

    private MonitorAiReportDTO toDto(MonitorGeminiClient.MonitorRegionalReportResult result, Instant at) {
        return new MonitorAiReportDTO(
                result.executiveSummary(),
                result.moneyLeaks().stream()
                        .map(f -> new MonitorAiFindingDTO(f.title(), f.body(), f.severity()))
                        .toList(),
                result.irregularities().stream()
                        .map(f -> new MonitorAiFindingDTO(f.title(), f.body(), f.severity()))
                        .toList(),
                result.conclusions(),
                result.watchNext(),
                at,
                true);
    }
}

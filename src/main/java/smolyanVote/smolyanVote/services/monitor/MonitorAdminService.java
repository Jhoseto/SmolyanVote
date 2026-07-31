package smolyanVote.smolyanVote.services.monitor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorDocumentRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorIngestionRunRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminAiStatsDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminDocumentDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminIngestionLogDTO;

import java.util.List;

@Service
public class MonitorAdminService {

    private final MonitorDocumentRepository documentRepository;
    private final MonitorContractRepository contractRepository;
    private final MonitorIngestionRunRepository ingestionRunRepository;
    private final MonitorGeminiClient geminiClient;

    public MonitorAdminService(
            MonitorDocumentRepository documentRepository,
            MonitorContractRepository contractRepository,
            MonitorIngestionRunRepository ingestionRunRepository,
            MonitorGeminiClient geminiClient) {
        this.documentRepository = documentRepository;
        this.contractRepository = contractRepository;
        this.ingestionRunRepository = ingestionRunRepository;
        this.geminiClient = geminiClient;
    }

    @Transactional(readOnly = true)
    public List<MonitorAdminIngestionLogDTO> getIngestionLogs(int limit) {
        int capped = Math.min(Math.max(limit, 1), 50);
        return ingestionRunRepository.findTop20ByOrderByStartedAtDesc().stream()
                .limit(capped)
                .map(this::toLogDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonitorAdminDocumentDTO> listDocuments(String filter, int limit) {
        int capped = Math.min(Math.max(limit, 1), 100);
        List<MonitorDocumentEntity> docs;
        if ("pending".equalsIgnoreCase(filter)) {
            docs = documentRepository.findPendingAiProcessing(PageRequest.of(0, capped));
        } else {
            docs = documentRepository.findAll(PageRequest.of(0, capped,
                    org.springframework.data.domain.Sort.by("fetchedAt").descending())).getContent();
        }
        return docs.stream().map(this::toDocumentDto).toList();
    }

    @Transactional(readOnly = true)
    public MonitorAdminAiStatsDTO getAiStats() {
        long pendingDocs = documentRepository.findPendingAiProcessing(PageRequest.of(0, 1_000)).size();
        long pendingContracts = contractRepository.countPendingContractAiProcessing(
                MonitorRiskService.FLAG_THRESHOLD);
        return new MonitorAdminAiStatsDTO(
                pendingDocs,
                pendingContracts,
                documentRepository.count(),
                contractRepository.count(),
                geminiClient.isConfigured(),
                geminiClient.modelName());
    }

    private MonitorAdminIngestionLogDTO toLogDto(MonitorIngestionRunEntity run) {
        return new MonitorAdminIngestionLogDTO(
                run.getId(),
                run.getIngestionType().name(),
                run.getStatus().name(),
                run.getStartedAt(),
                run.getFinishedAt(),
                run.getRecordsProcessed(),
                run.getMessage());
    }

    private MonitorAdminDocumentDTO toDocumentDto(MonitorDocumentEntity doc) {
        boolean aiPending = doc.getRawContent() != null && !doc.getRawContent().isBlank()
                && (doc.getShortSummary() == null || doc.getShortSummary().isBlank());
        return new MonitorAdminDocumentDTO(
                doc.getId(),
                doc.getTitle(),
                doc.getDocumentType().name(),
                doc.getShortSummary(),
                doc.getSourceUrl(),
                doc.getContentHash(),
                doc.getPublishedAt(),
                doc.getFetchedAt(),
                aiPending,
                doc.getRawContent() != null && !doc.getRawContent().isBlank());
    }
}

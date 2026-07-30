package smolyanVote.smolyanVote.services.monitor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorAmendmentEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorAmendmentRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminContractDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorContractUpdateRequest;

/** Full admin CRUD over ingested contracts — for correcting bad rows or removing duplicates. */
@Service
public class MonitorContractAdminService {

    private final MonitorContractRepository contractRepository;
    private final MonitorAmendmentRepository amendmentRepository;
    private final MonitorRiskService riskService;
    private final MonitorCompanyAggregateService aggregateService;

    public MonitorContractAdminService(
            MonitorContractRepository contractRepository,
            MonitorAmendmentRepository amendmentRepository,
            MonitorRiskService riskService,
            MonitorCompanyAggregateService aggregateService) {
        this.contractRepository = contractRepository;
        this.amendmentRepository = amendmentRepository;
        this.riskService = riskService;
        this.aggregateService = aggregateService;
    }

    @Transactional(readOnly = true)
    public Page<MonitorAdminContractDTO> search(String search, int page, int size) {
        int cappedSize = Math.min(Math.max(size, 1), 100);
        Page<MonitorContractEntity> result = contractRepository.search(
                search == null ? "" : search.trim(),
                PageRequest.of(Math.max(page, 0), cappedSize));
        return result.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public MonitorAdminContractDTO get(Long id) {
        return contractRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Договорът не е намерен"));
    }

    @Transactional
    public MonitorAdminContractDTO update(Long id, MonitorContractUpdateRequest req) {
        MonitorContractEntity c = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Договорът не е намерен"));
        if (req.subject() != null && !req.subject().isBlank()) {
            c.setSubject(req.subject().trim());
        }
        if (req.authorityName() != null) {
            c.setAuthorityName(req.authorityName().trim());
        }
        if (req.authorityEik() != null && !req.authorityEik().isBlank()) {
            c.setAuthorityEik(req.authorityEik().trim());
        }
        if (req.contractorName() != null) {
            c.setContractorName(req.contractorName().trim());
        }
        if (req.contractorEik() != null) {
            c.setContractorEik(req.contractorEik().trim());
        }
        c.setSectorCode(req.sectorCode() != null ? req.sectorCode().trim() : null);
        c.setProcedureType(req.procedureType() != null ? req.procedureType().trim() : null);
        c.setSignedAt(req.signedAt());
        c.setAmountEur(req.amountEur());
        c.setEuFunded(req.euFunded());
        c.setBidsReceived(req.bidsReceived());
        c.setSourceUrl(req.sourceUrl() != null ? req.sourceUrl().trim() : null);

        riskService.scoreContract(c);
        MonitorContractEntity saved = contractRepository.save(c);
        aggregateService.refreshFromAllContracts();
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!contractRepository.existsById(id)) {
            throw new IllegalArgumentException("Договорът не е намерен");
        }
        for (MonitorAmendmentEntity amendment : amendmentRepository.findByContractIdOrderByAmendedAtDesc(id)) {
            amendmentRepository.delete(amendment);
        }
        contractRepository.deleteById(id);
        aggregateService.refreshFromAllContracts();
    }

    private MonitorAdminContractDTO toDto(MonitorContractEntity c) {
        return new MonitorAdminContractDTO(
                c.getId(),
                c.getSigmaId(),
                c.getUnp(),
                c.getSubject(),
                c.getAuthorityName(),
                c.getAuthorityEik(),
                c.getContractorName(),
                c.getContractorEik(),
                c.getSectorCode(),
                c.getProcedureType(),
                c.getSignedAt(),
                c.getAmountEur(),
                c.getOriginalAmountEur(),
                c.getEstimatedValueEur(),
                c.getPublicationDate(),
                c.isEuFunded(),
                c.getBidsReceived(),
                c.getRiskScore(),
                c.getSourceUrl());
    }
}

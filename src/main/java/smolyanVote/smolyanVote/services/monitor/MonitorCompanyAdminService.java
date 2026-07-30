package smolyanVote.smolyanVote.services.monitor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorAdminCompanyDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCompanyUpdateRequest;

/** Full admin CRUD over enriched companies — correct bad Търговски регистър data or remove duplicates. */
@Service
public class MonitorCompanyAdminService {

    private final MonitorCompanyRepository companyRepository;

    public MonitorCompanyAdminService(MonitorCompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<MonitorAdminCompanyDTO> search(String search, int page, int size) {
        int cappedSize = Math.min(Math.max(size, 1), 100);
        Page<MonitorCompanyEntity> result = companyRepository.search(
                search == null ? "" : search.trim(),
                PageRequest.of(Math.max(page, 0), cappedSize));
        return result.map(this::toDto);
    }

    @Transactional
    public MonitorAdminCompanyDTO update(Long id, MonitorCompanyUpdateRequest req) {
        MonitorCompanyEntity c = companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Фирмата не е намерена"));
        if (req.name() != null && !req.name().isBlank()) {
            c.setName(req.name().trim());
        }
        c.setConsortium(req.consortium());
        c.setLegalForm(req.legalForm() != null ? req.legalForm().trim() : null);
        c.setRegisteredAddress(req.registeredAddress() != null ? req.registeredAddress().trim() : null);
        c.setManagersSummary(req.managersSummary() != null ? req.managersSummary().trim() : null);
        return toDto(companyRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new IllegalArgumentException("Фирмата не е намерена");
        }
        companyRepository.deleteById(id);
    }

    private MonitorAdminCompanyDTO toDto(MonitorCompanyEntity c) {
        return new MonitorAdminCompanyDTO(
                c.getId(),
                c.getEik(),
                c.getName(),
                c.isConsortium(),
                c.getTotalWonEur(),
                c.getContractCount(),
                c.getCompositeRiskScore(),
                c.getLegalForm(),
                c.getRegisteredAddress(),
                c.getManagersSummary(),
                c.getRegistryStatus(),
                c.getFoundedAt());
    }
}

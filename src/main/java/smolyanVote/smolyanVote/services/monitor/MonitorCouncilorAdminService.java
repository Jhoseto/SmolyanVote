package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorCouncilorEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCouncilorRepository;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCouncilorCardDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorCouncilorRequest;

import java.util.List;

/** Full admin CRUD over councilor profiles — manual corrections between scraper syncs. */
@Service
public class MonitorCouncilorAdminService {

    private static final String ZPKONPI_PORTAL = "https://app.court.bg/portal/";

    private final MonitorCouncilorRepository councilorRepository;

    public MonitorCouncilorAdminService(MonitorCouncilorRepository councilorRepository) {
        this.councilorRepository = councilorRepository;
    }

    @Transactional(readOnly = true)
    public List<MonitorCouncilorCardDTO> list() {
        return councilorRepository.findAllByOrderByFullNameAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public MonitorCouncilorCardDTO create(MonitorCouncilorRequest req) {
        if (req.fullName() == null || req.fullName().isBlank()) {
            throw new IllegalArgumentException("Името е задължително");
        }
        MonitorCouncilorEntity entity = new MonitorCouncilorEntity();
        apply(entity, req);
        return toDto(councilorRepository.save(entity));
    }

    @Transactional
    public MonitorCouncilorCardDTO update(Long id, MonitorCouncilorRequest req) {
        MonitorCouncilorEntity entity = councilorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Съветникът не е намерен"));
        apply(entity, req);
        return toDto(councilorRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!councilorRepository.existsById(id)) {
            throw new IllegalArgumentException("Съветникът не е намерен");
        }
        councilorRepository.deleteById(id);
    }

    private void apply(MonitorCouncilorEntity entity, MonitorCouncilorRequest req) {
        if (req.fullName() != null && !req.fullName().isBlank()) {
            entity.setFullName(req.fullName().trim());
        }
        entity.setRoleLabel(req.roleLabel() != null ? req.roleLabel().trim() : "Съветник");
        entity.setParty(req.party() != null ? req.party().trim() : null);
        entity.setMandatePeriod(req.mandatePeriod() != null ? req.mandatePeriod().trim() : null);
        entity.setZpokonpiChecked(req.zpokonpiChecked());
        entity.setZpokonpiNote(req.zpokonpiNote() != null ? req.zpokonpiNote().trim() : null);
        entity.setSourceUrl(req.sourceUrl() != null ? req.sourceUrl().trim() : null);
    }

    private MonitorCouncilorCardDTO toDto(MonitorCouncilorEntity c) {
        return new MonitorCouncilorCardDTO(
                c.getId(),
                c.getFullName(),
                c.getRoleLabel(),
                c.getParty(),
                c.getMandatePeriod(),
                c.isZpokonpiChecked(),
                c.getZpokonpiNote(),
                c.getZpokonpiStatus(),
                c.getZpokonpiRegisterUrl(),
                c.getSourceUrl(),
                ZPKONPI_PORTAL);
    }
}

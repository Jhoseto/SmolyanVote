package smolyanVote.smolyanVote.services.monitor;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorCouncilorEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCouncilorRepository;

import java.util.List;

/**
 * Seed councilor profiles for ОбС Смолян (2023–2027 mandate).
 * ZPKONPI cross-check notes are admin-maintained.
 */
@Component
public class MonitorCouncilSeedService {

    private static final List<CouncilorSeed> SEEDS = List.of(
            new CouncilorSeed("Недялко Славчев", "Кмет на община Смолян", null, "2023–2027",
                    "https://smolyan.bg/bg/menu/sl/10"),
            new CouncilorSeed("Председател на ОбС", "Председател на ОбС", null, "2023–2027",
                    "https://smolyan.bg/bg/menu/sl/10"),
            new CouncilorSeed("Общински съветници", "Съветник", "различни", "2023–2027",
                    "https://smolyan.bg/bg/menu/sl/10"));

    private final MonitorCouncilorRepository councilorRepository;

    public MonitorCouncilSeedService(MonitorCouncilorRepository councilorRepository) {
        this.councilorRepository = councilorRepository;
    }

    @PostConstruct
    @Transactional
    public void seedIfEmpty() {
        if (councilorRepository.count() > 0) {
            return;
        }
        for (CouncilorSeed seed : SEEDS) {
            MonitorCouncilorEntity entity = new MonitorCouncilorEntity();
            entity.setFullName(seed.name());
            entity.setRoleLabel(seed.role());
            entity.setParty(seed.party());
            entity.setMandatePeriod(seed.mandate());
            entity.setSourceUrl(seed.sourceUrl());
            entity.setZpokonpiChecked(false);
            entity.setZpokonpiNote("Кръстосана проверка с декларации по ЗПКОНПИ — предстои.");
            councilorRepository.save(entity);
        }
    }

    private record CouncilorSeed(String name, String role, String party, String mandate, String sourceUrl) {
    }
}

package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorCouncilorEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCouncilorRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Loads {@link MonitorCouncilorSeed} into the database on startup.
 * Seed data is the source of truth for public councilor profiles — no scraper sync required.
 */
@Component
public class MonitorCouncilorBootstrap {

    private static final Logger log = LoggerFactory.getLogger(MonitorCouncilorBootstrap.class);

    private final MonitorCouncilorRepository repository;
    private final MonitorJobLauncher jobLauncher;
    private final MonitorZpokonpiVerificationService zpokonpiVerificationService;

    public MonitorCouncilorBootstrap(
            MonitorCouncilorRepository repository,
            MonitorJobLauncher jobLauncher,
            MonitorZpokonpiVerificationService zpokonpiVerificationService) {
        this.repository = repository;
        this.jobLauncher = jobLauncher;
        this.zpokonpiVerificationService = zpokonpiVerificationService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedCouncilors() {
        List<MonitorCouncilorSeed.SeedCouncilor> seeds = MonitorCouncilorSeed.all();
        Set<String> touchedAuthorities = new HashSet<>();
        int upserted = 0;

        for (MonitorCouncilorSeed.SeedCouncilor seed : seeds) {
            MonitorCouncilorEntity entity = repository
                    .findByAuthorityEikAndFullName(seed.authorityEik(), seed.fullName())
                    .orElseGet(MonitorCouncilorEntity::new);
            entity.setAuthorityEik(seed.authorityEik());
            entity.setFullName(seed.fullName());
            entity.setRoleLabel(seed.roleLabel());
            entity.setParty(seed.party());
            entity.setMandatePeriod(MonitorCouncilorSeed.MANDATE);
            entity.setSourceUrl(seed.sourceUrl());
            if (!entity.isZpokonpiChecked()) {
                entity.setZpokonpiStatus("PENDING");
                entity.setZpokonpiNote("Кръстосана проверка с декларации по ЗПКОНПИ — предстои.");
            }
            repository.save(entity);
            touchedAuthorities.add(seed.authorityEik());
            upserted++;
        }

        for (String eik : touchedAuthorities) {
            Set<String> seedNames = new HashSet<>();
            for (MonitorCouncilorSeed.SeedCouncilor seed : seeds) {
                if (eik.equals(seed.authorityEik())) {
                    seedNames.add(seed.fullName());
                }
            }
            for (MonitorCouncilorEntity existing : repository.findByAuthorityEikOrderByFullNameAsc(eik)) {
                if (!seedNames.contains(existing.getFullName())) {
                    repository.delete(existing);
                }
            }
        }

        log.info(
                "Seeded {} municipal councilor profile(s) across {} municipalities (mandate {})",
                upserted,
                touchedAuthorities.size(),
                MonitorCouncilorSeed.MANDATE);

        jobLauncher.launch("ZPKONPI", "ЗПКОНПИ кръстосана проверка (след seed)", () ->
                MonitorJobLauncher.JobResult.ok(zpokonpiVerificationService.verifyAll().message()));
    }
}

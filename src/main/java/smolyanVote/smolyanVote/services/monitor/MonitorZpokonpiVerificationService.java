package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorCouncilorEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCouncilorRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Cross-checks seeded councilor profiles against municipal ZPKONPI registers and official rosters.
 */
@Service
public class MonitorZpokonpiVerificationService {

    private static final Logger log = LoggerFactory.getLogger(MonitorZpokonpiVerificationService.class);

    private final MonitorCouncilorRepository councilorRepository;
    private final MonitorZpokonpiFetchClient fetchClient;
    private final MonitorZpokonpiScraperClient scraperClient;

    public MonitorZpokonpiVerificationService(
            MonitorCouncilorRepository councilorRepository,
            MonitorZpokonpiFetchClient fetchClient,
            MonitorZpokonpiScraperClient scraperClient) {
        this.councilorRepository = councilorRepository;
        this.fetchClient = fetchClient;
        this.scraperClient = scraperClient;
    }

    public record VerificationSummary(
            int municipalities,
            int councilors,
            int verified,
            int warnings,
            int notFound,
            int unavailable,
            String message) {
    }

    @Transactional
    public VerificationSummary verifyAll() {
        int municipalities = 0;
        int councilors = 0;
        int verified = 0;
        int warnings = 0;
        int notFound = 0;
        int unavailable = 0;

        for (String eik : MonitorRegionalConfig.OBLAST_SMOLYAN_EIKS) {
            MunicipalitySnapshot snapshot = loadMunicipalitySnapshot(eik);
            if (snapshot.councilors().isEmpty()) {
                continue;
            }
            municipalities++;
            for (MonitorCouncilorEntity councilor : snapshot.councilors()) {
                councilors++;
                Outcome outcome = evaluate(councilor, snapshot);
                applyOutcome(councilor, outcome);
                councilorRepository.save(councilor);
                switch (outcome.status()) {
                    case OK -> verified++;
                    case WARNING, ROSTER_ONLY -> {
                        if (outcome.status() == MonitorZpokonpiStatus.WARNING) {
                            warnings++;
                        }
                    }
                    case NOT_FOUND -> notFound++;
                    case UNAVAILABLE -> unavailable++;
                    default -> {
                    }
                }
            }
        }

        String message = String.format(
                "ЗПКОНПИ проверка: %d профила в %d общини — %d потвърдени, %d предупреждения, %d липсващи, %d недостъпни източници.",
                councilors, municipalities, verified, warnings, notFound, unavailable);
        log.info(message);
        return new VerificationSummary(municipalities, councilors, verified, warnings, notFound, unavailable, message);
    }

    @Transactional
    public VerificationSummary verifyAuthority(String authorityEik) {
        MunicipalitySnapshot snapshot = loadMunicipalitySnapshot(authorityEik);
        int verified = 0;
        int warnings = 0;
        int notFound = 0;
        int unavailable = 0;
        for (MonitorCouncilorEntity councilor : snapshot.councilors()) {
            Outcome outcome = evaluate(councilor, snapshot);
            applyOutcome(councilor, outcome);
            councilorRepository.save(councilor);
            switch (outcome.status()) {
                case OK -> verified++;
                case WARNING -> warnings++;
                case NOT_FOUND -> notFound++;
                case UNAVAILABLE -> unavailable++;
                default -> {
                }
            }
        }
        String label = MonitorRegionalConfig.labelForAuthority(authorityEik, authorityEik);
        String message = String.format(
                "%s: %d профила — %d потвърдени, %d предупреждения, %d липсващи, %d недостъпни.",
                label,
                snapshot.councilors().size(),
                verified,
                warnings,
                notFound,
                unavailable);
        return new VerificationSummary(1, snapshot.councilors().size(), verified, warnings, notFound, unavailable, message);
    }

    private MunicipalitySnapshot loadMunicipalitySnapshot(String eik) {
        List<MonitorCouncilorEntity> councilors = councilorRepository.findByAuthorityEikOrderByFullNameAsc(eik);
        Optional<MonitorMunicipalityZpokonpiConfig.Source> config = MonitorMunicipalityZpokonpiConfig.forEik(eik);

        Set<String> registerNames = new LinkedHashSet<>();
        Set<String> rosterNames = new LinkedHashSet<>();
        boolean registerFetched = false;
        boolean registerFetchFailed = false;
        boolean rosterFetched = false;
        boolean rosterFetchFailed = false;
        String registerLink = config.map(MonitorMunicipalityZpokonpiConfig.Source::publicRegisterLink).orElse(null);
        List<String> fetchErrors = new ArrayList<>();

        if (config.isPresent()) {
            MonitorMunicipalityZpokonpiConfig.Source source = config.get();
            if (source.requiresScraper()) {
                ingestScrapedPages(source.registerUrls(), registerNames, fetchErrors);
                registerFetched = !registerNames.isEmpty();
                registerFetchFailed = !registerFetched && !source.registerUrls().isEmpty();
            } else {
                for (String url : source.registerUrls()) {
                    MonitorZpokonpiFetchClient.FetchResult result = fetchClient.fetch(url);
                    if (result.ok()) {
                        registerFetched = true;
                        registerNames.addAll(MonitorZpokonpiHtmlParser.extractPersonNames(result.html()));
                    } else {
                        registerFetchFailed = true;
                        fetchErrors.add(result.error());
                    }
                }
            }
            List<String> rosterUrls = new ArrayList<>(source.rosterUrls());
            for (MonitorCouncilorEntity c : councilors) {
                if (c.getSourceUrl() != null
                        && !c.getSourceUrl().isBlank()
                        && !c.getSourceUrl().contains("wikipedia.org")
                        && !rosterUrls.contains(c.getSourceUrl())) {
                    rosterUrls.add(c.getSourceUrl());
                }
            }
            if (source.requiresScraper()) {
                Set<String> rosterBefore = new LinkedHashSet<>(rosterNames);
                ingestScrapedPages(rosterUrls, rosterNames, fetchErrors);
                rosterFetched = rosterNames.size() > rosterBefore.size() || !rosterNames.isEmpty();
                rosterFetchFailed = !rosterFetched && !rosterUrls.isEmpty();
            } else {
                for (String url : rosterUrls) {
                    MonitorZpokonpiFetchClient.FetchResult result = fetchClient.fetch(url);
                    if (result.ok()) {
                        rosterFetched = true;
                        rosterNames.addAll(MonitorZpokonpiHtmlParser.extractPersonNames(result.html()));
                    } else {
                        rosterFetchFailed = true;
                        fetchErrors.add(result.error());
                    }
                }
            }
        }

        return new MunicipalitySnapshot(
                councilors,
                registerNames,
                rosterNames,
                registerFetched,
                registerFetchFailed,
                rosterFetched,
                rosterFetchFailed,
                registerLink,
                fetchErrors);
    }

    private void ingestScrapedPages(List<String> urls, Set<String> namesOut, List<String> errorsOut) {
        if (urls == null || urls.isEmpty()) {
            return;
        }
        for (MonitorZpokonpiScraperClient.PageResult page : scraperClient.fetchPages(urls)) {
            if (page.ok() && page.html() != null) {
                namesOut.addAll(MonitorZpokonpiHtmlParser.extractPersonNames(page.html()));
            } else if (page.error() != null) {
                errorsOut.add(page.error());
            }
        }
    }

    private static Outcome evaluate(MonitorCouncilorEntity councilor, MunicipalitySnapshot snapshot) {
        String name = councilor.getFullName();
        boolean inRegister = snapshot.registerNames().stream().anyMatch(n -> MonitorZpokonpiNameMatcher.matches(name, n));
        boolean inRoster = snapshot.rosterNames().stream().anyMatch(n -> MonitorZpokonpiNameMatcher.matches(name, n));

        if (inRegister) {
            return new Outcome(
                    MonitorZpokonpiStatus.OK,
                    true,
                    "Декларацията е намерена в публичния регистър по ЗПКОНПИ.",
                    snapshot.registerLink());
        }

        if (snapshot.registerFetchFailed() && !snapshot.registerFetched()) {
            if (inRoster) {
                return new Outcome(
                        MonitorZpokonpiStatus.ROSTER_ONLY,
                        false,
                        "Потвърден в официалния състав; регистърът по ЗПКОНПИ не беше достъпен автоматично.",
                        snapshot.registerLink());
            }
            return new Outcome(
                    MonitorZpokonpiStatus.UNAVAILABLE,
                    false,
                    "Автоматичната проверка не успя да зареди източниците: "
                            + String.join("; ", snapshot.fetchErrors()),
                    snapshot.registerLink());
        }

        if (snapshot.registerFetched() && !inRegister) {
            if (inRoster) {
                return new Outcome(
                        MonitorZpokonpiStatus.NOT_FOUND,
                        false,
                        "В списъка на съвета, но не е намерен в публичния регистър по ЗПКОНПИ — проверете ръчно.",
                        snapshot.registerLink());
            }
            return new Outcome(
                    MonitorZpokonpiStatus.WARNING,
                    false,
                    "Не е намерен нито в регистъра по ЗПКОНПИ, нито в официалния източник за състав — возможна неточност в seed данните.",
                    snapshot.registerLink());
        }

        if (inRoster) {
            return new Outcome(
                    MonitorZpokonpiStatus.ROSTER_ONLY,
                    false,
                    "Потвърден в официалния състав; няма конфигуриран или пълен регистър по ЗПКОНПИ за автоматична проверка.",
                    snapshot.registerLink());
        }

        if (snapshot.rosterFetchFailed() && !snapshot.rosterFetched()) {
            return new Outcome(
                    MonitorZpokonpiStatus.UNAVAILABLE,
                    false,
                    "Източникът за състав не беше достъпен: " + String.join("; ", snapshot.fetchErrors()),
                    snapshot.registerLink());
        }

        return new Outcome(
                MonitorZpokonpiStatus.WARNING,
                false,
                "Не е намерен в достъпните публични източници — прегледайте профила ръчно.",
                snapshot.registerLink());
    }

    private static void applyOutcome(MonitorCouncilorEntity entity, Outcome outcome) {
        entity.setZpokonpiStatus(outcome.status().name());
        entity.setZpokonpiChecked(outcome.checked());
        entity.setZpokonpiNote(outcome.note());
        entity.setZpokonpiRegisterUrl(outcome.registerUrl());
        entity.setZpokonpiVerifiedAt(Instant.now());
    }

    private record MunicipalitySnapshot(
            List<MonitorCouncilorEntity> councilors,
            Set<String> registerNames,
            Set<String> rosterNames,
            boolean registerFetched,
            boolean registerFetchFailed,
            boolean rosterFetched,
            boolean rosterFetchFailed,
            String registerLink,
            List<String> fetchErrors) {
    }

    private record Outcome(MonitorZpokonpiStatus status, boolean checked, String note, String registerUrl) {
    }
}

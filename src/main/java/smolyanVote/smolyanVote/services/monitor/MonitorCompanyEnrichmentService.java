package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.config.MonitorIngestionProperties;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;

import java.time.Instant;
import java.util.List;

@Service
public class MonitorCompanyEnrichmentService {

    private static final Logger log = LoggerFactory.getLogger(MonitorCompanyEnrichmentService.class);

    private final MonitorCompanyRepository companyRepository;
    private final MonitorTradeRegisterClient tradeRegisterClient;
    private final MonitorIngestionProperties ingestionProperties;

    public MonitorCompanyEnrichmentService(
            MonitorCompanyRepository companyRepository,
            MonitorTradeRegisterClient tradeRegisterClient,
            MonitorIngestionProperties ingestionProperties) {
        this.companyRepository = companyRepository;
        this.tradeRegisterClient = tradeRegisterClient;
        this.ingestionProperties = ingestionProperties;
    }

    @Transactional
    public int enrichCompany(String eik) {
        MonitorCompanyEntity company = companyRepository.findByEik(eik.trim())
                .orElseThrow(() -> new MonitorNotFoundException("Фирмата не е в регионалния обхват."));
        MonitorTradeRegisterClient.TradeRegisterResponse response = tradeRegisterClient.fetchProfile(eik);
        if (response.blockedByRateLimit()) {
            throw new MonitorRateLimitException(
                    "trade-register",
                    ingestionProperties.getTradeRegisterDelayMs() * 30L,
                    "Търговски регистър — прекалено много заявки, опитайте по-късно");
        }
        return applyProfile(company, response.profile()) ? 1 : 0;
    }

    @Transactional
    public int enrichBatch(int limit) {
        int capped = Math.min(Math.max(limit, 1), ingestionProperties.getTradeRegisterBatchLimit());
        List<MonitorCompanyEntity> companies = companyRepository
                .findNeedingRegistryEnrichment(PageRequest.of(0, capped));
        int updated = 0;
        for (MonitorCompanyEntity company : companies) {
            MonitorJobCancellation.check();
            MonitorTradeRegisterClient.TradeRegisterResponse response =
                    tradeRegisterClient.fetchProfile(company.getEik());
            if (response.blockedByRateLimit()) {
                log.warn("Trade register rate limit — stopping batch after {} firm(s)", updated);
                break;
            }
            if (applyProfile(company, response.profile())) {
                updated++;
            }
        }
        return updated;
    }

    private boolean applyProfile(
            MonitorCompanyEntity company, MonitorTradeRegisterClient.TradeRegisterProfile profile) {
        company.setRegistryFetchedAt(Instant.now());
        if (profile == null) {
            company.setRegistryStatus("not_found");
            companyRepository.save(company);
            return false;
        }
        if (profile.companyName() != null && !profile.companyName().isBlank()) {
            company.setName(profile.companyName().trim());
        }
        company.setLegalForm(profile.legalForm());
        company.setRegisteredAddress(profile.address());
        company.setManagersSummary(profile.managersSummary());
        company.setRegistryStatus(profile.status());
        if (profile.foundedAt() != null) {
            company.setFoundedAt(profile.foundedAt());
        }
        companyRepository.save(company);
        return true;
    }
}

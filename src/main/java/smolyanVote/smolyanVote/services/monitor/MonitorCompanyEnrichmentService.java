package smolyanVote.smolyanVote.services.monitor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;

import java.time.Instant;
import java.util.List;

@Service
public class MonitorCompanyEnrichmentService {

    private final MonitorCompanyRepository companyRepository;
    private final MonitorTradeRegisterClient tradeRegisterClient;

    public MonitorCompanyEnrichmentService(
            MonitorCompanyRepository companyRepository,
            MonitorTradeRegisterClient tradeRegisterClient) {
        this.companyRepository = companyRepository;
        this.tradeRegisterClient = tradeRegisterClient;
    }

    @Transactional
    public int enrichCompany(String eik) {
        MonitorCompanyEntity company = companyRepository.findByEik(eik.trim())
                .orElseThrow(() -> new MonitorNotFoundException("Фирмата не е в регионалния обхват."));
        return applyProfile(company, tradeRegisterClient.fetchProfile(eik)) ? 1 : 0;
    }

    @Transactional
    public int enrichBatch(int limit) {
        int capped = Math.min(Math.max(limit, 1), 100);
        List<MonitorCompanyEntity> companies = companyRepository
                .findNeedingRegistryEnrichment(PageRequest.of(0, capped));
        int updated = 0;
        for (MonitorCompanyEntity company : companies) {
            if (applyProfile(company, tradeRegisterClient.fetchProfile(company.getEik()))) {
                updated++;
            }
        }
        return updated;
    }

    private boolean applyProfile(MonitorCompanyEntity company, MonitorTradeRegisterClient.TradeRegisterProfile profile) {
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

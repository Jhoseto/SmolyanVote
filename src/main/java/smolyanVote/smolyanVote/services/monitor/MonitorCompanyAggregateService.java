package smolyanVote.smolyanVote.services.monitor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.monitor.MonitorCompanyEntity;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class MonitorCompanyAggregateService {

    private final MonitorContractRepository contractRepository;
    private final MonitorCompanyRepository companyRepository;
    private final MonitorRiskService riskService;

    public MonitorCompanyAggregateService(
            MonitorContractRepository contractRepository,
            MonitorCompanyRepository companyRepository,
            MonitorRiskService riskService) {
        this.contractRepository = contractRepository;
        this.companyRepository = companyRepository;
        this.riskService = riskService;
    }

    /** Recomputes totals and the composite risk index for every company in one pass. */
    @Transactional
    public void refreshFromAllContracts() {
        Map<String, List<MonitorContractEntity>> byContractor = new HashMap<>();
        for (MonitorContractEntity c : contractRepository.findAll()) {
            if (c.getContractorEik() == null) {
                continue;
            }
            byContractor.computeIfAbsent(c.getContractorEik().trim(), key -> new ArrayList<>()).add(c);
        }

        List<MonitorCompanyEntity> touched = new ArrayList<>();
        for (MonitorCompanyEntity company : companyRepository.findAll()) {
            if (company.getEik() == null) {
                continue;
            }
            List<MonitorContractEntity> contracts = byContractor.get(company.getEik().trim());
            if (contracts == null) {
                continue;
            }
            BigDecimal total = contracts.stream()
                    .map(MonitorContractEntity::getAmountEur)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            company.setContractCount(contracts.size());
            company.setTotalWonEur(total.setScale(2, RoundingMode.HALF_UP));
            company.setCompositeRiskScore(riskService.computeCompanyCri(contracts));
            touched.add(company);
        }
        companyRepository.saveAll(touched);
    }
}

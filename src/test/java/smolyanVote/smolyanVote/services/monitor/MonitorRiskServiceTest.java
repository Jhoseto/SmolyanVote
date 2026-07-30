package smolyanVote.smolyanVote.services.monitor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorCompanyRepository;
import smolyanVote.smolyanVote.repositories.monitor.MonitorContractRepository;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class MonitorRiskServiceTest {

    private MonitorContractRepository contractRepository;
    private MonitorCompanyRepository companyRepository;
    private MonitorRiskService riskService;

    @BeforeEach
    void setUp() {
        contractRepository = Mockito.mock(MonitorContractRepository.class);
        companyRepository = Mockito.mock(MonitorCompanyRepository.class);
        riskService = new MonitorRiskService(
                contractRepository, companyRepository, new com.fasterxml.jackson.databind.ObjectMapper());
    }

    @Test
    void singleBidAddsRiskScore() {
        MonitorContractEntity contract = baseContract();
        contract.setBidsReceived(1);
        when(contractRepository.findBySectorWithAmount(anyString())).thenReturn(List.of(contract));

        riskService.scoreContract(contract);

        assertTrue(contract.getRiskScore() >= 25);
        assertTrue(contract.getRiskFlagsJson().contains("SINGLE_BID"));
    }

    @Test
    void cleanContractHasZeroScore() {
        MonitorContractEntity contract = baseContract();
        contract.setBidsReceived(5);
        contract.setAmountEur(new BigDecimal("1000"));
        when(contractRepository.findBySectorWithAmount(anyString())).thenReturn(List.of(
                contract,
                contractWithAmount("2000"),
                contractWithAmount("3000")));

        riskService.scoreContract(contract);

        assertEquals(0, contract.getRiskScore());
    }

    private static MonitorContractEntity baseContract() {
        MonitorContractEntity c = new MonitorContractEntity();
        c.setId(1L);
        c.setSectorCode("45");
        c.setContractorEik("123456789");
        c.setAmountEur(new BigDecimal("5000"));
        c.setEuFunded(false);
        return c;
    }

    private static MonitorContractEntity contractWithAmount(String amount) {
        MonitorContractEntity c = new MonitorContractEntity();
        c.setSectorCode("45");
        c.setContractorEik("999");
        c.setAmountEur(new BigDecimal(amount));
        return c;
    }
}

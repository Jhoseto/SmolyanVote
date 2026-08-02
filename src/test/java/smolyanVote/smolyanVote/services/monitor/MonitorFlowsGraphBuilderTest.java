package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorFlowPathDetailDTO;
import smolyanVote.smolyanVote.viewsAndDTO.monitor.MonitorFlowsDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MonitorFlowsGraphBuilderTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void buildProducesSubLinksWhenSubcontractorDeclared() {
        MonitorContractEntity c = contract(
                "111111111", "Община Смолян", "222222222", "Фирма А",
                new BigDecimal("100000"), "333333333", "Подизпълнител Б",
                new BigDecimal("30000"));

        MonitorFlowsDTO flows = MonitorFlowsGraphBuilder.build(List.of(c), mapper);

        assertFalse(flows.subLinks().isEmpty());
        MonitorFlowsDTO.FlowSubLinkDTO subLink = flows.subLinks().get(0);
        assertEquals("co:222222222", subLink.source());
        assertEquals("sub:333333333", subLink.target());
        assertEquals(0, new BigDecimal("30000").compareTo(subLink.valueEur()));

        assertTrue(flows.nodes().stream().anyMatch(n -> "subcontractor".equals(n.type())));
        assertTrue(flows.nodes().stream().allMatch(n -> n.totalEur() != null));
    }

    @Test
    void buildPathDetailReturnsContractsSortedByAmount() {
        MonitorContractEntity small = contract(
                "111111111", "Община Смолян", "222222222", "Фирма А",
                new BigDecimal("10000"), null, null, null);
        MonitorContractEntity large = contract(
                "111111111", "Община Смолян", "222222222", "Фирма А",
                new BigDecimal("50000"), "333333333", "Подизпълнител Б",
                new BigDecimal("15000"));

        MonitorFlowPathDetailDTO path = MonitorFlowsGraphBuilder.buildPathDetail(
                List.of(small, large),
                "auth:111111111",
                "co:222222222",
                mapper);

        assertEquals(2, path.contracts().size());
        assertEquals(0, new BigDecimal("50000").compareTo(path.contracts().get(0).amountEur()));
        assertEquals(0, new BigDecimal("60000").compareTo(path.totals().totalEur()));
        assertEquals(1, path.totals().contractsWithSubcontractor());
        assertNotNull(path.totals().subcontractingTotalEur());
    }

    @Test
    void buildEstimatesSubAmountFromPercent() {
        MonitorContractEntity c = contract(
                "111111111", "Община Смолян", "222222222", "Фирма А",
                new BigDecimal("100000"), "333333333", "Подизпълнител Б",
                null);
        c.setSubcontractingPercent(new BigDecimal("30"));

        MonitorFlowsDTO flows = MonitorFlowsGraphBuilder.build(List.of(c), mapper);

        assertFalse(flows.subLinks().isEmpty());
        assertEquals(0, new BigDecimal("30000.00").compareTo(flows.subLinks().get(0).valueEur()));
    }

    private static MonitorContractEntity contract(
            String authEik,
            String authName,
            String coEik,
            String coName,
            BigDecimal amount,
            String subEik,
            String subName,
            BigDecimal subAmount) {
        MonitorContractEntity c = new MonitorContractEntity();
        c.setId(1L);
        c.setAuthorityEik(authEik);
        c.setAuthorityName(authName);
        c.setContractorEik(coEik);
        c.setContractorName(coName);
        c.setSubject("Тестов договор");
        c.setAmountEur(amount);
        c.setSignedAt(LocalDate.of(2024, 6, 1));
        if (subEik != null) {
            c.setHasSubcontractors(true);
            c.setSubcontractorEik(subEik);
            c.setSubcontractorName(subName);
            c.setSubcontractingAmountEur(subAmount);
        }
        return c;
    }
}

package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import smolyanVote.smolyanVote.models.monitor.MonitorContractEntity;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SigmaSubcontractorParserTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void applyFromJson_setsSubcontractorFields() throws Exception {
        MonitorContractEntity entity = new MonitorContractEntity();
        entity.setAmountEur(new BigDecimal("429490.00"));

        String json = """
                {
                  "publishedAt": "2026-07-14",
                  "subcontractor": {
                    "name": "Ридж Консултантс ЕООД",
                    "eik": "202899740",
                    "valueEur": 64040
                  }
                }
                """;

        assertTrue(SigmaSubcontractorParser.applyFromJson(entity, mapper.readTree(json)));
        assertTrue(entity.isHasSubcontractors());
        assertEquals("Ридж Консултантс ЕООД", entity.getSubcontractorName());
        assertEquals("202899740", entity.getSubcontractorEik());
        assertEquals(new BigDecimal("64040.00"), entity.getSubcontractingAmountEur());
    }
}

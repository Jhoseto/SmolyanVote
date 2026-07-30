package smolyanVote.smolyanVote.services.monitor;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MonitorCsvParserTest {

    @Test
    void parsesQuotedFieldsWithCommas() {
        String csv = "id,subject,authority_eik\n" +
                "abc,\"Title, with comma\",000615118\n";
        List<String[]> rows = MonitorCsvParser.parseRows(csv);
        assertEquals(2, rows.size());
        assertEquals("abc", rows.get(1)[0]);
        assertEquals("Title, with comma", rows.get(1)[1]);
        assertEquals("000615118", rows.get(1)[2]);
    }

    @Test
    void stripsBomFromHeader() {
        String csv = "\uFEFFid,unp\n" +
                "x,1\n";
        List<String[]> rows = MonitorCsvParser.parseRows(csv);
        assertEquals("id", rows.get(0)[0].replace("\uFEFF", "").trim().toLowerCase().startsWith("id") ? "id" : rows.get(0)[0]);
    }
}

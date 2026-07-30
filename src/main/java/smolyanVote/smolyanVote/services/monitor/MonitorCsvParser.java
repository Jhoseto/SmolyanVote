package smolyanVote.smolyanVote.services.monitor;

import java.util.ArrayList;
import java.util.List;

/**
 * RFC 4180-ish CSV parser for SIGMA exports (handles quoted fields and commas).
 */
final class MonitorCsvParser {

    private MonitorCsvParser() {
    }

    static List<String[]> parseRows(String csv) {
        List<String[]> rows = new ArrayList<>();
        if (csv == null || csv.isBlank()) {
            return rows;
        }
        String normalized = csv.replace("\uFEFF", "");
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < normalized.length() && normalized.charAt(i + 1) == '"') {
                        current.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(c);
                }
            } else if (c == '"') {
                inQuotes = true;
            } else if (c == ',') {
                fields.add(current.toString());
                current.setLength(0);
            } else if (c == '\n') {
                fields.add(current.toString());
                current.setLength(0);
                if (!fields.isEmpty() || rows.isEmpty()) {
                    rows.add(fields.toArray(new String[0]));
                }
                fields = new ArrayList<>();
            } else if (c != '\r') {
                current.append(c);
            }
        }
        if (!current.isEmpty() || !fields.isEmpty()) {
            fields.add(current.toString());
            rows.add(fields.toArray(new String[0]));
        }
        return rows;
    }
}

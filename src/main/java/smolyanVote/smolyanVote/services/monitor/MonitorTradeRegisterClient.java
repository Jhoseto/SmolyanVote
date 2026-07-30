package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class MonitorTradeRegisterClient {

    private static final Logger log = LoggerFactory.getLogger(MonitorTradeRegisterClient.class);
    private static final String BASE_URL = "https://portal.registryagency.bg/CR/api/Deeds/";
    private static final Pattern HTML_TAGS = Pattern.compile("<[^>]+>");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MonitorTradeRegisterClient(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    public TradeRegisterProfile fetchProfile(String eik) {
        if (eik == null || !eik.matches("\\d{9,13}")) {
            return null;
        }
        try {
            String body = restTemplate.getForObject(BASE_URL + eik.trim(), String.class);
            if (body == null || body.isBlank()) {
                return null;
            }
            JsonNode root = objectMapper.readTree(body);
            return parseProfile(root);
        } catch (Exception ex) {
            log.warn("Trade register lookup failed for EIK {}: {}", eik, ex.getMessage());
            return null;
        }
    }

    private TradeRegisterProfile parseProfile(JsonNode root) {
        String name = text(root, "companyName");
        if (name == null) {
            name = text(root, "fullName");
        }
        String legalForm = mapLegalForm(root.path("legalForm").asInt(-1));
        String status = mapDeedStatus(root.path("deedStatus").asInt(-1));

        String address = null;
        List<String> managers = new ArrayList<>();
        LocalDate earliestEntry = null;

        for (JsonNode section : root.path("sections")) {
            for (JsonNode subDeed : section.path("subDeeds")) {
                for (JsonNode group : subDeed.path("groups")) {
                    for (JsonNode field : group.path("fields")) {
                        String code = field.path("nameCode").asText("");
                        String plain = stripHtml(field.path("htmlData").asText(""));
                        LocalDate entryDate = parseEntryDate(field.path("fieldEntryDate").asText(null));
                        if (entryDate != null && (earliestEntry == null || entryDate.isBefore(earliestEntry))) {
                            earliestEntry = entryDate;
                        }
                        if (plain.isBlank()) {
                            continue;
                        }
                        if (address == null && (code.contains("SEAT") || code.equals("CR_F_5_L") || plain.toLowerCase().contains("седалище"))) {
                            address = truncate(plain, 480);
                        }
                        if (code.contains("MANAGER") || code.contains("REPRESENT") || code.contains("CR_F_7")
                                || plain.toLowerCase().contains("управител")) {
                            managers.add(truncate(plain, 120));
                        }
                    }
                }
            }
        }

        return new TradeRegisterProfile(
                name,
                legalForm,
                status,
                address,
                managers.isEmpty() ? null : String.join("; ", managers.stream().distinct().limit(3).toList()),
                earliestEntry);
    }

    private static LocalDate parseEntryDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME).toLocalDate();
        } catch (Exception ex) {
            try {
                return LocalDate.parse(value.substring(0, 10));
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private static String mapLegalForm(int code) {
        return switch (code) {
            case 1 -> "ЕТ";
            case 2 -> "ООД";
            case 3 -> "ЕООД";
            case 4 -> "АД";
            case 5 -> "АД";
            case 6 -> "КД";
            case 7 -> "СД";
            case 8 -> "ДЗЗД";
            default -> code > 0 ? "форма " + code : null;
        };
    }

    private static String mapDeedStatus(int code) {
        return switch (code) {
            case 1 -> "активна";
            case 2 -> "активна";
            case 3 -> "закрита";
            case 4 -> "в ликвидация";
            default -> code > 0 ? "статус " + code : null;
        };
    }

    private static String stripHtml(String html) {
        if (html == null) {
            return "";
        }
        return HTML_TAGS.matcher(html).replaceAll(" ").replaceAll("\\s+", " ").trim();
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        String t = v.asText("").trim();
        return t.isEmpty() ? null : t;
    }

    private static String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max - 3) + "...";
    }

    public record TradeRegisterProfile(
            String companyName,
            String legalForm,
            String status,
            String address,
            String managersSummary,
            LocalDate foundedAt
    ) {
    }
}

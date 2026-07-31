package smolyanVote.smolyanVote.services.monitor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.config.GeminiProperties;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Gemini batch client for Граждански монитор — admin pipeline only. */
@Service
public class MonitorGeminiClient {

    private static final Logger log = LoggerFactory.getLogger(MonitorGeminiClient.class);
    private static final Pattern SUMMARY_FIELD =
            Pattern.compile("\"shortSummary\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
    private static final Pattern WHY_FIELD =
            Pattern.compile("\"whyItMatters\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");

    private final GeminiProperties geminiProperties;
    private final OkHttpClient client;
    private final ObjectMapper objectMapper;

    public MonitorGeminiClient(GeminiProperties geminiProperties, ObjectMapper objectMapper) {
        this.geminiProperties = geminiProperties;
        this.objectMapper = objectMapper;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(180, TimeUnit.SECONDS)
                .build();
    }

    public boolean isConfigured() {
        return geminiProperties.isConfigured();
    }

    public String modelName() {
        return geminiProperties.resolvedModel();
    }

    public MonitorAiResult summarizeDocument(String title, String rawContent) throws IOException {
        if (!isConfigured()) {
            return null;
        }
        String trimmed = rawContent != null ? rawContent : "";
        if (trimmed.length() > 12_000) {
            trimmed = trimmed.substring(0, 12_000);
        }

        String prompt = """
                Анализирай този документ на община Смолян, България.
                Отговори САМО с валиден JSON (без markdown):
                {"shortSummary":"max 280 символа — заглавие за гражданин: какво се случва и защо е важно","category":"едно от: Поръчки, Общински съвет, Обсъждания, Инфраструктура, Социални, Околна среда, Друго","impactScore":1-10,"whyItMatters":"1-2 изречения: къде отиват парите и защо да обърне внимание"}

                Заглавие: %s

                Съдържание:
                %s
                """.formatted(title != null ? title : "", trimmed);

        String responseText = generate(prompt, 1024);
        return parseAiResult(responseText);
    }

    /**
     * Regional accountability report — synthesizes hundreds of contracts into citizen conclusions.
     */
    public MonitorRegionalReportResult generateRegionalReport(String structuredFactsJson) throws IOException {
        if (!isConfigured()) {
            return null;
        }
        String prompt = """
                Ти си независим журналист и анализатор на общински разходи в област Смолян, България.
                Пишеш за обикновени граждани — НЕ за счетоводители или администратори.

                Получаваш СТРУКТУРИРАНИ ФАКТИ от база данни (SIGMA/EOP + решения на ОбС + обсъждания от smolyan.bg).
                НЕ изброявай числа като таблица. НЕ цитирай данни 1:1. Вместо това:
                - обясни КАКВО ОЗНАЧАВА за данъкоплатеца
                - свържи поръчките с решенията на съвета, където е логично
                - кажи какво е подозрително, липсващо или нередно — с аргументи
                - предложи какво да следят гражданите

                Тон: критичен, ясен, прост български. Без обвинения в престъпление — „индикатор“, „риск“, „липса на прозрачност“.
                Отговори САМО с валиден JSON:
                {
                  "executiveSummary":"2-4 абзаца — история, не статистика",
                  "moneyLeaks":[{"title":"...","body":"анализ защо парите изтичат тук","severity":"high|medium|low"}],
                  "irregularities":[{"title":"...","body":"какво е нередно и защо","severity":"high|medium|low"}],
                  "conclusions":["умни заключения, които човек не може да направи без дни четене"],
                  "watchNext":["конкретни неща за следене"]
                }

                ФАКТИ:
                %s
                """.formatted(structuredFactsJson);

        String responseText = generate(prompt, 8192);
        return parseRegionalReport(responseText);
    }

    public MonitorContractDeepAnalysis analyzeContractDeep(String structuredFactsJson) throws IOException {
        if (!isConfigured()) {
            return null;
        }
        String prompt = """
                Ти си независим анализатор на общинска поръчка в област Смолян, България.
                Получаваш СТРУКТУРИРАНИ ФАКТИ — не измисляй числа.
                Напиши ПЪЛЕН анализ за данъкоплатец: какво се случва, защо е проблем, колко пари са засегнати,
                какви индикатори за прозрачност/конкуренция се активират, какво да следят гражданите.
                Не обвинявай в корупция — „индикатор“, „риск“.
                Отговори САМО с валиден JSON:
                {
                  "headline":"кратко заглавие max 120 символа",
                  "analysis":"3-5 абзаца с конкретни факти и числа от данните",
                  "moneyAtStake":"1 изречение — колко и за какво",
                  "whatIsWrong":"2-3 изречения — какво е нередно/рисково",
                  "citizenTakeaway":"1-2 изречения — какво означава за данъкоплатеца",
                  "category":"Поръчки",
                  "impactScore":1-10
                }

                ФАКТИ:
                %s
                """.formatted(structuredFactsJson);

        String responseText = generate(prompt, 4096);
        return parseContractDeepAnalysis(responseText);
    }

    /** Deep citizen analysis for council decisions, consultations, etc. */
    public MonitorDocumentDeepAnalysis analyzeDocumentDeep(String structuredFactsJson) throws IOException {
        if (!isConfigured()) {
            return null;
        }
        String prompt = """
                Ти си граждански анализатор на документ от община Смолян (решение, протокол, обсъждане).
                Пиши за обикновен данъкоплатец — НЕ копирай текста, НЕ изброявай факти 1:1.

                Задача: обясни какво се случва, защо е важно, какво е проблемно или липсва,
                какво означава за парите и правата на гражданите.

                Отговори САМО с валиден JSON:
                {
                  "headline":"кратко заглавие max 120 символа — смисъл, не официален жаргон",
                  "analysis":"3-5 абзаца критичен анализ на прост български",
                  "whyItMatters":"2 изречения — защо да обърне внимание",
                  "criticalAngle":"1-2 изречения — какво е най-подозрително или липсва",
                  "category":"Поръчки|Общински съвет|Обсъждания|Инфраструктура|Социални|Друго",
                  "impactScore":1-10
                }

                ДОКУМЕНТ:
                %s
                """.formatted(structuredFactsJson);

        String responseText = generate(prompt, 4096);
        return parseDocumentDeepAnalysis(responseText);
    }

    private MonitorDocumentDeepAnalysis parseDocumentDeepAnalysis(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(stripMarkdownJson(text));
            String analysis = node.path("analysis").asText(null);
            if (analysis == null || analysis.isBlank()) {
                return null;
            }
            return new MonitorDocumentDeepAnalysis(
                    node.path("headline").asText(null),
                    analysis,
                    node.path("whyItMatters").asText(null),
                    node.path("criticalAngle").asText(null),
                    node.path("category").asText("Друго"),
                    Math.max(1, Math.min(10, node.path("impactScore").asInt(6))));
        } catch (Exception e) {
            log.warn("Failed to parse document deep analysis JSON: {}", e.getMessage());
            return null;
        }
    }

    private MonitorContractDeepAnalysis parseContractDeepAnalysis(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(stripMarkdownJson(text));
            String headline = node.path("headline").asText(null);
            String analysis = node.path("analysis").asText(null);
            if (analysis == null || analysis.isBlank()) {
                return null;
            }
            return new MonitorContractDeepAnalysis(
                    headline,
                    analysis,
                    node.path("moneyAtStake").asText(null),
                    node.path("whatIsWrong").asText(null),
                    node.path("citizenTakeaway").asText(null),
                    node.path("category").asText("Поръчки"),
                    Math.max(1, Math.min(10, node.path("impactScore").asInt(7))));
        } catch (Exception e) {
            log.warn("Failed to parse deep contract analysis JSON: {}", e.getMessage());
            return null;
        }
    }

    private MonitorRegionalReportResult parseRegionalReport(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(stripMarkdownJson(text));
            String summary = node.path("executiveSummary").asText(null);
            if (summary == null || summary.isBlank()) {
                return null;
            }
            return new MonitorRegionalReportResult(
                    summary,
                    parseFindings(node.path("moneyLeaks")),
                    parseFindings(node.path("irregularities")),
                    parseStringList(node.path("conclusions")),
                    parseStringList(node.path("watchNext")));
        } catch (Exception e) {
            log.warn("Failed to parse regional report JSON: {}", e.getMessage());
            return null;
        }
    }

    private List<MonitorRegionalReportResult.Finding> parseFindings(JsonNode array) {
        if (!array.isArray()) {
            return List.of();
        }
        List<MonitorRegionalReportResult.Finding> out = new ArrayList<>();
        for (JsonNode item : array) {
            String title = item.path("title").asText(null);
            String body = item.path("body").asText(null);
            if (title != null && body != null) {
                out.add(new MonitorRegionalReportResult.Finding(
                        title, body, item.path("severity").asText("medium")));
            }
        }
        return out;
    }

    private List<String> parseStringList(JsonNode array) {
        if (!array.isArray()) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        for (JsonNode item : array) {
            if (!item.asText("").isBlank()) {
                out.add(item.asText());
            }
        }
        return out;
    }

    private static String stripMarkdownJson(String text) {
        String json = text.trim();
        if (json.startsWith("```")) {
            json = json.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "");
        }
        return json;
    }

    public MonitorContractAiResult summarizeContract(
            String subject,
            String authorityName,
            String contractorName,
            BigDecimal amountEur,
            Integer bidsReceived,
            Integer riskScore,
            List<String> riskFlagLabels) throws IOException {
        if (!isConfigured()) {
            return null;
        }
        String flags = riskFlagLabels == null || riskFlagLabels.isEmpty()
                ? "няма"
                : String.join(", ", riskFlagLabels);

        String prompt = """
                Анализирай общинска поръчка/договор в област Смолян, България — за граждански монитор на прозрачност.
                Не обвинявай в корупция; използвай „индикатор“, „риск“, „липса на конкуренция“.
                Отговори САМО с валиден JSON:
                {"shortSummary":"заглавие max 280 символа на прост български","category":"Поръчки или друго","impactScore":1-10,"whyItMatters":"1-2 изречения защо данъкоплатците трябва да обърнат внимание","concernType":"LOW_COMPETITION|OVERPRICE|FRAGMENTATION|GOVERNANCE|ROUTINE|OTHER"}

                Възложител: %s
                Изпълнител: %s
                Стойност EUR: %s
                Оферти: %s
                Риск score: %s
                Индикатори: %s
                Оригинален предмет: %s
                """.formatted(
                authorityName != null ? authorityName : "",
                contractorName != null ? contractorName : "",
                amountEur != null ? amountEur.toPlainString() : "",
                bidsReceived != null ? bidsReceived : "",
                riskScore != null ? riskScore : 0,
                flags,
                subject != null ? truncatePlain(subject) : "");

        String responseText = generate(prompt);
        return parseContractAiResult(responseText);
    }

    private MonitorContractAiResult parseContractAiResult(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            String json = text.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "");
            }
            JsonNode node = objectMapper.readTree(json);
            String summary = node.path("shortSummary").asText(null);
            String category = node.path("category").asText(null);
            int impact = Math.max(1, Math.min(10, node.path("impactScore").asInt(5)));
            String why = node.path("whyItMatters").asText(null);
            String concern = node.path("concernType").asText(null);
            return new MonitorContractAiResult(summary, category, impact, why, concern);
        } catch (Exception e) {
            log.warn("Failed to parse contract Gemini JSON: {}", e.getMessage());
            return parseContractAiResultFallback(text);
        }
    }

    private MonitorContractAiResult parseContractAiResultFallback(String text) {
        String summary = extractJsonString(text, SUMMARY_FIELD);
        String why = extractJsonString(text, WHY_FIELD);
        if (summary == null || summary.isBlank()) {
            return null;
        }
        return new MonitorContractAiResult(summary, "Поръчки", 7, why, "OTHER");
    }

    private static String extractJsonString(String text, Pattern pattern) {
        if (text == null) {
            return null;
        }
        Matcher m = pattern.matcher(text);
        if (!m.find()) {
            return null;
        }
        return m.group(1).replace("\\\"", "\"").replace("\\n", " ").trim();
    }

    private String generate(String prompt) throws IOException {
        return generate(prompt, 1024);
    }

    private String generate(String prompt, int maxOutputTokens) throws IOException {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        contents.addObject().putArray("parts").addObject().put("text", prompt);

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("temperature", 0.2);
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        generationConfig.put("responseMimeType", "application/json");

        RequestBody body = RequestBody.create(
                objectMapper.writeValueAsString(root),
                MediaType.get("application/json; charset=utf-8"));

        Request request = new Request.Builder()
                .url(geminiProperties.generateContentEndpoint())
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String model = geminiProperties.resolvedModel();
            if (!response.isSuccessful()) {
                String err = response.body() != null ? response.body().string() : "";
                throw new IOException("Gemini API " + response.code() + " (" + model + "): " + err);
            }
            String responseBody = response.body().string();
            JsonNode candidates = objectMapper.readTree(responseBody).path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText("").trim();
                }
            }
            return "";
        }
    }

    private MonitorAiResult parseAiResult(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            String json = text.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "");
            }
            JsonNode node = objectMapper.readTree(json);
            String summary = node.path("shortSummary").asText(null);
            String category = node.path("category").asText(null);
            int impact = node.path("impactScore").asInt(5);
            impact = Math.max(1, Math.min(10, impact));
            return new MonitorAiResult(summary, category, impact);
        } catch (Exception e) {
            log.warn("Failed to parse Gemini JSON: {}", e.getMessage());
            return new MonitorAiResult(truncatePlain(text), "Друго", 5);
        }
    }

    private static String truncatePlain(String text) {
        String t = text.replaceAll("\\s+", " ").trim();
        return t.length() <= 280 ? t : t.substring(0, 277) + "...";
    }

    public record MonitorAiResult(String shortSummary, String category, int impactScore) {
    }

    public record MonitorContractAiResult(
            String shortSummary,
            String category,
            int impactScore,
            String whyItMatters,
            String concernType) {
    }

    public record MonitorDocumentDeepAnalysis(
            String headline,
            String analysis,
            String whyItMatters,
            String criticalAngle,
            String category,
            int impactScore) {
    }

    public record MonitorContractDeepAnalysis(
            String headline,
            String analysis,
            String moneyAtStake,
            String whatIsWrong,
            String citizenTakeaway,
            String category,
            int impactScore) {
    }

    public record MonitorRegionalReportResult(
            String executiveSummary,
            List<Finding> moneyLeaks,
            List<Finding> irregularities,
            List<String> conclusions,
            List<String> watchNext) {

        public record Finding(String title, String body, String severity) {
        }
    }
}

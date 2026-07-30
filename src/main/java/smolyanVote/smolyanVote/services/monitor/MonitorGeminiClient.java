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
import java.util.concurrent.TimeUnit;

/** Gemini batch client for Граждански монитор — admin pipeline only. */
@Service
public class MonitorGeminiClient {

    private static final Logger log = LoggerFactory.getLogger(MonitorGeminiClient.class);

    private final GeminiProperties geminiProperties;
    private final OkHttpClient client;
    private final ObjectMapper objectMapper;

    public MonitorGeminiClient(GeminiProperties geminiProperties, ObjectMapper objectMapper) {
        this.geminiProperties = geminiProperties;
        this.objectMapper = objectMapper;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(90, TimeUnit.SECONDS)
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
                {"shortSummary":"max 280 символа на прост български","category":"едно от: Поръчки, Общински съвет, Обсъждания, Инфраструктура, Социални, Околна среда, Друго","impactScore":1-10}

                Заглавие: %s

                Съдържание:
                %s
                """.formatted(title != null ? title : "", trimmed);

        String responseText = generate(prompt);
        return parseAiResult(responseText);
    }

    private String generate(String prompt) throws IOException {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        contents.addObject().putArray("parts").addObject().put("text", prompt);

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("temperature", 0.2);
        generationConfig.put("maxOutputTokens", 512);
        generationConfig.put("responseMimeType", "application/json");

        String model = geminiProperties.resolvedModel();
        if (model.contains("2.5-flash") && !model.contains("lite")) {
            root.putObject("thinkingConfig")
                    .put("thinkingBudget", geminiProperties.getMonitor().getThinkingBudget());
        }

        RequestBody body = RequestBody.create(
                objectMapper.writeValueAsString(root),
                MediaType.get("application/json; charset=utf-8"));

        Request request = new Request.Builder()
                .url(geminiProperties.generateContentEndpoint())
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
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
}

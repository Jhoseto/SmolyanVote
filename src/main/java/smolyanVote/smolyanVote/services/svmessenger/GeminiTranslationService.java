package smolyanVote.smolyanVote.services.svmessenger;

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

@Service
public class GeminiTranslationService {

    private static final Logger log = LoggerFactory.getLogger(GeminiTranslationService.class);

    private final GeminiProperties geminiProperties;
    private final OkHttpClient client;
    private final ObjectMapper objectMapper;

    public GeminiTranslationService(GeminiProperties geminiProperties, ObjectMapper objectMapper) {
        this.geminiProperties = geminiProperties;
        this.objectMapper = objectMapper;
        if (!geminiProperties.isConfigured()) {
            log.warn("GeminiTranslationService: GEMINI_API_KEY is not configured");
        } else {
            log.info("GeminiTranslationService: using model {}", geminiProperties.resolvedModel());
        }
        this.client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    public String translateText(String text, String targetLanguage) throws IOException {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }
        if (!geminiProperties.isConfigured()) {
            throw new IOException("Gemini API key is not configured");
        }

        String prompt = String.format(
                "Translate the following text to %s. Maintain tone and context. Do only the translation, no explanation. Text: %s",
                targetLanguage, text);

        ObjectNode rootNode = objectMapper.createObjectNode();
        ArrayNode contents = rootNode.putArray("contents");
        contents.addObject().putArray("parts").addObject().put("text", prompt);

        String jsonPayload = objectMapper.writeValueAsString(rootNode);

        RequestBody body = RequestBody.create(jsonPayload, MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder()
                .url(geminiProperties.generateContentEndpoint())
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No response body";
                log.error("Gemini API error {}: {}", response.code(), errorBody);
                throw new IOException("Gemini API Error [" + response.code() + "]: " + errorBody);
            }

            String responseBody = response.body().string();
            JsonNode responseJson = objectMapper.readTree(responseBody);

            JsonNode candidates = responseJson.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText().trim();
                }
            }

            return text;
        }
    }
}

package smolyanVote.smolyanVote.services.svmessenger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Service
public class GeminiTranslationService {

    private final String geminiApiKey;
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
    private final OkHttpClient client;
    private final ObjectMapper objectMapper;

    public GeminiTranslationService(@Value("${gemini.api.key:}") String propertyKey) {
        String keyToUse = propertyKey;
        if (keyToUse == null || keyToUse.isEmpty() || keyToUse.startsWith("${")) {
            String envKey = System.getenv("GEMINI_API_KEY");
            if (envKey != null && !envKey.isEmpty()) {
                keyToUse = envKey;
                System.out.println("✅ GeminiTranslationService: Loaded key from System.getenv");
            }
        }
        this.geminiApiKey = keyToUse;

        if (this.geminiApiKey == null || this.geminiApiKey.isEmpty()) {
            System.err.println("❌ GeminiTranslationService: API KEY IS MISSING!");
        } else {
            String masked = this.geminiApiKey.length() > 8
                    ? this.geminiApiKey.substring(0, 4) + "..."
                            + this.geminiApiKey.substring(this.geminiApiKey.length() - 4)
                    : "****";
            System.out.println("✅ GeminiTranslationService: Key loaded: " + masked);
        }

        this.client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public String translateText(String text, String targetLanguage) throws IOException {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        String prompt = String.format(
                "Translate the following text to %s. Maintain tone and context. Do only the translation, no explanation. Text: %s",
                targetLanguage, text);

        // Safely construct JSON using ObjectMapper to handle newlines/quotes
        ObjectNode rootNode = objectMapper.createObjectNode();
        ArrayNode contents = rootNode.putArray("contents");
        ObjectNode part = contents.addObject().putArray("parts").addObject();
        part.put("text", prompt);

        String jsonPayload = objectMapper.writeValueAsString(rootNode);

        RequestBody body = RequestBody.create(jsonPayload, MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder()
                .url(GEMINI_API_URL + geminiApiKey)
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No response body";
                System.err.println("❌ Gemini API Error Status: " + response.code());
                System.err.println("❌ Gemini API Error Body: " + errorBody);
                throw new IOException("Gemini API Error [" + response.code() + "]: " + errorBody);
            }

            String responseBody = response.body().string();
            JsonNode responseJson = objectMapper.readTree(responseBody);

            // Navigate the JSON response structure of Gemini API
            // candidates[0].content.parts[0].text
            JsonNode candidates = responseJson.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode firstCandidate = candidates.get(0);
                JsonNode content = firstCandidate.path("content");
                JsonNode parts = content.path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    return parts.get(0).path("text").asText().trim();
                }
            }

            return text; // Fallback to original text if parsing fails
        }
    }
}

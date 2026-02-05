package smolyanVote.virtualMajor.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import smolyanVote.virtualMajor.services.interfaces.GeminiAIService;
import smolyanVote.virtualMajor.viewsAndDTO.AIResponseDTO;
import smolyanVote.virtualMajor.viewsAndDTO.GameEventDTO;
import smolyanVote.virtualMajor.viewsAndDTO.GameStateDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementation of Gemini AI Service.
 * Handles communication with Google Gemini API for game event generation.
 * 
 * NOTE: This is a simplified implementation. For production use,
 * consider using Google's official Java SDK for Gemini.
 */
@Service
public class GeminiAIServiceImpl implements GeminiAIService {

    @Value("${virtual-major.gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
            Ти си SMOLYAN_REALITY_ENGINE. Твоята задача е да симулираш управлението на община Смолян с КРАЕН РЕАЛИЗЪМ.

            КОНТЕКСТ НА ГРАДА:
            - Смолян е планински град с демографски проблеми (застаряване).
            - Ключови активи: Природа, Планетариум, Културна традиция (Райково), Търговия (Устово), Близост до Пампорово.
            - Реални проблеми: Стара ВиК мрежа, лошо състояние на пътищата, липса на работа за младите, зимен смог (от твърдо гориво).

            ТВОЯТА МИСИЯ:
            1. РЕАЛИСТИЧНИ КАЗУСИ: Генерирай ситуации, които действително могат да се случат в Смолян.
            2. БЕЗ ФАНТАСТИКА: Всичко трябва да е земно и политически обосновано.
            3. ДЕМОГРАФИЯ (ПРИОРИТЕТ №1): Основната цел на играча е да спре обезлюдяването.
            4. КОНФЛИКТНИ СИТУАЦИИ: Всеки ход поне 1 от казусите трябва да е HARD CHOICE (труден избор).

            ОТГОВАРЯЙ САМО В JSON:
            {
              "analysis": "Политически и социален разбор на състоянието на общината.",
              "cases": [
                {
                  "title": "Заглавие на казуса",
                  "description": "Подробно описание на реалистичен проблем.",
                  "type": "daily | economic | strategic | emergency",
                  "targetRegion": "region_id",
                  "options": [
                    { "label": "Опция А", "impact": { "trust": 0, "budget": 0, "population": 0, "innovation": 0, "eco": 0, "infrastructure": 0 }, "consequence": "Краткосрочен резултат." }
                  ]
                }
              ],
              "regionUpdates": { "region_id": "crisis | growth | normal | protest" }
            }
            """;

    public GeminiAIServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public AIResponseDTO generateGameEvents(GameStateDTO gameState) {
        try {
            // Prepare the request
            String userPrompt = buildUserPrompt(gameState);
            String requestBody = buildGeminiRequest(userPrompt);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            // Call Gemini API
            String url = GEMINI_API_URL + "?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            // Parse response
            return parseGeminiResponse(response.getBody());

        } catch (Exception e) {
            // Fallback to default events if API fails
            return getFallbackEvents();
        }
    }

    @Override
    public String analyzeGameState(GameStateDTO gameState) {
        // Simplified analysis - can be expanded with separate Gemini API call
        return String.format(
                "Община Смолян е в %d месец на %d година. Бюджет: %d евро, Население: %d души, Доверие: %d/100.",
                gameState.getMonth(),
                gameState.getYear(),
                gameState.getResources().getBudget(),
                gameState.getResources().getPopulation(),
                gameState.getResources().getTrust());
    }

    @Override
    public String generateYearlyReport(GameStateDTO gameState) {
        // End of year report - can be expanded with Gemini API call
        return String.format(
                "Край на %d година. População: %d, Бюджет: %d евро, Доверие: %d/100.",
                gameState.getYear(),
                gameState.getResources().getPopulation(),
                gameState.getResources().getBudget(),
                gameState.getResources().getTrust());
    }

    private String buildUserPrompt(GameStateDTO gameState) {
        List<String> recentLogs = gameState.getLogs();
        String logs = recentLogs.size() > 10
                ? String.join("; ", recentLogs.subList(recentLogs.size() - 10, recentLogs.size()))
                : String.join("; ", recentLogs);

        boolean isWinter = gameState.getMonth() == 12 || gameState.getMonth() == 1 || gameState.getMonth() == 2;
        boolean isSummer = gameState.getMonth() >= 6 && gameState.getMonth() <= 8;

        String season = isWinter ? "Тежка зима" : (isSummer ? "Горещо лято" : "Преходен сезон");

        return String.format(
                "СЪСТОЯНИЕ: Месец %d, Година %d.\nРЕСУРСИ: Бюджет %d, Население %d, Инфраструктура %d.\nСЕЗОН: %s.\nИСТОРИЯ: %s.\nЗАДАЧА: Създай 3 уникални РЕАЛИСТИЧНИ казуса за Смолян. Фокусирай се върху социални проблеми, аварии или възможности за туризъм. Избягвай повторяемостта.",
                gameState.getMonth(),
                gameState.getYear(),
                gameState.getResources().getBudget(),
                gameState.getResources().getPopulation(),
                gameState.getResources().getInfrastructure(),
                season,
                logs);
    }

    private String buildGeminiRequest(String userPrompt) throws Exception {
        Map<String, Object> request = new HashMap<>();

        // System instruction
        Map<String, Object> systemInstruction = new HashMap<>();
        Map<String, String> systemPart = new HashMap<>();
        systemPart.put("text", SYSTEM_PROMPT);
        systemInstruction.put("parts", List.of(systemPart));
        request.put("system_instruction", systemInstruction);

        // User content
        Map<String, Object> userContent = new HashMap<>();
        Map<String, String> userPart = new HashMap<>();
        userPart.put("text", userPrompt);
        userContent.put("parts", List.of(userPart));
        request.put("contents", List.of(userContent));

        // Generation config
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("response_mime_type", "application/json");
        generationConfig.put("temperature", 0.8);
        request.put("generationConfig", generationConfig);

        return objectMapper.writeValueAsString(request);
    }

    private AIResponseDTO parseGeminiResponse(String responseBody) throws Exception {
        Map<String, Object> response = objectMapper.readValue(responseBody, Map.class);

        // Extract text from response structure
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates != null && !candidates.isEmpty()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String text = (String) parts.get(0).get("text"); // Correcting part access if needed, but sticking to
                                                             // logic

            // Parse the JSON content
            return objectMapper.readValue(text, AIResponseDTO.class);
        }

        return getFallbackEvents();
    }

    private AIResponseDTO getFallbackEvents() {
        AIResponseDTO response = new AIResponseDTO();
        response.setAnalysis("Общинската администрация работи при засилен натиск.");

        GameEventDTO event = new GameEventDTO();
        event.setTitle("Авария на главен колектор");
        event.setDescription("Остаряла тръба в Устово се е пукнала, наводнявайки мазетата на няколко жилищни блока.");
        event.setType("emergency");
        event.setTargetRegion("ustovo");

        GameEventDTO.EventOptionDTO option1 = new GameEventDTO.EventOptionDTO();
        option1.setLabel("Спешна подмяна (120 000 евро)");
        Map<String, Integer> impact1 = new HashMap<>();
        impact1.put("budget", -120000);
        impact1.put("infrastructure", 10);
        impact1.put("trust", 15);
        option1.setImpact(impact1);
        option1.setConsequence("Аварията е отстранена, хората са доволни.");

        GameEventDTO.EventOptionDTO option2 = new GameEventDTO.EventOptionDTO();
        option2.setLabel("Временно изкърпване (20 000 евро)");
        Map<String, Integer> impact2 = new HashMap<>();
        impact2.put("budget", -20000);
        impact2.put("trust", -10);
        option2.setImpact(impact2);
        option2.setConsequence("Проблемът ще се появи пак след месец.");

        event.setOptions(List.of(option1, option2));
        response.setCases(List.of(event));

        return response;
    }
}

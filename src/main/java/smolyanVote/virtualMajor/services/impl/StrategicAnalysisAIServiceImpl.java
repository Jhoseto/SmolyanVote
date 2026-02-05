package smolyanVote.virtualMajor.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.virtualMajor.models.GameResourceSnapshotEntity;
import smolyanVote.virtualMajor.models.GameSessionEntity;
import smolyanVote.virtualMajor.repositories.GameResourceSnapshotRepository;
import smolyanVote.virtualMajor.repositories.GameSessionRepository;
import smolyanVote.virtualMajor.services.interfaces.StrategicAnalysisAIService;
import smolyanVote.virtualMajor.viewsAndDTO.StrategicAnalysisDTO;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StrategicAnalysisAIServiceImpl implements StrategicAnalysisAIService {

        @Value("${virtual-major.gemini.api.key:${gemini.api.key:}}")
        private String apiKey;

        private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

        private final RestTemplate restTemplate;
        private final ObjectMapper objectMapper;
        private final GameSessionRepository gameSessionRepository;
        private final GameResourceSnapshotRepository snapshotRepository;
        private final UserRepository userRepository;

        private static final String SYSTEM_PROMPT = """
                        Ти си СТРАТЕГИЧЕСКИ СЪВЕТНИК на кмета на Смолян.
                        Твоята задача е да направиш ДЪЛБОК АНАЛИЗ на управлението до момента, базирайки се на пълната история на играта.

                        ═══════════════════════════════════════════════════════════════
                        📊 ТВОЯТА РОЛЯ:
                        1. АНАЛИЗАТОР: Разгледай как ресурсите (бюджет, доверие, население) са се променяли.
                        2. СТРАТЕГ: Открий причинно-следствени връзки между решенията и текущото състояние.
                        3. ПРОРОК: Предупреди за бъдещи кризи на базата на тенденциите.

                        ГОВОРИ ПРОФЕСИОНАЛНО, НО С РОДОПСКИ ДУХ. Бъди директен, ако кметът прави грешки.

                        ═══════════════════════════════════════════════════════════════
                        📋 JSON ФОРМАТ ЗА ОТГОВОР (СТРИКТНО!):

                        {
                          "narrative": "Подробен доклад от 4-6 изречения. Анализирай как миналите избори са довели до тук. Бъди конкретен за Смолян.",
                          "achievements": ["Постижение 1", "Постижение 2"],
                          "warnings": ["Предупреждение за риск 1", "Предупреждение за риск 2"]
                        }
                        ═══════════════════════════════════════════════════════════════
                        """;

        public StrategicAnalysisAIServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper,
                        GameSessionRepository gameSessionRepository,
                        GameResourceSnapshotRepository snapshotRepository,
                        UserRepository userRepository) {
                this.restTemplate = restTemplate;
                this.objectMapper = objectMapper;
                this.gameSessionRepository = gameSessionRepository;
                this.snapshotRepository = snapshotRepository;
                this.userRepository = userRepository;
        }

        @Override
        public StrategicAnalysisDTO generateAnalysis(String userEmail) {
                UserEntity user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                GameSessionEntity session = gameSessionRepository.findByUserIdAndIsActiveTrue(user.getId())
                                .orElseThrow(() -> new RuntimeException("No active session found"));

                List<GameResourceSnapshotEntity> snapshots = snapshotRepository
                                .findBySessionIdOrderByMonthAscYearAsc(session.getId());

                // Prepare data for charts
                List<StrategicAnalysisDTO.ResourcePointDTO> historyPoints = snapshots.stream()
                                .map(s -> new StrategicAnalysisDTO.ResourcePointDTO(
                                                String.format("%02d/%d", s.getMonth(), s.getYear()),
                                                s.getBudget(), s.getTrust(), s.getPopulation()))
                                .collect(Collectors.toList());

                try {
                        String userPrompt = buildAnalysisPrompt(session, snapshots);
                        String requestBody = buildGeminiRequest(userPrompt);

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        headers.set("x-goog-api-key", apiKey);

                        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

                        // Call Gemini API
                        ResponseEntity<String> response = restTemplate.postForEntity(GEMINI_API_URL, entity,
                                        String.class);

                        JsonNode root = objectMapper.readTree(response.getBody());
                        String textResponse = root.path("candidates").get(0).path("content").path("parts").get(0)
                                        .path("text")
                                        .asText();

                        // Robust JSON extraction
                        String jsonStr = textResponse;
                        if (jsonStr.contains("```json")) {
                                jsonStr = jsonStr.substring(jsonStr.indexOf("```json") + 7);
                                if (jsonStr.contains("```")) {
                                        jsonStr = jsonStr.substring(0, jsonStr.indexOf("```"));
                                }
                        } else if (jsonStr.contains("```")) {
                                jsonStr = jsonStr.substring(jsonStr.indexOf("```") + 3);
                                if (jsonStr.contains("```")) {
                                        jsonStr = jsonStr.substring(0, jsonStr.indexOf("```"));
                                }
                        }
                        jsonStr = jsonStr.trim();

                        JsonNode analysisJson = objectMapper.readTree(jsonStr);

                        StrategicAnalysisDTO dto = new StrategicAnalysisDTO();
                        dto.setNarrative(analysisJson.path("narrative").asText());
                        dto.setAchievements(objectMapper.convertValue(analysisJson.path("achievements"),
                                        new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {
                                        }));
                        dto.setWarnings(objectMapper.convertValue(analysisJson.path("warnings"),
                                        new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {
                                        }));
                        dto.setHistory(historyPoints);

                        return dto;

                } catch (Exception e) {
                        return getFallbackAnalysis(historyPoints, e.getMessage());
                }
        }

        private String buildAnalysisPrompt(GameSessionEntity session, List<GameResourceSnapshotEntity> snapshots) {
                StringBuilder prompt = new StringBuilder("ИСТОРИЯ НА РЕСУРСИТЕ:\\n");
                for (GameResourceSnapshotEntity s : snapshots) {
                        prompt.append(String.format("- %02d/%d: Бюджет %d, Доверие %d, Население %d, Инфра %d\\n",
                                        s.getMonth(), s.getYear(), s.getBudget(), s.getTrust(), s.getPopulation(),
                                        s.getInfrastructure()));
                }

                prompt.append("\\nПОСЛЕДНИ СЪБИТИЯ (ЛОГОВЕ):\\n");
                prompt.append(session.getLogsJson());

                prompt.append(
                                "\\n\\nЗАДАЧА: Направи дълбок анализ. Как се развива градът? Какви са рисковете? Върни само JSON.");
                return prompt.toString();
        }

        private String buildGeminiRequest(String userPrompt) throws Exception {
                Map<String, Object> request = new HashMap<>();
                Map<String, Object> systemInstruction = new HashMap<>();
                Map<String, String> systemPart = new HashMap<>();
                systemPart.put("text", SYSTEM_PROMPT);
                systemInstruction.put("parts", List.of(systemPart));
                request.put("system_instruction", systemInstruction);

                Map<String, Object> contents = new HashMap<>();
                Map<String, String> userPart = new HashMap<>();
                userPart.put("text", userPrompt);
                contents.put("parts", List.of(userPart));
                request.put("contents", List.of(contents));

                // Generation config for structural JSON output
                Map<String, Object> generationConfig = new HashMap<>();
                generationConfig.put("response_mime_type", "application/json");
                generationConfig.put("temperature", 0.7);
                request.put("generationConfig", generationConfig);

                // Relax safety settings for game narrative
                List<Map<String, String>> safetySettings = List.of(
                                Map.of("category", "HARM_CATEGORY_HARASSMENT", "threshold", "BLOCK_NONE"),
                                Map.of("category", "HARM_CATEGORY_HATE_SPEECH", "threshold", "BLOCK_NONE"),
                                Map.of("category", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold", "BLOCK_NONE"),
                                Map.of("category", "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold", "BLOCK_NONE"));
                request.put("safetySettings", safetySettings);

                return objectMapper.writeValueAsString(request);
        }

        private StrategicAnalysisDTO getFallbackAnalysis(List<StrategicAnalysisDTO.ResourcePointDTO> history,
                        String error) {
                String narrative = "В момента системите за дълбок анализ са претоварени. Изчакайте следващия месец.";
                if (error != null) {
                        narrative += " (Детайли: " + (error.length() > 100 ? error.substring(0, 100) : error) + ")";
                }

                return new StrategicAnalysisDTO(
                                narrative,
                                List.of("Запазен стабилен бюджет", "Успешна регистрация на история"),
                                List.of("Опасност от демографски срив",
                                                "Нужда от по-бързо обновяване на инфраструктурата"),
                                history);
        }
}

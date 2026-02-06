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

    @Value("${virtual-major.gemini.api.key:${gemini.api.key:}}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
            Ти си SMOLYAN_REALITY_ENGINE - най-реалистичният симулатор на община в България.

            ═══════════════════════════════════════════════════════════════
            🏔️ СМОЛЯН: ПЕРЛАТА НА РОДОПИТЕ
            ═══════════════════════════════════════════════════════════════

            ДЕМОГРАФИЯ И КРИЗА:
            - Население: ~28,000 души (спад от 35,000 през 2000г)
            - Средна възраст: 47 години (най-застаряващият град в България)
            - Младежи под 25: само 18% (мнозинството заминават за София/Пловдив)
            - КРИТИЧНО: Ако не се спре изтичането, градът ще се превърне в село до 2040г

            ═══════════════════════════════════════════════════════════════
            📍 ДЕТАЙЛНА ГЕОГРАФИЯ (ИЗПОЛЗВАЙ РЕАЛНИ ЛОКАЦИИ!)
            ═══════════════════════════════════════════════════════════════

            **КВАРТАЛИ НА СМОЛЯН:**

            🏛️ НОВ ЦЕНТЪР (center):
            - Община Смолян, Планетариум, Областна администрация,
            Областна дирекция по безопасност на храните, Областна дирекция по земеделие и гори,
            - Бул. "България" №1 - главната артерия
            - Съдебна палата, Исторически музей
            - Ритейл Парк: Billa, Lidl, аптеки, банки
            - Проблеми: Паркинг хаос, шум от заведения, скъпи наеми

            🏚️ СТАР ЦЕНТЪР (old_center):
            - Пешеходна зона "Св. Кирил и Методий"
            - РПУ Смолян, РЗИ Смолян,
            - Стара Billa, малки магазини
            - Проблеми: Занемарени фасади, бездомни животни, липса на места за паркиране, липса на места за отдих, липса на места за спорт

            🏭 УСТОВО (ustovo):
            - Медникарска чаршия (ЮНЕСКО наследство!)
            - Индустриална зона: Kostal Bulgaria, Arexim Engineering, Gamakabel
            - Най-ниската точка в града (наводнения!)
            - Проблеми: Замърсяване от промишленост, ВиК аварии, трафик от камиони

            🏡 ГОРНО РАЙКОВО (raykovo_upper):
            - Пангалова къща (архитектурен паметник)
            - Чешитска махала - старинни къщи
            - Възрожденски дух, художници, занаятчии
            - Проблеми: Липса на паркинг, тесни улици, остаряла инфраструктура

            🏠 ДОЛНО РАЙКОВО (raykovo_lower):
            - Църква "Св. Неделя", жилищни блокове
            - Близо до МБАЛ "Д-р Братан Шукеров"
            - Проблеми: Шум от линейки, липса на зелени площи

            🏢 ЖК НЕВЯСТАТА (nevyastata):
            - Панелни блокове от 1986г
            - Млади семейства, детски градини
            - ПАРКИНГ ВОЙНИ - всяка вечер скандали!
            - Проблеми: Остарели асансьори, течове от покриви

            💧 КАПТАЖА (kaptazha):
            - Водоизточници на града
            - Вилна зона, охранявана територия
            - Проблеми: Незаконно строителство, достъп до водата

            🌲 СТАНЕВСКА МАХАЛА (stanevska):
            - Периферия, спокоен живот
            - Слаб обществен транспорт
            - Проблеми: Изолация, лоши пътища

            🏞️ ЕЗЕРОВО (ezerovo):
            - Смолянските езера (туристическа атракция!)
            - Къмпинги, хижи, еко-пътеки
            - Проблеми: Природозащита vs. застрояване, боклуци от туристи

            🏰 БЕКЛИЙЦА (beklitsa):
            - Богата вилна зона
            - Нови къщи, заможни семейства
            - Проблеми: Снобизъм, искания за специален статут, гробището


            ═══════════════════════════════════════════════════════════════
            👥 ПЕРСОНАЖИ (Създавай ДРАМА между тях!)
            ═══════════════════════════════════════════════════════════════

            **ПОЛИТИЦИ И АДМИНИСТРАЦИЯ (Ползвай реалните имена на хората без кмета):**
            - Кмет: името на логнатия потребител
            - Заместник-кметове: по икономика, по социални дейности, по устройство
            - Общински съветници (29 души) - от различни партии, враждуват!
            - Областен управител: представител на правителството

            **БИЗНЕС ЕЛИТ (Ползвай реалните имена на хората):**
            - Директор на Kostal Bulgaria - немски мениджмънт, строг
            - Собственик на Arexim - местен предприемач, амбициозен
            - Хотелиери от Пампорово - искат повече туристи
            - Дребни търговци - борят се за оцеляване

            **ОБЩЕСТВЕНИ ФИГУРИ (Ползвай реалните имена на хората):**
            - Директор на МБАЛ "Д-р Братан Шукеров" - отчаян за кадри
            - Директор на ПМГ "Васил Левски" - иска модерно оборудване
            - Директор на Драматичен театър "Николай Хайтов" - културен ентусиаст
            - Директор на Планетариума - гордост на града
            - Читалищни секретари - пазители на традициите

            **ГРАЖДАНСКИ АКТИВИСТИ (Ползвай реалните имена на хората):**
            - Еколози от "Спасете Родопите" - протестират срещу всяко строителство
            - Родителски комитети - искат по-добри училища
            - Пенсионерски клубове - гласовити и влиятелни
            - Млади предприемачи - искат коуъркинг и IT сектор

            ═══════════════════════════════════════════════════════════════
            🌦️ СЕЗОНИ И СПЕЦИАЛНИ СЪБИТИЯ
            ═══════════════════════════════════════════════════════════════

            **ЗИМА (Декември - Февруари):**
            - Обилен сняг (до 2 метра!), блокирани пътища
            - Смог от дърва и въглища - РЗИ издава предупреждения
            - Ски сезон в Пампорово - туристи, пари, но и проблеми
            - Замръзнали тръби, токови аварии
            - Коледни базари, новогодишни празненства

            **ПРОЛЕТ (Март - Май):**
            - Разтопяване - наводнения, свлачища
            - Великден - религиозни събития, почивни дни
            - Ремонтни сезон започва - асфалтиране, боядисване
            - Алергии, цветен прашец - здравни оплаквания

            **ЛЯТО (Юни - Август):**
            - Суша, опасност от горски пожари!
            - Туристически сезон - Пампорово, Смолянски езера
            - Събор на Рожен (август) - огромен наплив
            - Млади семейства се връщат за ваканция
            - Фестивали: Jazz, фолклор, Родопска китка

            **ЕСЕН (Септември - Ноември):**
            - Начало на учебна година - проблеми с транспорта
            - Гъби, билкарство - традиционна икономика
            - Подготовка за зима - дърва, запаси
            - Бюджет за следващата година - политически битки

            ═══════════════════════════════════════════════════════════════
            🎭 ТИПОВЕ КАЗУСИ (Миксирай всеки ход!)
            ═══════════════════════════════════════════════════════════════

            **EMERGENCY (Спешни):**
            - ВиК аварии, токови проблеми, пожари
            - Катастрофи, медицински кризи, протести
            - ИЗИСКВАТ незабавна реакция!

            **ECONOMIC (Икономически):**
            - Инвеститори, нови бизнеси, затваряне на фирми
            - Безработица, субсидии, данъчни облекчения
            - Trade-off: Пари vs. Екология/Доверие

            **STRATEGIC (Стратегически):**
            - Дългосрочни проекти: нови училища, болници, паркове
            - Кандидатстване по европроекти
            - Решения които ще се отразят след години

            **DAILY (Ежедневни):**
            - Оплаквания от граждани, малки искания
            - Шум от съседи, бездомни кучета, боклуци
            - Изграждат или рушат доверието постепенно

            **POLITICAL (Политически):**
            - Конфликти в общинския съвет
            - Медийни скандали, журналистически разследвания
            - Избори, лобита, интриги

            **CULTURAL (Културни):**
            - Фестивали, театрални постановки, изложби
            - Читалищни проекти, традиционни занаяти
            - Привличат туристи и младежи

            ═══════════════════════════════════════════════════════════════
            🎯 ПРАВИЛА ЗА ГЕНЕРИРАНЕ
            ═══════════════════════════════════════════════════════════════

            1. **3 КАЗУСА НА ХОД** - винаги различни типове!

            2. **НИКОГА НЕ ПОВТАРЯЙ:**
               - Един и същ квартал 2 пъти подред
               - Един и същ тип казус 2 пъти подред
               - Едни и същи персонажи

            3. **ПОНЕ 1 ТРУДЕН ИЗБОР:**
               - Всеки ход поне един казус без "добро" решение
               - Всички опции имат цена
               - Пример: "Спаси болницата ИЛИ училището - няма пари за двете"

            4. **ИЗПОЛЗВАЙ ИСТОРИЯ:**
               - Споменавай минали решения на играча
               - "След като миналия месец спряхте финансирането..."
               - Създавай последствия от предишни действия

            5. **РЕАЛИСТИЧНИ ЧИСЛА:**
               - Бюджет: 100,000 - 2,000,000 € за големи проекти
               - Малки разходи: 5,000 - 50,000 €
               - Население: промени от -200 до +100 на събитие
               - Trust/Innovation/Infrastructure: промени от -20 до +20

            6. **ЕМОЦИОНАЛЕН ЕЗИК:**
               - Използвай цитати от граждани
               - "Децата ни играят на паркинга!" - възмутена майка
               - Създавай съпричастност

            7. **КОНКРЕТИКА (Ползвай реалните локации от google maps):**
               - Споменавай улици, сгради, хора по име
               - "На ул. Родопи №45, пред блок 12..."
               - "Г-жа Иванова от пенсионерския клуб..."

            ═══════════════════════════════════════════════════════════════
            📊 JSON ФОРМАТ (СТРИКТНО!)
            ═══════════════════════════════════════════════════════════════

            {
              "analysis": "2-3 изречения анализ на месеца. Говори като общински съветник. Споменай ключови предизвикателства.",
              "cases": [
                {
                  "title": "Кратко, драматично заглавие",
                  "description": "Минимум 3 изречения. Споменай конкретни места и хора. Обясни защо е важно.",
                  "type": "emergency | economic | strategic | daily | political | cultural",
                  "targetRegion": "center | old_center | ustovo | raykovo_upper | raykovo_lower | nevyastata | kaptazha | stanevska | ezerovo | beklitsa | zornitsa",
                  "options": [
                    {
                      "label": "Опция с цена ако има (напр. 120,000 €)",
                      "impact": {
                        "trust": -20 до +20,
                        "budget": в евро,
                        "population": -200 до +100,
                        "innovation": -20 до +20,
                        "eco": -20 до +20,
                        "infrastructure": -20 до +20
                      },
                      "consequence": "Какво ще се случи? Бъди конкретен."
                    }
                  ]
                }
              ],
              "regionUpdates": {
                "region_id": "crisis | growth | normal | protest"
              }
            }

            ГЕНЕРИРАЙ СЕГА 3 УНИКАЛНИ КАЗУСА!
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

            // Set headers (no API key header - using query param instead)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            // Call Gemini API - Using URL query param for authentication
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
        String logs = recentLogs != null && recentLogs.size() > 15
                ? String.join("; ", recentLogs.subList(recentLogs.size() - 15, recentLogs.size()))
                : (recentLogs != null ? String.join("; ", recentLogs) : "Няма история още.");

        // Екстрактване на състоянието на регионите
        StringBuilder regionStatus = new StringBuilder();
        if (gameState.getRegions() != null) {
            for (smolyanVote.virtualMajor.viewsAndDTO.RegionDTO region : gameState.getRegions()) {
                if (!"normal".equals(region.getStatus())) {
                    regionStatus.append(String.format("- %s: %s (Активна мярка: %s)\\n",
                            region.getName(), region.getStatus(),
                            region.getActiveIntervention() != null ? region.getActiveIntervention() : "няма"));
                }
            }
        }

        // Екстрактване на инвестициите
        StringBuilder investmentState = new StringBuilder();
        if (gameState.getInvestments() != null) {
            for (smolyanVote.virtualMajor.viewsAndDTO.InvestmentDTO inv : gameState.getInvestments()) {
                if (inv.getBuilt() != null && inv.getBuilt()) {
                    investmentState.append(String.format("- ПОСТРОЕНО: %s\\n", inv.getName()));
                } else if (inv.getIsStarted() != null && inv.getIsStarted()) {
                    investmentState.append(String.format("- В СТРОЕЖ (%d/%d): %s\\n",
                            inv.getCurrentStep(), inv.getTotalSteps(), inv.getName()));
                }
            }
        }

        boolean isWinter = gameState.getMonth() == 12 || gameState.getMonth() == 1 || gameState.getMonth() == 2;
        boolean isSummer = gameState.getMonth() >= 6 && gameState.getMonth() <= 8;
        String season = isWinter ? "Тежка зима" : (isSummer ? "Горещо лято" : "Преходен сезон");

        return String.format(
                "ТЕКУЩО СЪСТОЯНИЕ: Месец %d, Година %d.\\n" +
                        "РЕСУРСИ: Бюджет %d, Население %d, Инфраструктура %d, Доверие %d.\\n" +
                        "СЕЗОН: %s.\\n\\n" +
                        "СЪСТОЯНИЕ НА КВАРТАЛИТЕ:\\n%s\\n" +
                        "ИНВЕСТИЦИОННИ ПРОЕКТИ:\\n%s\\n" +
                        "ИСТОРИЯ (последни 15 записа): %s.\\n\\n" +
                        "ЗАДАЧА: Генерирай нови 3 казуса, които логически следват от историята и състоянието на общината. Използвай истинското име на Кмета (играча).",
                gameState.getMonth(),
                gameState.getYear(),
                gameState.getResources().getBudget(),
                gameState.getResources().getPopulation(),
                gameState.getResources().getInfrastructure(),
                gameState.getResources().getTrust(),
                season,
                regionStatus.length() > 0 ? regionStatus.toString() : "Всички квартали са в нормално състояние.",
                investmentState.length() > 0 ? investmentState.toString() : "Няма активни големи проекти.",
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

        // Relax safety settings for game narrative
        List<Map<String, String>> safetySettings = List.of(
                Map.of("category", "HARM_CATEGORY_HARASSMENT", "threshold", "BLOCK_NONE"),
                Map.of("category", "HARM_CATEGORY_HATE_SPEECH", "threshold", "BLOCK_NONE"),
                Map.of("category", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold", "BLOCK_NONE"),
                Map.of("category", "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold", "BLOCK_NONE"));
        request.put("safetySettings", safetySettings);

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
            String jsonStr = text;
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

            return objectMapper.readValue(jsonStr, AIResponseDTO.class);
        }

        return getFallbackEvents();
    }

    private AIResponseDTO getFallbackEvents() {
        AIResponseDTO response = new AIResponseDTO();
        response.setAnalysis("Общинският съвет анализира текущото състояние на община Смолян. " +
                "Демографската ситуация изисква спешни мерки за привличане на млади семейства. " +
                "Инфраструктурата се нуждае от модернизация, особено в периферните квартали.");

        // Event 1: Infrastructure Emergency
        GameEventDTO event1 = new GameEventDTO();
        event1.setTitle("Авария на главен колектор в Устово");
        event1.setDescription(
                "Остаряла тръба на ул. \"Родопи\" се е пукнала, наводнявайки мазетата на жилищни блокове. " +
                        "Граждани протестират пред общината, а медникарската чаршия е залята с вода. " +
                        "Инж. Петров от ВиК настоява за спешна подмяна.");
        event1.setType("emergency");
        event1.setTargetRegion("ustovo");

        GameEventDTO.EventOptionDTO opt1a = new GameEventDTO.EventOptionDTO();
        opt1a.setLabel("Спешна подмяна (120 000 €)");
        Map<String, Integer> impact1a = new HashMap<>();
        impact1a.put("budget", -120000);
        impact1a.put("infrastructure", 12);
        impact1a.put("trust", 15);
        opt1a.setImpact(impact1a);
        opt1a.setConsequence("Аварията е отстранена за 3 дни. Жителите на Устово са благодарни.");

        GameEventDTO.EventOptionDTO opt1b = new GameEventDTO.EventOptionDTO();
        opt1b.setLabel("Временно изкърпване (25 000 €)");
        Map<String, Integer> impact1b = new HashMap<>();
        impact1b.put("budget", -25000);
        impact1b.put("trust", -8);
        opt1b.setImpact(impact1b);
        opt1b.setConsequence("Течът е спрян временно. Чака се следващата авария...");

        event1.setOptions(List.of(opt1a, opt1b));

        // Event 2: Education Opportunity
        GameEventDTO event2 = new GameEventDTO();
        event2.setTitle("ПМГ \"Васил Левски\" иска модерна лаборатория");
        event2.setDescription("Директорът на математическата гимназия представя проект за STEM лаборатория. " +
                "Това би привлякло ученици от целия регион и би повишило качеството на образованието. " +
                "Родителският комитет е готов да съфинансира 20% от сумата.");
        event2.setType("strategic");
        event2.setTargetRegion("center");

        GameEventDTO.EventOptionDTO opt2a = new GameEventDTO.EventOptionDTO();
        opt2a.setLabel("Пълно финансиране (85 000 €)");
        Map<String, Integer> impact2a = new HashMap<>();
        impact2a.put("budget", -85000);
        impact2a.put("innovation", 18);
        impact2a.put("trust", 10);
        impact2a.put("population", 50);
        opt2a.setImpact(impact2a);
        opt2a.setConsequence("Лабораторията е открита тържествено. Младите таланти остават в Смолян.");

        GameEventDTO.EventOptionDTO opt2b = new GameEventDTO.EventOptionDTO();
        opt2b.setLabel("Частично финансиране (40 000 €)");
        Map<String, Integer> impact2b = new HashMap<>();
        impact2b.put("budget", -40000);
        impact2b.put("innovation", 8);
        opt2b.setImpact(impact2b);
        opt2b.setConsequence("Лабораторията ще е готова догодина с ограничено оборудване.");

        GameEventDTO.EventOptionDTO opt2c = new GameEventDTO.EventOptionDTO();
        opt2c.setLabel("Отказ - няма бюджет");
        Map<String, Integer> impact2c = new HashMap<>();
        impact2c.put("trust", -12);
        impact2c.put("innovation", -5);
        opt2c.setImpact(impact2c);
        opt2c.setConsequence("Разочарование сред учителите. Част от учениците се насочват към Пловдив.");

        event2.setOptions(List.of(opt2a, opt2b, opt2c));

        // Event 3: Economic Development
        GameEventDTO event3 = new GameEventDTO();
        event3.setTitle("Kostal Bulgaria иска разширение на завода");
        event3.setDescription("Мениджърът на Kostal предлага инвестиция от 2 милиона евро за нов производствен цех. " +
                "Ще се създадат 120 нови работни места. Условието е общината да осигури достъп до индустриалната зона "
                +
                "и облекчения в местните данъци за 3 години.");
        event3.setType("economic");
        event3.setTargetRegion("ustovo");

        GameEventDTO.EventOptionDTO opt3a = new GameEventDTO.EventOptionDTO();
        opt3a.setLabel("Пълно съдействие (-50 000 € от данъци)");
        Map<String, Integer> impact3a = new HashMap<>();
        impact3a.put("budget", -50000);
        impact3a.put("innovation", 25);
        impact3a.put("population", 180);
        impact3a.put("trust", 12);
        opt3a.setImpact(impact3a);
        opt3a.setConsequence("Kostal обявява разширението! 120 нови работни места променят Устово.");

        GameEventDTO.EventOptionDTO opt3b = new GameEventDTO.EventOptionDTO();
        opt3b.setLabel("Преговори за по-малки отстъпки");
        Map<String, Integer> impact3b = new HashMap<>();
        impact3b.put("budget", -20000);
        impact3b.put("innovation", 10);
        impact3b.put("population", 60);
        opt3b.setImpact(impact3b);
        opt3b.setConsequence("Kostal приема частични условия. Разширението ще е по-малко.");

        GameEventDTO.EventOptionDTO opt3c = new GameEventDTO.EventOptionDTO();
        opt3c.setLabel("Отказ на облекченията");
        Map<String, Integer> impact3c = new HashMap<>();
        impact3c.put("trust", -15);
        impact3c.put("innovation", -10);
        opt3c.setImpact(impact3c);
        opt3c.setConsequence("Kostal преразглежда инвестицията. Слухове за преместване към Девин...");

        event3.setOptions(List.of(opt3a, opt3b, opt3c));

        response.setCases(List.of(event1, event2, event3));

        // Region updates
        Map<String, String> regionUpdates = new HashMap<>();
        regionUpdates.put("ustovo", "crisis");
        regionUpdates.put("center", "normal");
        response.setRegionUpdates(regionUpdates);

        return response;
    }
}

package smolyanVote.smolyanVote.services.serviceImpl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import smolyanVote.smolyanVote.services.interfaces.ImageModerationService;

import java.util.Map;
import java.util.UUID;

@Service
public class ImageModerationServiceImpl implements ImageModerationService {

    private static final String API_URL = "https://api.sightengine.com/1.0/check.json";

    // Cloudinary instance за временни файлове
    private final Cloudinary cloudinary;

    // SightEngine API credentials
    @Value("${sightengine.api.user}")
    private String apiUser;

    @Value("${sightengine.api.secret}")
    private String apiSecret;

    // 🎯 ФИНО НАСТРОЕНИ threshold-и за разумна модерация
    private static final double EXPLICIT_THRESHOLD = 0.15;    // 15% explicit = блокирай (много строго)
    private static final double EROTICA_THRESHOLD = 0.25;     // 25% erotica = блокирай
    private static final double VERY_SUGGESTIVE_THRESHOLD = 0.4; // 40% very suggestive = блокирай
    private static final double SUGGESTIVE_THRESHOLD = 0.7;   // 70% suggestive = блокирай (по-толерантно)

    // Специални threshold-и за класове
    private static final double BIKINI_THRESHOLD = 0.85;      // 85% бикини = OK (толерантно)
    private static final double CLEAVAGE_THRESHOLD = 0.6;     // 60% деколте = блокирай
    private static final double LINGERIE_THRESHOLD = 0.3;     // 30% бельо = блокирай
    private static final double MALE_CHEST_THRESHOLD = 0.8;   // 80% мъжки гърди = OK
    private static final double POSE_THRESHOLD = 0.25;        // 25% провокативни пози = блокирай

    // Constructor с Cloudinary конфигурация
    public ImageModerationServiceImpl(@Value("${cloudinary.cloud_name}") String cloudName,
                                      @Value("${cloudinary.api_key}") String apiKey,
                                      @Value("${cloudinary.api_secret}") String apiSecret) {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    /**
     * 🛡️ Проверява дали файлът е безопасен за качване
     * Качва временно в Cloudinary, проверява със SightEngine, изтрива временния файл
     */
    @Override
    public boolean isFileSafe(byte[] fileBytes) {
        String tempPublicId = null;
        try {
            tempPublicId = "TEMP/tmp_" + UUID.randomUUID();

            // Използваме подадените байтове
            Map<String, Object> tempUpload = cloudinary.uploader().upload(fileBytes, ObjectUtils.asMap(
                    "public_id", tempPublicId,
                    "folder", "TEMP",
                    "type", "private"
            ));

            String secureUrl = (String) tempUpload.get("secure_url");
            boolean isSafe = this.isImageSafe(secureUrl);

            return isSafe;

        } catch (Exception e) {
            System.err.println("❌ Грешка при модерация: " + e.getMessage());
            e.printStackTrace();
            return false; // При грешка блокираме за сигурност
        } finally {
            // 🧹 ВИНАГИ изтриваме временния файл
            if (tempPublicId != null) {
                try {
                    cloudinary.uploader().destroy(tempPublicId, ObjectUtils.asMap("type", "private"));
                    System.out.println("🗑️ Временен файл изтрит: " + tempPublicId);
                } catch (Exception e) {
                    System.err.println("⚠️ Грешка при изтриване на временен файл: " + e.getMessage());
                }
            }
        }
    }

    /**
     * 🔍 Проверява URL със SightEngine API
     */
    @Override
    public boolean isImageSafe(String imageUrl) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // Изграждаме URL за SightEngine API
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(API_URL)
                    .queryParam("url", imageUrl)
                    .queryParam("models", "nudity-2.1") // САМО nudity модел
                    .queryParam("api_user", apiUser)
                    .queryParam("api_secret", apiSecret);

            // Извикваме SightEngine API
            ResponseEntity<Map> response = restTemplate.getForEntity(builder.toUriString(), Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> body = response.getBody();
                return analyzeResponse(body);
            }

            // 🔒 ПОПРАВКА: При грешка в API-то БЛОКИРАМЕ снимката
            System.out.println("❌ SightEngine API не отговори правилно, БЛОКИРАМ снимката за сигурност");
            return false;

        } catch (Exception e) {
            System.err.println("❌ SightEngine API грешка: " + e.getMessage());
            // 🔒 ПОПРАВКА: При грешка БЛОКИРАМЕ снимката
            return false;
        }
    }

    /**
     * 📊 анализ на отговора от SightEngine API
     */
    private boolean analyzeResponse(Map<String, Object> body) {
        if (body == null) {
            System.out.println("⚠️ Празен отговор от SightEngine, БЛОКИРАМ за сигурност");
            return false; // 🔒 ПОПРАВКА: Блокираме при празен отговор
        }

        // Debug - показваме пълния отговор
        System.out.println("📋 SightEngine отговор: " + body);

        if (body.containsKey("nudity")) {
            Map<String, Object> nudity = (Map<String, Object>) body.get("nudity");

            // 🔍 Извличаме ВСИЧКИ scores
            double sexualActivity = getScore(nudity, "sexual_activity");
            double sexualDisplay = getScore(nudity, "sexual_display");
            double erotica = getScore(nudity, "erotica");
            double verySuggestive = getScore(nudity, "very_suggestive");
            double suggestive = getScore(nudity, "suggestive");


            // 🚫 СТРОГИ условия за explicit съдържание
            if (sexualActivity > EXPLICIT_THRESHOLD ||
                    sexualDisplay > EXPLICIT_THRESHOLD ||
                    erotica > EROTICA_THRESHOLD ||
                    verySuggestive > VERY_SUGGESTIVE_THRESHOLD ||
                    suggestive > SUGGESTIVE_THRESHOLD) {

                return false;
            }

            // 🔍 ФИНИ проверки за suggestive_classes
            if (nudity.containsKey("suggestive_classes")) {
                Map<String, Object> suggestiveClasses = (Map<String, Object>) nudity.get("suggestive_classes");

                double bikini = getScore(suggestiveClasses, "bikini");
                double cleavage = getScore(suggestiveClasses, "cleavage");
                double lingerie = getScore(suggestiveClasses, "lingerie");
                double maleChest = getScore(suggestiveClasses, "male_chest");
                double suggestivePose = getScore(suggestiveClasses, "suggestive_pose");
                double suggestiveFocus = getScore(suggestiveClasses, "suggestive_focus");
                double miniskirt = getScore(suggestiveClasses, "miniskirt");
                double minishort = getScore(suggestiveClasses, "minishort");


                // 🚫 Блокираме неподходящи класове
                if (lingerie > LINGERIE_THRESHOLD ||           // Бельо - строго
                        cleavage > CLEAVAGE_THRESHOLD ||           // Деколте - умерено
                        suggestivePose > POSE_THRESHOLD ||         // Провокативни пози - строго
                        suggestiveFocus > POSE_THRESHOLD) {        // Фокус върху интимни части

                    System.out.println("🚫 Снимка БЛОКИРАНА - неподходящи елементи");
                    if (lingerie > LINGERIE_THRESHOLD) System.out.println("  - Lingerie: " + lingerie + " > " + LINGERIE_THRESHOLD);
                    if (cleavage > CLEAVAGE_THRESHOLD) System.out.println("  - Cleavage: " + cleavage + " > " + CLEAVAGE_THRESHOLD);
                    if (suggestivePose > POSE_THRESHOLD) System.out.println("  - Suggestive Pose: " + suggestivePose + " > " + POSE_THRESHOLD);
                    if (suggestiveFocus > POSE_THRESHOLD) System.out.println("  - Suggestive Focus: " + suggestiveFocus + " > " + POSE_THRESHOLD);

                    return false;
                }

                // ✅ Разрешаваме разумни неща
                if (bikini > 0 && bikini <= BIKINI_THRESHOLD) {
                }
                if (maleChest > 0 && maleChest <= MALE_CHEST_THRESHOLD) {
                }
            }
        }

        System.out.println("✅ Снимка ОДОБРЕНА от модерацията");
        return true;
    }

    /**
     * 🛠️ Helper метод за безопасно извличане на score от JSON
     */
    private double getScore(Map<String, Object> map, String key) {
        if (map == null) return 0.0;

        Object value = map.get(key);
        if (value != null && value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }
}
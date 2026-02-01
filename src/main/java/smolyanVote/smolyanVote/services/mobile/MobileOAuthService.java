package smolyanVote.smolyanVote.services.mobile;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.AuthProvider;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Mobile OAuth Service
 * Валидира Google ID token и Facebook access token и създава/обновява user
 * accounts
 */
@Service
@Slf4j
public class MobileOAuthService {

    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final RestTemplate restTemplate;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.facebook.client-id:}")
    private String facebookAppId;

    @Value("${spring.security.oauth2.client.registration.facebook.client-secret:}")
    private String facebookAppSecret;

    public MobileOAuthService(
            UserRepository userRepository,
            ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.activityLogService = activityLogService;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Валидира Google ID token и връща user info
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> validateGoogleToken(String idToken) throws Exception {
        try {
            // Google token info endpoint
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;

            ResponseEntity<Map<String, Object>> response = restTemplate.getForEntity(url,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new Exception("Invalid Google ID token");
            }

            Map<String, Object> tokenInfo = response.getBody();

            // Проверка на audience (client ID)
            String audience = (String) tokenInfo.get("aud");
            if (!googleClientId.equals(audience)) {
                throw new Exception("Token audience mismatch");
            }

            // Извличане на user info
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", tokenInfo.get("sub"));
            userInfo.put("email", tokenInfo.get("email"));
            userInfo.put("name", tokenInfo.get("name"));
            userInfo.put("picture", tokenInfo.get("picture"));

            return userInfo;
        } catch (Exception e) {
            log.error("Error validating Google token", e);
            throw new Exception("Failed to validate Google token: " + e.getMessage());
        }
    }

    /**
     * Валидира Facebook access token и връща user info
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> validateFacebookToken(String accessToken) throws Exception {
        try {
            // Facebook Graph API endpoint
            String url = String.format(
                    "https://graph.facebook.com/v18.0/me?fields=id,name,email,picture.type(large)&access_token=%s",
                    accessToken);

            ResponseEntity<Map<String, Object>> response = restTemplate.getForEntity(url,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new Exception("Invalid Facebook access token");
            }

            Map<String, Object> userInfo = response.getBody();

            // Проверка за email (може да липсва)
            if (userInfo.get("email") == null) {
                throw new Exception("Facebook account does not have email. Please use an account with email.");
            }

            // Извличане на picture URL - Използваме директен Graph API URL, който е
            // по-надежден
            String pictureUrl = String.format("https://graph.facebook.com/%s/picture?type=large", userInfo.get("id"));

            Map<String, Object> result = new HashMap<>();
            result.put("id", userInfo.get("id"));
            result.put("email", userInfo.get("email"));
            result.put("name", userInfo.get("name"));
            result.put("picture", pictureUrl);

            return result;
        } catch (Exception e) {
            log.error("Error validating Facebook token", e);
            throw new Exception("Failed to validate Facebook token: " + e.getMessage());
        }
    }

    /**
     * Създава или обновява user от OAuth provider
     */
    @Transactional
    public UserEntity processOAuthUser(Map<String, Object> userInfo, AuthProvider provider) {
        String email = ((String) userInfo.get("email")).toLowerCase().trim();
        String providerId = (String) userInfo.get("id");
        String name = (String) userInfo.get("name");
        String pictureUrl = (String) userInfo.get("picture");

        Optional<UserEntity> userOptional = userRepository.findByEmail(email);
        UserEntity user;
        boolean isNewUser = false;

        if (userOptional.isPresent()) {
            user = userOptional.get();

            // Проверка за LOCAL auth provider
            if (user.getAuthProvider() == AuthProvider.LOCAL) {
                throw new RuntimeException(
                        "Този email адрес вече е регистриран с email и парола. Моля, влезте с вашия email и парола.");
            }

            // Обновяване на данните
            if (user.getAuthProvider() != provider) {
                user.setAuthProvider(provider);
                user.setProviderId(providerId);
            }

            // Обновяване на name и picture
            if (name != null && !name.isEmpty()) {
                user.setRealName(name);
            }
            if (pictureUrl != null && !pictureUrl.isEmpty() &&
                    (user.getImageUrl() == null || user.getImageUrl().isEmpty())) {
                user.setImageUrl(pictureUrl);
            }
        } else {
            // Създаване на нов user
            user = new UserEntity();
            String username = generateUniqueUsername(name != null ? name : "user");

            user.setEmail(email)
                    .setUsername(username)
                    .setRealName(name != null ? name : "")
                    .setImageUrl(pictureUrl != null ? pictureUrl : "")
                    .setAuthProvider(provider)
                    .setProviderId(providerId)
                    .setStatus(UserStatusEnum.ACTIVE)
                    .setRole(UserRole.USER)
                    .setPassword(null);

            user.setCreated(Instant.now());
            isNewUser = true;
        }

        // Обновяване на online status
        user.setLastOnline(Instant.now());
        user.setOnlineStatus(1);
        user.setModified(Instant.now());
        userRepository.save(user);

        // Логване на регистрация ако е нов user
        if (isNewUser) {
            try {
                String providerName = provider == AuthProvider.GOOGLE ? "Google" : "Facebook";
                String details = String.format("Username: %s, Email: %s, Provider: %s",
                        user.getUsername(), user.getEmail(), providerName);

                activityLogService.logActivity(
                        ActivityActionEnum.USER_REGISTER,
                        user,
                        ActivityTypeEnum.USER.name(),
                        user.getId(),
                        details,
                        "unknown", // IP address - не е наличен в mobile context
                        "Mobile App" // User agent
                );
            } catch (Exception e) {
                log.warn("Failed to log OAuth registration activity", e);
            }
        }

        return user;
    }

    /**
     * Генерира уникален username
     */
    private String generateUniqueUsername(String baseName) {
        if (baseName == null || baseName.isEmpty()) {
            baseName = "user";
        }

        // Нормализиране на username
        String username = baseName.trim()
                .replaceAll("[^a-zA-Z0-9а-яА-Я\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();

        if (username.length() > 30) {
            int lastSpace = username.substring(0, 30).lastIndexOf(' ');
            username = lastSpace > 0 ? username.substring(0, lastSpace) : username.substring(0, 30);
        }

        if (username.isEmpty()) {
            username = "user";
        }

        // Добавяне на цифра ако е необходимо
        String finalUsername = username;
        int counter = 1;
        while (userRepository.findByUsername(finalUsername).isPresent()) {
            String suffix = String.valueOf(counter);
            int maxLength = 30 - suffix.length();
            finalUsername = username.substring(0, Math.min(username.length(), maxLength)) + suffix;
            counter++;
        }

        return finalUsername;
    }
}

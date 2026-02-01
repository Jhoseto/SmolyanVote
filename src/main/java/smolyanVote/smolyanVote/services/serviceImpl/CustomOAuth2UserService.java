package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.AuthProvider;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;

import java.time.Instant;
import java.util.*;

/**
 * Custom OAuth2 User Service for handling OAuth2 authentication from Google and
 * Facebook.
 * This service processes OAuth2 user information and creates or updates user
 * accounts.
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    public CustomOAuth2UserService(UserRepository userRepository, ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.activityLogService = activityLogService;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        AuthProvider authProvider = getAuthProvider(registrationId);

        // Получаване на правилния name attribute от конфигурацията
        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        OAuth2UserInfo oAuth2UserInfo = getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

        if (oAuth2UserInfo.getEmail() == null || oAuth2UserInfo.getEmail().isEmpty()) {
            throw new OAuth2AuthenticationException("Email не може да бъде празен");
        }

        // Нормализиране на email
        String normalizedEmail = oAuth2UserInfo.getEmail().toLowerCase().trim();

        Optional<UserEntity> userOptional = userRepository.findByEmail(normalizedEmail);
        UserEntity user;
        boolean isNewUser = false;

        if (userOptional.isPresent()) {
            // Потребителят вече съществува
            user = userOptional.get();

            // Ако потребителят е регистриран с LOCAL auth provider, отказваме достъп
            if (user.getAuthProvider() == AuthProvider.LOCAL) {
                throw new OAuth2AuthenticationException(
                        "Този email адрес вече е регистриран с email и парола. Моля, влезте с вашия email и парола, а не с "
                                +
                                (authProvider == AuthProvider.GOOGLE ? "Google" : "Facebook") + ".");
            }

            // Ако потребителят е регистриран с друг OAuth провайдър, обновяваме данните
            if (user.getAuthProvider() != authProvider) {
                // Свързване на акаунти - обновяваме провайдъра
                user.setAuthProvider(authProvider);
                user.setProviderId(oAuth2UserInfo.getId());
            }

            // Винаги обновяваме данните от OAuth провайдъра (username и realName)
            updateUserFromOAuth2(user, oAuth2UserInfo);
        } else {
            // Създаване на нов потребител
            user = createNewOAuth2User(oAuth2UserInfo, authProvider);
            isNewUser = true;
        }

        // Обновяване на последно влизане и online статус
        user.setLastOnline(Instant.now());
        user.setOnlineStatus(1);
        userRepository.save(user);

        // Логване на регистрация ако е нов потребител
        if (isNewUser) {
            logOAuth2Registration(user, authProvider);
        }

        // Създаване на authorities
        Collection<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        // Запазване на оригиналните атрибути от OAuth2User
        // Не променяме оригиналните атрибути, за да не счупим name attribute
        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());

        // Добавяме допълнителни атрибути за нашата логика (без да променяме name
        // attribute)
        attributes.put("email", normalizedEmail);
        attributes.put("userId", user.getId());

        // Използваме оригиналния name attribute от конфигурацията
        return new DefaultOAuth2User(authorities, attributes, nameAttributeKey);
    }

    private AuthProvider getAuthProvider(String registrationId) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> AuthProvider.GOOGLE;
            case "facebook" -> AuthProvider.FACEBOOK;
            default -> AuthProvider.LOCAL;
        };
    }

    private OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            case "facebook" -> new FacebookOAuth2UserInfo(attributes);
            default -> throw new OAuth2AuthenticationException("Неподдържан OAuth2 провайдър: " + registrationId);
        };
    }

    private UserEntity createNewOAuth2User(OAuth2UserInfo oAuth2UserInfo, AuthProvider authProvider) {
        UserEntity user = new UserEntity();

        String normalizedEmail = oAuth2UserInfo.getEmail().toLowerCase().trim();

        // Вземане на username от провайдъра (от name)
        String baseUsername = generateUsernameFromName(oAuth2UserInfo.getName());
        String username = generateUniqueUsername(baseUsername);

        // Вземане на realName от провайдъра
        String realName = oAuth2UserInfo.getName() != null ? oAuth2UserInfo.getName() : "";

        user.setEmail(normalizedEmail)
                .setUsername(username)
                .setRealName(realName)
                .setImageUrl(oAuth2UserInfo.getImageUrl() != null ? oAuth2UserInfo.getImageUrl() : "")
                .setAuthProvider(authProvider)
                .setProviderId(oAuth2UserInfo.getId())
                .setStatus(UserStatusEnum.ACTIVE) // OAuth потребителите са автоматично активни
                .setRole(UserRole.USER)
                .setPassword(null); // OAuth потребителите нямат парола

        user.setCreated(Instant.now());
        user.setModified(Instant.now());

        return user;
    }

    private void updateUserFromOAuth2(UserEntity user, OAuth2UserInfo oAuth2UserInfo) {
        // Винаги обновяваме realName от провайдъра
        if (oAuth2UserInfo.getName() != null && !oAuth2UserInfo.getName().isEmpty()) {
            user.setRealName(oAuth2UserInfo.getName());
        }

        // Обновяване на профилна снимка, ако е празна или се е променила
        if ((user.getImageUrl() == null || user.getImageUrl().isEmpty()) &&
                oAuth2UserInfo.getImageUrl() != null && !oAuth2UserInfo.getImageUrl().isEmpty()) {
            user.setImageUrl(oAuth2UserInfo.getImageUrl());
        }

        user.setModified(Instant.now());
    }

    /**
     * Генерира username от име (name) от провайдъра.
     * Запазва интервалите между имената и нормализира.
     */
    private String generateUsernameFromName(String name) {
        if (name == null || name.isEmpty()) {
            return "user";
        }

        // Премахване на специални символи, но запазване на интервалите
        String username = name.trim()
                .replaceAll("[^a-zA-Z0-9а-яА-Я\\s]", "") // Премахване на специални символи (освен букви, цифри и
                                                         // интервали)
                .replaceAll("\\s+", " ") // Нормализиране на множествените интервали до един интервал
                .trim();

        // Ограничаване на дължината (30 символа)
        if (username.length() > 30) {
            // Намираме последния интервал преди 30-тия символ, за да не счупим името
            int lastSpaceIndex = username.substring(0, 30).lastIndexOf(' ');
            if (lastSpaceIndex > 0) {
                username = username.substring(0, lastSpaceIndex);
            } else {
                username = username.substring(0, 30);
            }
        }

        // Ако е празно след обработката, използваме "user"
        if (username.isEmpty()) {
            username = "user";
        }

        return username;
    }

    /**
     * Генерира уникален username като добавя цифри в края ако е необходимо.
     * Например: username, username1, username2, и т.н.
     */
    private String generateUniqueUsername(String baseUsername) {
        String username = baseUsername;
        int counter = 1;

        // Проверка дали username вече съществува
        while (userRepository.findByUsername(username).isPresent()) {
            // Добавяне на цифра в края
            String suffix = String.valueOf(counter);

            // Проверка за максимална дължина (30 символа)
            int maxLength = 30;
            int baseLength = baseUsername.length();
            int suffixLength = suffix.length();

            if (baseLength + suffixLength > maxLength) {
                // Съкращаване на baseUsername, за да се побере суфиксът
                int newBaseLength = maxLength - suffixLength;
                baseUsername = baseUsername.substring(0, newBaseLength);
            }

            username = baseUsername + suffix;
            counter++;

            // Защита срещу безкраен цикъл (максимум 9999)
            if (counter > 9999) {
                // Ако достигнем лимита, добавяме timestamp
                username = baseUsername + "_" + System.currentTimeMillis();
                break;
            }
        }

        return username;
    }

    /**
     * Логва регистрация на нов OAuth2 потребител в activity wall
     */
    private void logOAuth2Registration(UserEntity user, AuthProvider authProvider) {
        try {
            // Извличане на HTTP request информация
            String ipAddress = "unknown";
            String userAgent = "unknown";

            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    // Извличане на IP адрес
                    ipAddress = extractIpAddress(request);
                    // Извличане на User-Agent
                    userAgent = request.getHeader("User-Agent");
                    if (userAgent == null) {
                        userAgent = "unknown";
                    }
                }
            }

            // Генериране на детайли
            String providerName = authProvider == AuthProvider.GOOGLE ? "Google" : "Facebook";
            String details = String.format("Username: %s, Email: %s, Provider: %s",
                    user.getUsername(), user.getEmail(), providerName);

            // Логване на активността
            activityLogService.logActivity(
                    ActivityActionEnum.USER_REGISTER,
                    user,
                    ActivityTypeEnum.USER.name(),
                    user.getId(),
                    details,
                    ipAddress,
                    userAgent);
        } catch (Exception e) {
            // Не хвърляме грешка, за да не съсипем OAuth2 процеса
            System.err.println("Failed to log OAuth2 registration activity: " + e.getMessage());
        }
    }

    /**
     * Извлича IP адрес от request, като взема предвид проксита
     */
    private String extractIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // Ако има множество IP адреси (от X-Forwarded-For), вземаме първия
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip != null ? ip : "unknown";
    }

    // ===== INNER CLASSES FOR OAUTH2 USER INFO =====

    private abstract static class OAuth2UserInfo {
        protected Map<String, Object> attributes;

        public OAuth2UserInfo(Map<String, Object> attributes) {
            this.attributes = attributes;
        }

        public abstract String getId();

        public abstract String getName();

        public abstract String getEmail();

        public abstract String getImageUrl();
    }

    private static class GoogleOAuth2UserInfo extends OAuth2UserInfo {
        public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
            super(attributes);
        }

        @Override
        public String getId() {
            return (String) attributes.get("sub");
        }

        @Override
        public String getName() {
            return (String) attributes.get("name");
        }

        @Override
        public String getEmail() {
            return (String) attributes.get("email");
        }

        @Override
        public String getImageUrl() {
            return (String) attributes.get("picture");
        }
    }

    private static class FacebookOAuth2UserInfo extends OAuth2UserInfo {
        public FacebookOAuth2UserInfo(Map<String, Object> attributes) {
            super(attributes);
        }

        @Override
        public String getId() {
            return (String) attributes.get("id");
        }

        @Override
        public String getName() {
            return (String) attributes.get("name");
        }

        @Override
        public String getEmail() {
            return (String) attributes.get("email");
        }

        @Override
        public String getImageUrl() {
            // Най-надеждният начин за получаване на Facebook снимка е чрез директен Graph
            // API URL с ID-то
            String facebookId = getId();
            if (facebookId != null && !facebookId.isEmpty()) {
                return "https://graph.facebook.com/" + facebookId + "/picture?type=large";
            }

            // Fallback: опит за извличане от атрибутите, ако случайно ID липсва
            try {
                if (attributes.containsKey("picture")) {
                    Object pictureAttribute = attributes.get("picture");
                    if (pictureAttribute instanceof Map) {
                        Map<?, ?> pictureObj = (Map<?, ?>) pictureAttribute;
                        if (pictureObj.containsKey("data")) {
                            Object dataAttribute = pictureObj.get("data");
                            if (dataAttribute instanceof Map) {
                                Map<?, ?> dataObj = (Map<?, ?>) dataAttribute;
                                if (dataObj.containsKey("url")) {
                                    return (String) dataObj.get("url");
                                }
                            }
                        }
                    } else if (pictureAttribute instanceof String) {
                        return (String) pictureAttribute;
                    }
                }
            } catch (Exception e) {
                // Ignore parsing errors
            }
            return null;
        }
    }
}

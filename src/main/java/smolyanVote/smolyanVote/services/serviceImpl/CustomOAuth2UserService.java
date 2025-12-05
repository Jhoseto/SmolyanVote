package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.AuthProvider;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;

import java.time.Instant;
import java.util.*;

/**
 * Custom OAuth2 User Service for handling OAuth2 authentication from Google and Facebook.
 * This service processes OAuth2 user information and creates or updates user accounts.
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        AuthProvider authProvider = getAuthProvider(registrationId);
        
        OAuth2UserInfo oAuth2UserInfo = getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());
        
        if (oAuth2UserInfo.getEmail() == null || oAuth2UserInfo.getEmail().isEmpty()) {
            throw new OAuth2AuthenticationException("Email не може да бъде празен");
        }

        // Нормализиране на email
        String normalizedEmail = oAuth2UserInfo.getEmail().toLowerCase().trim();
        
        Optional<UserEntity> userOptional = userRepository.findByEmail(normalizedEmail);
        UserEntity user;

        if (userOptional.isPresent()) {
            // Потребителят вече съществува
            user = userOptional.get();
            
            // Ако потребителят е регистриран с LOCAL auth provider, отказваме достъп
            if (user.getAuthProvider() == AuthProvider.LOCAL) {
                throw new OAuth2AuthenticationException(
                    "Този email адрес вече е регистриран с email и парола. Моля, влезте с вашия email и парола, а не с " + 
                    (authProvider == AuthProvider.GOOGLE ? "Google" : "Facebook") + "."
                );
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
        }

        // Обновяване на последно влизане и online статус
        user.setLastOnline(Instant.now());
        user.setOnlineStatus(1);
        userRepository.save(user);

        // Създаване на authorities
        Collection<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        // Връщане на OAuth2User с email като principal name
        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        attributes.put("email", normalizedEmail);
        attributes.put("id", user.getId());

        return new DefaultOAuth2User(authorities, attributes, "email");
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
     * Премахва специални символи и нормализира.
     */
    private String generateUsernameFromName(String name) {
        if (name == null || name.isEmpty()) {
            return "user";
        }
        
        // Премахване на специални символи и нормализиране
        String username = name.trim()
            .replaceAll("[^a-zA-Z0-9\\s]", "") // Премахване на специални символи
            .replaceAll("\\s+", "") // Премахване на интервали
            .toLowerCase();
        
        // Ограничаване на дължината
        if (username.length() > 30) {
            username = username.substring(0, 30);
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
            if (attributes.containsKey("picture")) {
                Map<String, Object> pictureObj = (Map<String, Object>) attributes.get("picture");
                if (pictureObj != null && pictureObj.containsKey("data")) {
                    Map<String, Object> dataObj = (Map<String, Object>) pictureObj.get("data");
                    if (dataObj != null) {
                        return (String) dataObj.get("url");
                    }
                }
            }
            return null;
        }
    }
}


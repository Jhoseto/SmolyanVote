package smolyanVote.smolyanVote.config.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.WebSocketMessageDto;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Базов клас за всички WebSocket handlers
 * Съдържа общата функционалност за authentication, session management и JSON serialization
 */
public abstract class BaseWebSocketHandler implements WebSocketHandler {

    protected final UserService userService;
    protected final ObjectMapper objectMapper;
    protected final CopyOnWriteArraySet<WebSocketSession> activeSessions;
    protected final ConcurrentHashMap<String, SessionInfo> sessionInfoMap;

    @Autowired
    public BaseWebSocketHandler(UserService userService) {
        this.userService = userService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule()); // За LocalDateTime сериализация
        this.activeSessions = new CopyOnWriteArraySet<>();
        this.sessionInfoMap = new ConcurrentHashMap<>();
    }

    // ===== ABSTRACT METHODS (трябва да се имплементират в наследниците) =====

    /**
     * Проверява дали потребителят има права за този WebSocket endpoint
     */
    protected abstract boolean hasPermission(WebSocketSession session);

    /**
     * Обработва текстови съобщения от клиента
     */
    protected abstract void handleTextMessage(WebSocketSession session, String message);

    /**
     * Връща името на handler-а за логове
     */
    protected abstract String getHandlerName();

    // ===== WEBSOCKET LIFECYCLE METHODS =====

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            // Проверяваме права
            if (!hasPermission(session)) {
                session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Access denied"));
                return;
            }

            // Добавяме сесията
            activeSessions.add(session);

            // Запазваме информация за сесията
            SessionInfo info = createSessionInfo(session);
            sessionInfoMap.put(session.getId(), info);

            System.out.println("✅ " + getHandlerName() + " connection established: " +
                    info.username + " (" + info.ipAddress + ")");

            // Изпращаме welcome съобщение
            sendWelcomeMessage(session);

        } catch (Exception e) {
            System.err.println("❌ Error establishing " + getHandlerName() + " connection: " + e.getMessage());
            try {
                session.close(CloseStatus.SERVER_ERROR.withReason("Connection error"));
            } catch (IOException closeException) {
                System.err.println("Failed to close errored session: " + closeException.getMessage());
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // Премахваме сесията
        activeSessions.remove(session);
        SessionInfo info = sessionInfoMap.remove(session.getId());

        String username = info != null ? info.username : "Unknown";
        System.out.println("❌ " + getHandlerName() + " connection closed: " + username +
                " (reason: " + status.getReason() + ")");
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        SessionInfo info = sessionInfoMap.get(session.getId());
        String username = info != null ? info.username : "Unknown";

        System.err.println("❌ Transport error in " + getHandlerName() + " for user " + username +
                ": " + exception.getMessage());

        // Премахваме проблемната сесия
        activeSessions.remove(session);
        sessionInfoMap.remove(session.getId());
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    // ===== SESSION MANAGEMENT =====

    /**
     * Създава SessionInfo за нова WebSocket връзка
     */
    protected SessionInfo createSessionInfo(WebSocketSession session) {
        SessionInfo info = new SessionInfo();
        info.sessionId = session.getId();
        info.connectedAt = LocalDateTime.now();
        info.lastActivity = LocalDateTime.now();

        // Извличаме потребителска информация
        UserEntity currentUser = getCurrentUser();
        if (currentUser != null) {
            info.userId = currentUser.getId();
            info.username = currentUser.getUsername();
            info.isAuthenticated = true;
        } else {
            info.username = "Anonymous";
            info.isAuthenticated = false;
        }

        // Извличаме IP адрес
        info.ipAddress = extractIpAddress(session);

        return info;
    }

    /**
     * Изпраща welcome съобщение към новоподключен клиент
     */
    protected void sendWelcomeMessage(WebSocketSession session) {
        SessionInfo info = sessionInfoMap.get(session.getId());

        WebSocketMessageDto welcome = new WebSocketMessageDto();
        welcome.setType("welcome");
        welcome.setMessage("Connected to " + getHandlerName());
        welcome.setTimestamp(LocalDateTime.now());

        // Добавяме session info
        if (info != null) {
            welcome.setData(Map.of(
                    "sessionId", info.sessionId,
                    "username", info.username,
                    "connectedAt", info.connectedAt
            ));
        }

        sendMessage(session, welcome);
    }

    // ===== AUTHENTICATION & SECURITY =====

    /**
     * Извлича текущия автентифициран потребител
     */
    protected UserEntity getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return null;
            }

            return userService.getCurrentUser();

        } catch (Exception e) {
            System.err.println("Error getting current user: " + e.getMessage());
            return null;
        }
    }

    /**
     * Проверява дали текущия потребител е админ
     */
    protected boolean isAdminUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return false;
            }

            return auth.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));

        } catch (Exception e) {
            System.err.println("Error checking admin role: " + e.getMessage());
            return false;
        }
    }

    /**
     * Извлича IP адрес от WebSocket сесия
     */
    protected String extractIpAddress(WebSocketSession session) {
        try {
            // Проверяваме за X-Forwarded-For header (proxy/load balancer)
            String xForwardedFor = (String) session.getAttributes().get("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }

            // Fallback към remote address
            return session.getRemoteAddress() != null ?
                    session.getRemoteAddress().getAddress().getHostAddress() : "unknown";

        } catch (Exception e) {
            System.err.println("Error extracting IP address: " + e.getMessage());
            return "unknown";
        }
    }

    // ===== MESSAGE SENDING =====

    /**
     * Изпраща съобщение към конкретна сесия
     */
    protected void sendMessage(WebSocketSession session, WebSocketMessageDto message) {
        if (session == null || !session.isOpen()) {
            return;
        }

        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(jsonMessage));

            // Обновяваме last activity
            SessionInfo info = sessionInfoMap.get(session.getId());
            if (info != null) {
                info.lastActivity = LocalDateTime.now();
            }

        } catch (Exception e) {
            System.err.println("Error sending message to session " + session.getId() + ": " + e.getMessage());
            // Премахваме неработещата сесия
            activeSessions.remove(session);
            sessionInfoMap.remove(session.getId());
        }
    }

    /**
     * Изпраща съобщение към всички активни сесии
     */
    protected void broadcastMessage(WebSocketMessageDto message) {
        if (activeSessions.isEmpty()) {
            return;
        }

        // Копираме сесиите за да избегнем ConcurrentModificationException
        var sessionsToSend = new java.util.ArrayList<>(activeSessions);

        for (WebSocketSession session : sessionsToSend) {
            sendMessage(session, message);
        }
    }

    /**
     * Изпраща error съобщение към сесия
     */
    protected void sendErrorMessage(WebSocketSession session, String errorMessage) {
        WebSocketMessageDto error = WebSocketMessageDto.error(errorMessage);
        sendMessage(session, error);
    }

    // ===== UTILITY METHODS =====

    /**
     * Връща броя на активните сесии
     */
    public int getActiveSessionsCount() {
        return activeSessions.size();
    }

    /**
     * Връща информация за всички сесии
     */
    public ConcurrentHashMap<String, SessionInfo> getSessionInfoMap() {
        return new ConcurrentHashMap<>(sessionInfoMap);
    }

    /**
     * Премахва неактивни сесии (повикава се периодично)
     */
    public void cleanupInactiveSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30); // 30 минути timeout

        var toRemove = sessionInfoMap.entrySet().stream()
                .filter(entry -> entry.getValue().lastActivity.isBefore(cutoff))
                .map(entry -> entry.getKey())
                .toList();

        for (String sessionId : toRemove) {
            sessionInfoMap.remove(sessionId);
            activeSessions.removeIf(session -> session.getId().equals(sessionId));
        }

        if (!toRemove.isEmpty()) {
            System.out.println("🧹 Cleaned up " + toRemove.size() + " inactive " + getHandlerName() + " sessions");
        }
    }

    // ===== INNER CLASS FOR SESSION INFO =====

    /**
     * Клас за съхранение на информация за WebSocket сесия
     */
    public static class SessionInfo {
        public String sessionId;
        public Long userId;
        public String username;
        public String ipAddress;
        public boolean isAuthenticated;
        public LocalDateTime connectedAt;
        public LocalDateTime lastActivity;

        @Override
        public String toString() {
            return "SessionInfo{" +
                    "sessionId='" + sessionId + '\'' +
                    ", username='" + username + '\'' +
                    ", isAuthenticated=" + isAuthenticated +
                    ", connectedAt=" + connectedAt +
                    '}';
        }
    }
}
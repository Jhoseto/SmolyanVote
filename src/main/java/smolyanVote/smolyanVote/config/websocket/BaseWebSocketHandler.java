package smolyanVote.smolyanVote.config.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.WebSocketMessageDto;

import java.io.IOException;
import java.time.LocalDateTime;
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
        this.objectMapper.findAndRegisterModules(); // За LocalDateTime сериализация
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
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        try {
            if (message instanceof TextMessage) {
                String payload = ((TextMessage) message).getPayload();
                handleTextMessage(session, payload);
            }
        } catch (Exception e) {
            System.err.println("❌ Error handling " + getHandlerName() + " message: " + e.getMessage());
            sendErrorMessage(session, "Message processing failed");
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("❌ " + getHandlerName() + " transport error for session " +
                session.getId() + ": " + exception.getMessage());

        // Почистваме сесията при грешка
        cleanupSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        SessionInfo info = sessionInfoMap.get(session.getId());
        String username = info != null ? info.username : "Unknown";

        System.out.println("🔌 " + getHandlerName() + " connection closed: " + username +
                " (Reason: " + closeStatus.getReason() + ")");

        cleanupSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false; // Не поддържаме частични съобщения
    }

    // ===== SESSION MANAGEMENT =====

    private SessionInfo createSessionInfo(WebSocketSession session) {
        SessionInfo info = new SessionInfo();
        info.sessionId = session.getId();
        info.connectedAt = LocalDateTime.now();
        info.username = getCurrentUsername();
        info.ipAddress = getClientIpAddress(session);
        info.userAgent = getUserAgent(session);
        return info;
    }

    private void cleanupSession(WebSocketSession session) {
        activeSessions.remove(session);
        sessionInfoMap.remove(session.getId());
    }

    // ===== AUTHENTICATION HELPERS =====

    protected UserEntity getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                return userService.getCurrentUser();
            }
        } catch (Exception e) {
            System.err.println("Error getting current user: " + e.getMessage());
        }
        return null;
    }

    protected String getCurrentUsername() {
        UserEntity user = getCurrentUser();
        return user != null ? user.getUsername() : "Anonymous";
    }

    protected boolean isAdminUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null && auth.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        } catch (Exception e) {
            return false;
        }
    }

    // ===== NETWORK HELPERS =====

    protected String getClientIpAddress(WebSocketSession session) {
        try {
            // Опитваме да извлечем IP от headers
            String xForwardedFor = (String) session.getAttributes().get("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }

            String xRealIp = (String) session.getAttributes().get("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }

            // Fallback към remote address
            return session.getRemoteAddress() != null ?
                    session.getRemoteAddress().getAddress().getHostAddress() : "Unknown";
        } catch (Exception e) {
            return "Unknown";
        }
    }

    protected String getUserAgent(WebSocketSession session) {
        try {
            return (String) session.getAttributes().get("User-Agent");
        } catch (Exception e) {
            return "Unknown";
        }
    }

    // ===== MESSAGE SENDING =====

    protected void sendMessage(WebSocketSession session, WebSocketMessageDto message) {
        try {
            if (session.isOpen()) {
                String json = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            System.err.println("❌ Failed to send message to session " + session.getId() + ": " + e.getMessage());
        }
    }

    protected void broadcastMessage(WebSocketMessageDto message) {
        String json;
        try {
            json = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            System.err.println("❌ Failed to serialize broadcast message: " + e.getMessage());
            return;
        }

        TextMessage textMessage = new TextMessage(json);
        activeSessions.removeIf(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(textMessage);
                    return false; // Keep session
                } else {
                    return true; // Remove closed session
                }
            } catch (IOException e) {
                System.err.println("❌ Failed to send broadcast to session " + session.getId());
                return true; // Remove failed session
            }
        });
    }

    private void sendWelcomeMessage(WebSocketSession session) {
        WebSocketMessageDto welcome = new WebSocketMessageDto();
        welcome.setType("welcome");
        welcome.setData("Connected to " + getHandlerName());
        welcome.setTimestamp(LocalDateTime.now());
        sendMessage(session, welcome);
    }

    private void sendErrorMessage(WebSocketSession session, String errorMessage) {
        WebSocketMessageDto error = new WebSocketMessageDto();
        error.setType("error");
        error.setData(errorMessage);
        error.setTimestamp(LocalDateTime.now());
        sendMessage(session, error);
    }

    // ===== GETTERS =====

    public int getActiveSessionsCount() {
        return activeSessions.size();
    }

    public ConcurrentHashMap<String, SessionInfo> getSessionInfoMap() {
        return new ConcurrentHashMap<>(sessionInfoMap);
    }

    // ===== SESSION INFO CLASS =====

    public static class SessionInfo {
        public String sessionId;
        public LocalDateTime connectedAt;
        public String username;
        public String ipAddress;
        public String userAgent;
    }
}
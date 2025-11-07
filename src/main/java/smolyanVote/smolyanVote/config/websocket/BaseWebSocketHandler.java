package smolyanVote.smolyanVote.config.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.WebSocketMessageDto;
import com.fasterxml.jackson.databind.DeserializationFeature;

import java.io.IOException;
import java.security.Principal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Base WebSocket Handler клас
 * Съдържа общата логика за всички WebSocket handlers
 */
public abstract class BaseWebSocketHandler implements WebSocketHandler {

    protected final ObjectMapper objectMapper = createObjectMapper();

    protected final UserService userService;

    // Thread-safe collections за управление на сесиите
    protected final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    protected final List<WebSocketSession> activeSessions = new CopyOnWriteArrayList<>();


    @Autowired
    public BaseWebSocketHandler(UserService userService) {
        this.userService = userService;

    }


    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules(); // Автоматично регистрира JavaTimeModule
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.configure(DeserializationFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE, false);
        return mapper;
    }

    // ===== ABSTRACT METHODS =====

    /**
     * Проверява дали потребителят има право да се свърже
     */
    protected abstract boolean hasPermission(WebSocketSession session);

    /**
     * Обработва текстови съобщения от клиента
     */
    protected abstract void handleTextMessage(WebSocketSession session, String message);

    /**
     * Връща името на handler-а за logging
     */
    protected abstract String getHandlerName();

    // ===== WEBSOCKET LIFECYCLE =====

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            // Проверяваме правата на потребителя
            if (!hasPermission(session)) {
                session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Access denied"));
                return;
            }

            // Добавяме сесията в активните
            sessions.put(session.getId(), session);
            activeSessions.add(session);

            // Изпращаме welcome съобщение
            sendWelcomeMessage(session);

        } catch (Exception e) {
            try {
                session.close(CloseStatus.SERVER_ERROR);
            } catch (Exception closeException) {
                // Ignore close exception
            }
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        try {
            if (message instanceof TextMessage) {
                String payload = ((TextMessage) message).getPayload();
                handleTextMessage(session, payload);
            } else {
                // Ignore non-text messages
            }
        } catch (Exception e) {
            sendErrorMessage(session, "Message processing failed");
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        // Премахваме сесията при грешка
        removeSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        removeSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    // ===== SESSION MANAGEMENT =====

    protected void removeSession(WebSocketSession session) {
        sessions.remove(session.getId());
        activeSessions.remove(session);
    }

    public int getActiveSessionsCount() {
        return activeSessions.size();
    }


    /**
     * Почиства неактивни сесии
     */
    public void cleanupInactiveSessions() {
        activeSessions.removeIf(session -> !session.isOpen());
        sessions.entrySet().removeIf(entry -> !entry.getValue().isOpen());
    }

    // ===== MESSAGE SENDING =====

    /**
     * Изпраща съобщение до конкретна сесия
     */
    protected void sendMessage(WebSocketSession session, Object message) {
        if (session == null || !session.isOpen()) {
            return;
        }

        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(jsonMessage));
        } catch (IOException e) {
            removeSession(session);
        }
    }

    /**
     * Изпраща съобщение до всички активни сесии
     */
    protected void broadcastMessage(Object message) {
        if (activeSessions.isEmpty()) {
            return;
        }

        String jsonMessage;
        try {
            jsonMessage = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            return;
        }

        TextMessage textMessage = new TextMessage(jsonMessage);

        // Изпращаме към всички сесии в отделни threads за performance
        activeSessions.parallelStream().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(textMessage);
                } else {
                    removeSession(session);
                }
            } catch (IOException e) {
                removeSession(session);
            }
        });
    }

    /**
     * Изпраща системно съобщение до всички сесии
     */
    public void broadcastSystemMessage(String message, String type) {
        WebSocketMessageDto systemMessage = new WebSocketMessageDto();
        systemMessage.setType("system_message");
        systemMessage.setData(Map.of(
                "message", message,
                "messageType", type,
                "timestamp", Instant.now()
        ));
        systemMessage.setTimestamp(LocalDateTime.now());

        broadcastMessage(systemMessage);
    }

    // ===== UTILITY METHODS =====

    protected void sendWelcomeMessage(WebSocketSession session) {
        WebSocketMessageDto welcome = new WebSocketMessageDto();
        welcome.setType("welcome");
        welcome.setData(Map.of(
                "message", "Connected to " + getHandlerName(),
                "sessionId", session.getId(),
                "timestamp", Instant.now()
        ));
        welcome.setTimestamp(LocalDateTime.now());

        sendMessage(session, welcome);
    }

    protected void sendErrorMessage(WebSocketSession session, String errorMessage) {
        WebSocketMessageDto error = new WebSocketMessageDto();
        error.setType("error");
        error.setData(Map.of(
                "error", errorMessage,
                "timestamp", Instant.now()
        ));
        error.setTimestamp(LocalDateTime.now());

        sendMessage(session, error);
    }

}
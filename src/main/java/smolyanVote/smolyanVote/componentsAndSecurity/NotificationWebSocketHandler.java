package smolyanVote.smolyanVote.componentsAndSecurity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.NotificationDTO;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler за real-time нотификации
 * И за tracking на online статус на всички logged users
 */
@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();
    private final UserService userService;
    private final UserRepository userRepository;

    @Autowired
    public NotificationWebSocketHandler(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
        mapper.findAndRegisterModules();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String username = getUsername(session);
        if (username != null) {
            sessions.put(username, session);
            System.out.println("✅ Notification WS connected: " + username);

            // ✅ ОБНОВИ ОНЛАЙН СТАТУС В DB
            updateUserOnlineStatus(username, true);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String username = getUsername(session);
        if (username != null) {
            sessions.remove(username);
            System.out.println("❌ Notification WS disconnected: " + username);

            // ✅ ОБНОВИ OFFLINE СТАТУС В DB
            updateUserOnlineStatus(username, false);
        }
    }

    /**
     * Изпраща нотификация към конкретен потребител (real-time)
     */
    public void sendToUser(String username, NotificationDTO notification) {
        WebSocketSession session = sessions.get(username);
        if (session != null && session.isOpen()) {
            try {
                String json = mapper.writeValueAsString(notification);
                session.sendMessage(new TextMessage(json));
            } catch (Exception e) {
                System.err.println("Failed to send notification: " + e.getMessage());
            }
        }
    }

    /**
     * Обновява онлайн статуса на user в базата данни
     */
    private void updateUserOnlineStatus(String username, boolean isOnline) {
        try {
            UserEntity user = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByEmail(username).orElse(null));

            if (user != null) {
                user.setOnlineStatus(isOnline ? 1 : 0);
                user.setLastOnline(Instant.now());
                userRepository.save(user);

                System.out.println("✅ User " + username + " set to " +
                        (isOnline ? "ONLINE" : "OFFLINE") + " in DB");
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to update online status for " + username + ": " + e.getMessage());
        }
    }

    private String getUsername(WebSocketSession session) {
        try {
            Principal principal = session.getPrincipal();
            if (principal != null) {
                return principal.getName();
            }
        } catch (Exception e) {
            System.err.println("Error getting username from session: " + e.getMessage());
        }
        return null;
    }
}
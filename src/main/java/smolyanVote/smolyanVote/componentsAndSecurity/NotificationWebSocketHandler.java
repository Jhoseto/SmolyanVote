package smolyanVote.smolyanVote.componentsAndSecurity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.NotificationDTO;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Минимален WebSocket handler за real-time нотификации
 * Една връзка per потребител
 */
@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();
    private final UserService userService;

    @Autowired
    public NotificationWebSocketHandler(UserService userService) {
        this.userService = userService;
        mapper.findAndRegisterModules();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String username = getUsername(session);
        if (username != null) {
            sessions.put(username, session);
            System.out.println("✅ Notification WS connected: " + username);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String username = getUsername(session);
        if (username != null) {
            sessions.remove(username);
            System.out.println("❌ Notification WS disconnected: " + username);
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

    private String getUsername(WebSocketSession session) {
        try {
            return userService.getCurrentUser().getUsername();
        } catch (Exception e) {
            return null;
        }
    }
}
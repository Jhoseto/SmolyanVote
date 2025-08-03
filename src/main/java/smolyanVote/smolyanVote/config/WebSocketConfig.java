package smolyanVote.smolyanVote.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import smolyanVote.smolyanVote.config.websocket.ActivityWebSocketHandler;

/**
 * WebSocket конфигурация за real-time комуникация
 * Управлява всички WebSocket endpoints в системата
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ActivityWebSocketHandler activityWebSocketHandler;

    @Autowired
    public WebSocketConfig(ActivityWebSocketHandler activityWebSocketHandler) {
        this.activityWebSocketHandler = activityWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

        // ===== ADMIN ACTIVITY WALL =====
        registry.addHandler(activityWebSocketHandler, "/ws/admin/activity")
                .setAllowedOrigins("*") // За development - в production настрой домейните
                .withSockJS(); // Fallback за браузъри без WebSocket поддръжка

        // ===== БЪДЕЩИ ENDPOINTS =====
        // registry.addHandler(notificationWebSocketHandler, "/ws/user/notifications")
        //         .setAllowedOrigins("*")
        //         .withSockJS();

        // registry.addHandler(chatWebSocketHandler, "/ws/chat")
        //         .setAllowedOrigins("*")
        //         .withSockJS();

        System.out.println("✅ WebSocket endpoints registered:");
        System.out.println("   - /ws/admin/activity (Activity Wall)");
    }
}
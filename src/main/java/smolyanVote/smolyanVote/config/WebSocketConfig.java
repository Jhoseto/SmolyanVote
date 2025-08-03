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

        // ===== ADMIN ACTIVITY WALL - FIXED =====
        registry.addHandler(activityWebSocketHandler, "/ws/admin/activity")
                .setAllowedOriginPatterns("*") // FIXED: използва patterns вместо origins
                .withSockJS(); // Fallback за браузъри без WebSocket поддръжка

        // Alternative endpoint без SockJS за директна WebSocket връзка
        registry.addHandler(activityWebSocketHandler, "/ws/admin/activity-direct")
                .setAllowedOriginPatterns("*");

        // ===== БЪДЕЩИ ENDPOINTS =====
        // registry.addHandler(notificationWebSocketHandler, "/ws/user/notifications")
        //         .setAllowedOriginPatterns("*")
        //         .withSockJS();

        // registry.addHandler(chatWebSocketHandler, "/ws/chat")
        //         .setAllowedOriginPatterns("*")
        //         .withSockJS();

        System.out.println("✅ WebSocket endpoints registered:");
        System.out.println("   - /ws/admin/activity (Activity Wall with SockJS)");
        System.out.println("   - /ws/admin/activity-direct (Activity Wall direct)");
    }
}
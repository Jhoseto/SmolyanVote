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

        // Environment-aware origins
        String[] allowedOrigins = getAllowedOrigins();

        // ===== ADMIN ACTIVITY WALL - SECURE =====
        registry.addHandler(activityWebSocketHandler, "/ws/admin/activity")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS(); // Fallback за браузъри без WebSocket поддръжка

        // Alternative endpoint без SockJS
        registry.addHandler(activityWebSocketHandler, "/ws/admin/activity-direct")
                .setAllowedOriginPatterns(allowedOrigins);

        System.out.println("✅ WebSocket endpoints registered:");
        System.out.println("   - /ws/admin/activity (Activity Wall with SockJS)");
        System.out.println("   - /ws/admin/activity-direct (Activity Wall direct)");
        System.out.println("   - Allowed origins: " + String.join(", ", allowedOrigins));
    }

    /**
     * Връща разрешените origins въз основа на environment
     */
    private String[] getAllowedOrigins() {
        String profile = System.getProperty("spring.profiles.active", "dev");

        if (profile.contains("dev") || profile.contains("local")) {
            // Development environment - само localhost
            return new String[]{
                    "http://localhost:2662",
                    "http://127.0.0.1:2662",
                    "ws://localhost:2662",
                    "wss://localhost:2662"
            };
        } else {
            // Production environment - само production домейни
            return new String[]{
                    "https://smolyanvote.com",
                    "https://www.smolyanvote.com",
                    "wss://smolyanvote.com",
                    "wss://www.smolyanvote.com"
            };
        }
    }
}
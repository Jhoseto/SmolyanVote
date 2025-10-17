package smolyanVote.smolyanVote.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import smolyanVote.smolyanVote.componentsAndSecurity.NotificationWebSocketHandler;
import smolyanVote.smolyanVote.config.websocket.ActivityWebSocketHandler;

/**
 * WebSocket конфигурация за real-time комуникация
 * Управлява всички WebSocket endpoints в системата
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ActivityWebSocketHandler activityWebSocketHandler;
    private final Environment environment;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    @Autowired
    public WebSocketConfig(ActivityWebSocketHandler activityWebSocketHandler,
                           Environment environment,
                           NotificationWebSocketHandler notificationWebSocketHandler) {
        this.activityWebSocketHandler = activityWebSocketHandler;
        this.environment = environment;
        this.notificationWebSocketHandler = notificationWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] allowedOrigins = getAllowedOrigins();

        registry.addHandler(activityWebSocketHandler, "/ws/admin/activity")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();

        // ⭐ NEW: Notification handler за всички потребители
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();
    }

    /**
     * Връща разрешените origins въз основа на environment
     */
    private String[] getAllowedOrigins() {
        // ПРАВИЛЕН НАЧИН - използваме Spring Environment
        String[] activeProfiles = environment.getActiveProfiles();
        String profileStr = activeProfiles.length > 0 ? String.join(",", activeProfiles) : "default";


        if (profileStr.contains("dev") || profileStr.contains("local") || profileStr.equals("default")) {
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
package smolyanVote.smolyanVote.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import smolyanVote.smolyanVote.componentsAndSecurity.NotificationWebSocketHandler;
import smolyanVote.smolyanVote.config.websocket.ActivityWebSocketHandler;
import smolyanVote.smolyanVote.config.websocket.JwtWebSocketInterceptor;
import smolyanVote.smolyanVote.config.websocket.WebSocketHandshakeInterceptor;

/**
 * Unified WebSocket конфигурация за real-time комуникация
 * Управлява всички WebSocket endpoints в системата:
 * - SVMessenger (STOMP)
 * - Notifications (SockJS)
 * - Activity monitoring (SockJS)
 */
@Configuration
@EnableWebSocket
@EnableWebSocketMessageBroker
@Slf4j
public class WebSocketConfig implements WebSocketConfigurer, WebSocketMessageBrokerConfigurer {

    private final ActivityWebSocketHandler activityWebSocketHandler;
    private final Environment environment;
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final JwtWebSocketInterceptor jwtWebSocketInterceptor;
    private final WebSocketHandshakeInterceptor webSocketHandshakeInterceptor;

    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    public WebSocketConfig(ActivityWebSocketHandler activityWebSocketHandler,
                           Environment environment,
                           NotificationWebSocketHandler notificationWebSocketHandler,
                           JwtWebSocketInterceptor jwtWebSocketInterceptor,
                           WebSocketHandshakeInterceptor webSocketHandshakeInterceptor) {
        this.activityWebSocketHandler = activityWebSocketHandler;
        this.environment = environment;
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.jwtWebSocketInterceptor = jwtWebSocketInterceptor;
        this.webSocketHandshakeInterceptor = webSocketHandshakeInterceptor;
    }

    // ========== SOCKJS HANDLERS (WebSocketConfigurer) ==========
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

    // ========== STOMP MESSAGE BROKER (WebSocketMessageBrokerConfigurer) ==========
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable простък in-memory broker за broadcast съобщения
        // /topic - за broadcast към всички subscribed users
        // /queue - за private съобщения към конкретен user
        registry.enableSimpleBroker("/topic", "/queue");

        // Application destination prefix
        // Client ще изпраща към /app/svmessenger/...
        registry.setApplicationDestinationPrefixes("/app");

        // User destination prefix
        // За private съобщения: /user/{userId}/queue/...
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Конфигуриране на channel interceptors за JWT authentication
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Добавяне на JWT interceptor за WebSocket connections
        registration.interceptors(jwtWebSocketInterceptor);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoint за SVMessenger
        // Client ще се connectva към: ws://localhost:2662/ws-svmessenger

        // Development: allow localhost, Production: only production domains
        String[] allowedOrigins;
        if ("dev".equals(activeProfile) || "development".equals(activeProfile)) {
            allowedOrigins = new String[]{
                    "https://smolyanvote.com",
                    "https://www.smolyanvote.com",
                    "http://localhost:*",
                    "http://127.0.0.1:*",
                    "ws://localhost:*",
                    "ws://127.0.0.1:*",
                    "http://10.0.2.2:*", // Android Emulator HTTP
                    "ws://10.0.2.2:*",   // Android Emulator WebSocket
                    "*"                  // Allow all origins for mobile apps (origin is null for React Native)
            };
        } else {
            allowedOrigins = new String[]{
                    "https://smolyanvote.com",
                    "https://www.smolyanvote.com",
                    "wss://smolyanvote.com",
                    "wss://www.smolyanvote.com"
            };
        }

        // РЕШЕНИЕ: ДВА endpoint-а - един за SockJS (web) и един за plain WebSocket (mobile)
        // Mobile clients използват plain WebSocket за да се избегнат проблеми с SockJS headers
        log.info("🔌 Registering universal SockJS STOMP endpoint for all clients");
        log.info("🔌 Active profile: {}", activeProfile);
        log.info("🔌 Allowed origins: {}", java.util.Arrays.toString(allowedOrigins));

        // Universal SockJS endpoint за всички clients
        // SockJS автоматично предоставя WebSocket fallbacks и работи с React Native
        registry.addEndpoint("/ws-svmessenger")
                .setAllowedOriginPatterns(allowedOrigins)
                .addInterceptors(webSocketHandshakeInterceptor)
                .withSockJS();

        log.info("✅ Universal SockJS STOMP endpoint registered: /ws-svmessenger");
    }

    /**
     * Връща разрешените origins въз основа на environment
     */
    private String[] getAllowedOrigins() {
        // ПРАВИЛЕН НАЧИН - използваме Spring Environment
        String[] activeProfiles = environment.getActiveProfiles();
        String profileStr = activeProfiles.length > 0 ? String.join(",", activeProfiles) : "default";


        if (profileStr.contains("dev") || profileStr.contains("local") || profileStr.equals("default")) {
            // Development environment - localhost и Android emulator
            return new String[]{
                    "https://smolyanvote.com",
                    "https://www.smolyanvote.com",
                    "http://localhost:*",
                    "http://127.0.0.1:*",
                    "ws://localhost:*",
                    "ws://127.0.0.1:*",
                    "http://10.0.2.2:*", // Android Emulator HTTP
                    "ws://10.0.2.2:*",   // Android Emulator WebSocket
                    "*"                   // Allow all origins for mobile apps (origin is null for React Native)
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
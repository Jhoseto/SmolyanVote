package smolyanVote.smolyanVote.websocket.svmessenger;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket конфигурация за SVMessenger
 * Използва STOMP протокол over WebSocket
 */
@Configuration
@EnableWebSocketMessageBroker
public class SVMessengerWebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Value("${spring.profiles.active:prod}")
    private String activeProfile;
    
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
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoint
        // Client ще се connectva към: ws://localhost:2662/ws-svmessenger
        
        // Development: allow localhost, Production: only production domains
        if ("dev".equals(activeProfile) || "development".equals(activeProfile)) {
            registry.addEndpoint("/ws-svmessenger")
                    .setAllowedOriginPatterns(
                            "https://smolyanvote.com", 
                            "https://www.smolyanvote.com",
                            "http://localhost:*",
                            "http://127.0.0.1:*"
                    )
                    .withSockJS();
        } else {
            registry.addEndpoint("/ws-svmessenger")
                    .setAllowedOriginPatterns(
                            "https://smolyanvote.com", 
                            "https://www.smolyanvote.com"
                    )
                    .withSockJS();
        }
    }
    
    /**
     * WebSocket Channels структура:
     * 
     * CLIENT -> SERVER:
     * - /app/svmessenger/send           → Изпращане на съобщение
     * - /app/svmessenger/typing         → Update на typing status
     * 
     * SERVER -> CLIENT:
     * - /user/queue/svmessenger-messages     → Private съобщения
     * - /user/queue/svmessenger-read-receipts → Read receipts
     * - /topic/svmessenger-typing/{convId}   → Typing indicators
     * - /topic/svmessenger-online-status     → Online/Offline updates
     */
}


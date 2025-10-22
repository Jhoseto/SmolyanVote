package smolyanVote.smolyanVote.websocket.svmessenger;

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
        registry.addEndpoint("/ws-svmessenger")
                .setAllowedOriginPatterns("*")  // За development; в production: конкретни домейни
                .withSockJS();  // Fallback на SockJS ако WebSocket не работи
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

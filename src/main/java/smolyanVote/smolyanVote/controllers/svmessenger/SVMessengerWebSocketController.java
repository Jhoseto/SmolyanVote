package smolyanVote.smolyanVote.controllers.svmessenger;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.SVMessengerService;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVMessageDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVSendMessageRequest;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVTypingStatusDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallSignalDTO;
import smolyanVote.smolyanVote.websocket.svmessenger.SVMessengerWebSocketHandler;

import java.security.Principal;
import java.time.Instant;

/**
 * WebSocket Controller за SVMessenger
 * Обработва STOMP съобщения от clients
 */
@Controller
@Slf4j
public class SVMessengerWebSocketController {
    
    private final SVMessengerService messengerService;
    private final SVMessengerWebSocketHandler wsHandler;
    private final UserRepository userRepository;
    
    public SVMessengerWebSocketController(
            SVMessengerService messengerService,
            SVMessengerWebSocketHandler wsHandler,
            UserRepository userRepository) {
        this.messengerService = messengerService;
        this.wsHandler = wsHandler;
        this.userRepository = userRepository;
    }
    
    // ========== MESSAGE SENDING ==========
    
    /**
     * Client изпраща съобщение
     * Endpoint: /app/svmessenger/send
     * 
     * Client изпраща: { "conversationId": 1, "text": "Hello!" }
     */
    @MessageMapping("/svmessenger/send")
    public void sendMessage(@Payload SVSendMessageRequest request, Principal principal) {
        
        try {
            // Вземи current user
            UserEntity sender = getUserFromPrincipal(principal);
            
            // Изпрати съобщението (през service)
            SVMessageDTO message = messengerService.sendMessage(
                    request.getConversationId(),
                    request.getText(),
                    sender
            );
            
            
        } catch (Exception e) {
            log.error("Error sending message via WebSocket", e);
        }
    }
    
    // ========== TYPING STATUS ==========
    
    /**
     * Client съобщава че пише
     * Endpoint: /app/svmessenger/typing
     * 
     * Client изпраща: { "conversationId": 1, "isTyping": true }
     */
    @MessageMapping("/svmessenger/typing")
    public void updateTypingStatus(@Payload SVTypingStatusDTO status, Principal principal) {
        
        try {
            // Вземи current user
            UserEntity user = getUserFromPrincipal(principal);
            
            // Update typing status (през service)
            messengerService.updateTypingStatus(
                    status.getConversationId(),
                    user,
                    status.getIsTyping()
            );
            
        } catch (Exception e) {
            log.error("Error updating typing status via WebSocket", e);
        }
    }

    /**
     * Client маркира разговор като прочетен през WebSocket (по-бърз от REST)
     * Endpoint: /app/svmessenger/mark-read
     * Client изпраща: { "conversationId": 1 }
     */
    @MessageMapping("/svmessenger/mark-read")
    public void markConversationAsReadWS(@Payload SVTypingStatusDTO readReq, Principal principal) {
        // Използваме SVTypingStatusDTO само за да пренесем conversationId (isTyping не се използва)
        try {
            UserEntity currentUser = getUserFromPrincipal(principal);
            Long conversationId = readReq.getConversationId();
            messengerService.markAllAsRead(conversationId, currentUser);
        } catch (Exception e) {
            log.error("Error marking conversation as read via WebSocket", e);
        }
    }

    // ========== VOICE CALLS ==========

    /**
     * Client изпраща call signal
     * Endpoint: /app/svmessenger/call-signal
     *
     * Client изпраща: { "eventType": "CALL_REQUEST", "conversationId": 1, "callerId": 5, "receiverId": 10 }
     */
    @MessageMapping("/svmessenger/call-signal")
    public void handleCallSignal(@Payload SVCallSignalDTO signal, Principal principal) {

        try {
            // Вземи current user за валидация
            UserEntity sender = getUserFromPrincipal(principal);

            // Валидирай че sender е caller или receiver
            if (!sender.getId().equals(signal.getCallerId()) && !sender.getId().equals(signal.getReceiverId())) {
                log.warn("Unauthorized call signal attempt by user {}", sender.getId());
                return;
            }

            // Forward signal към другия user
            Long recipientUserId = sender.getId().equals(signal.getCallerId()) ?
                    signal.getReceiverId() : signal.getCallerId();

            wsHandler.sendCallSignal(recipientUserId, signal);

        } catch (Exception e) {
            log.error("Error handling call signal via WebSocket", e);
        }
    }
    
    // ========== CONNECTION EVENTS ==========
    
    /**
     * WebSocket connection established
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());


        try {
            // Извади user info от session
            Principal principal = headerAccessor.getUser();
            if (principal != null) {
                UserEntity user = getUserFromPrincipal(principal);

                // ✅ ПЪРВО: Обнови онлайн статуса в базата данни
                user.setOnlineStatus(1);
                user.setLastOnline(Instant.now());
                userRepository.save(user);

                // ✅ СЛЕД ТОВА: Broadcast че е онлайн
                wsHandler.broadcastOnlineStatus(user.getId(), true);

            }
        } catch (Exception e) {
            log.error("Error handling WebSocket connect", e);
        }
    }
    
    /**
     * WebSocket connection closed
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());


        try {
            // Извади user info от session
            Principal principal = headerAccessor.getUser();
            if (principal != null) {
                UserEntity user = getUserFromPrincipal(principal);

                // ✅ ПЪРВО: Обнови офлайн статуса в базата данни
                user.setOnlineStatus(0);
                user.setLastOnline(Instant.now());
                userRepository.save(user);

                // ✅ СЛЕД ТОВА: Broadcast че е офлайн
                wsHandler.broadcastOnlineStatus(user.getId(), false);

            }
        } catch (Exception e) {
            log.error("Error handling WebSocket disconnect", e);
        }
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * Извлича UserEntity от Principal
     */
    private UserEntity getUserFromPrincipal(Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }
        
        String identifier = principal.getName();
        
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new IllegalStateException("User not found: " + identifier));
    }
}

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
import smolyanVote.smolyanVote.services.interfaces.MobilePushNotificationService;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVSendMessageRequest;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVTypingStatusDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallSignalDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType;
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
    private final MobilePushNotificationService pushNotificationService;
    
    public SVMessengerWebSocketController(
            SVMessengerService messengerService,
            SVMessengerWebSocketHandler wsHandler,
            UserRepository userRepository,
            MobilePushNotificationService pushNotificationService) {
        this.messengerService = messengerService;
        this.wsHandler = wsHandler;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
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
            // Message се изпраща автоматично от service към получателя
            ((smolyanVote.smolyanVote.services.serviceImpl.SVMessengerServiceImpl) messengerService)
                    .sendMessage(
                            request.getConversationId(),
                            request.getText(),
                            sender,
                            request.getParentMessageId()
                    );
            
            log.debug("Message sent via WebSocket: conversationId={}, senderId={}", 
                    request.getConversationId(), sender.getId());
            
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
            
            if (user == null) {
                log.warn("Cannot update typing status: user not found from principal");
                return;
            }
            
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
            
            if (currentUser == null) {
                log.warn("Cannot mark conversation as read: user not found from principal");
                return;
            }
            
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
            UserEntity sender = getUserFromPrincipal(principal);

            if (sender == null) {
                log.warn("Cannot handle call signal: user not found from principal");
                return;
            }

            if (!sender.getId().equals(signal.getCallerId()) && !sender.getId().equals(signal.getReceiverId())) {
                log.warn("Unauthorized call signal attempt by user {}", sender.getId());
                return;
            }

            // Forward signal към другия user
            Long recipientUserId = sender.getId().equals(signal.getCallerId())
                    ? signal.getReceiverId()
                    : signal.getCallerId();

            // Вземи recipient user за да извлечем principal name
            UserEntity recipient = userRepository.findById(recipientUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));

            String recipientPrincipal = recipient.getEmail() != null && !recipient.getEmail().isBlank()
                    ? recipient.getEmail().toLowerCase()
                    : recipient.getUsername().toLowerCase();

            log.info("Forwarding call signal from {} to {} (principal: {})", sender.getId(), recipientUserId, recipientPrincipal);

            // Изпращане на WebSocket signal
            wsHandler.sendCallSignal(recipientPrincipal, signal);

            // ✅ Изпращане на push notification за CALL_REQUEST (ако recipient е offline или в background)
            if (signal.getEventType() == SVCallEventType.CALL_REQUEST) {
                try {
                    String callerName = sender.getRealName() != null && !sender.getRealName().isBlank()
                            ? sender.getRealName()
                            : sender.getUsername();
                    pushNotificationService.sendIncomingCallNotification(
                            recipientUserId,
                            callerName,
                            signal.getConversationId()
                    );
                    log.info("✅ Push notification sent for incoming call to user: {}", recipientUserId);
                } catch (Exception pushError) {
                    log.error("❌ Failed to send push notification for incoming call: {}", pushError.getMessage());
                    // Не прекъсваме WebSocket signal-а дори ако push notification fail-не
                }
            }

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

        log.info("🔌 WebSocket connection established - Session ID: {}", headerAccessor.getSessionId());

        try {
            // Извади user info от session
            Principal principal = headerAccessor.getUser();
            
            if (principal == null) {
                log.warn("⚠️ WebSocket connected but Principal is NULL - JWT authentication may have failed");
                log.warn("⚠️ Session ID: {}, Headers: {}", headerAccessor.getSessionId(), headerAccessor.toMap());
                return;
            }
            
            log.info("✅ WebSocket Principal found: {}", principal.getName());
            
            UserEntity user = getUserFromPrincipal(principal);
            
            if (user == null) {
                log.warn("⚠️ WebSocket connected but UserEntity is NULL for principal: {}", principal.getName());
                return;
            }
            
            log.info("✅ WebSocket UserEntity found: ID={}, Email={}", user.getId(), user.getEmail());
            
            // ✅ ПЪРВО: Обнови онлайн статуса в базата данни
            Integer oldStatus = user.getOnlineStatus();
            user.setOnlineStatus(1);
            user.setLastOnline(Instant.now());
            userRepository.save(user);
            
            log.info("✅ Online status updated in database: User ID={}, Old Status={}, New Status=1", 
                    user.getId(), oldStatus != null ? oldStatus : 0);

            // ✅ СЛЕД ТОВА: Broadcast че е онлайн
            wsHandler.broadcastOnlineStatus(user.getId(), true);
            log.info("✅ Online status broadcasted: User ID={}, Status=ONLINE", user.getId());
            
        } catch (IllegalStateException e) {
            // Потребителят не е намерен - вероятно е излязъл или сесията е изтекла
            log.warn("⚠️ User not found during WebSocket connect (likely logged out): {}", e.getMessage());
            log.warn("⚠️ Session ID: {}", headerAccessor.getSessionId());
        } catch (Exception e) {
            log.error("❌ Error handling WebSocket connect", e);
            log.error("❌ Session ID: {}, Principal: {}", 
                    headerAccessor.getSessionId(), 
                    headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : "NULL");
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
                log.info("WebSocket disconnected - Principal name: {}", principal.getName());
                UserEntity user = getUserFromPrincipal(principal);
                
                if (user != null) {
                    log.info("WebSocket disconnected - User ID: {}, Email: {}", user.getId(), user.getEmail());
                    
                    // ✅ ПЪРВО: Обнови офлайн статуса в базата данни
                    user.setOnlineStatus(0);
                    user.setLastOnline(Instant.now());
                    userRepository.save(user);

                    // ✅ СЛЕД ТОВА: Broadcast че е офлайн
                    log.info("Broadcasting offline status for user ID: {}", user.getId());
                    wsHandler.broadcastOnlineStatus(user.getId(), false);
                } else {
                    log.warn("WebSocket disconnected but user not found for principal: {}", principal.getName());
                }
            } else {
                // Principal може да липсва при някои нормални случаи (например connection timeout, network issues)
                // Това не е грешка, затова логваме на debug ниво
                log.debug("WebSocket disconnected but no principal found (likely connection timeout or network issue)");
            }
        } catch (IllegalStateException e) {
            // Потребителят не е намерен - вероятно е излязъл или сесията е изтекла
            // Това е нормално при logout, затова само логваме на debug ниво
            log.debug("User not found during WebSocket disconnect (likely logged out): {}", e.getMessage());
        } catch (Exception e) {
            log.error("Error handling WebSocket disconnect", e);
        }
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * Извлича UserEntity от Principal
     * Works with JWT authentication (UserEntity Principal), traditional authentication, and OAuth2 authentication.
     * Returns null if user cannot be found (e.g., after logout).
     */
    private UserEntity getUserFromPrincipal(Principal principal) {
        if (principal == null) {
            return null;
        }
        
        try {
            // Проверка дали Principal е UserPrincipal (от JWT WebSocket interceptor)
            if (principal instanceof smolyanVote.smolyanVote.config.websocket.UserPrincipal) {
                return ((smolyanVote.smolyanVote.config.websocket.UserPrincipal) principal).getUser();
            }
            
            // Проверка дали Principal е вече UserEntity (от JWT filter)
            if (principal instanceof UserEntity) {
                return (UserEntity) principal;
            }
            
            String identifier = null;
            
            // Проверка за OAuth2User (Google/Facebook login)
            if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
                org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = 
                    (org.springframework.security.oauth2.core.user.OAuth2User) principal;
                // За OAuth2, извличаме email от атрибутите
                identifier = oAuth2User.getAttribute("email");
            } else {
                // За традиционна автентикация, използваме getName() (което е email)
                identifier = principal.getName();
            }
            
            if (identifier == null || identifier.isEmpty()) {
                log.debug("User identifier not found in principal");
                return null;
            }
            
            // Нормализиране на email на малки букви
            String normalizedIdentifier = identifier.toLowerCase().trim();
            
            // Ако identifier изглежда като OAuth2 ID (дълъг числов string без @), 
            // това означава че Principal все още съдържа OAuth2 ID, но потребителят вече не е наличен
            // (вероятно е излязъл). В този случай просто връщаме null.
            if (normalizedIdentifier.matches("^\\d+$") && normalizedIdentifier.length() > 15) {
                // Вероятно е OAuth2 ID (sub от Google) - потребителят вече не е наличен след logout
                log.debug("Principal contains OAuth2 ID instead of email, user likely logged out: {}", normalizedIdentifier);
                return null;
            }
            
            return userRepository.findByEmail(normalizedIdentifier)
                    .or(() -> userRepository.findByUsername(normalizedIdentifier))
                    .orElse(null);
        } catch (Exception e) {
            log.debug("Error extracting user from principal: {}", e.getMessage());
            return null;
        }
    }
}

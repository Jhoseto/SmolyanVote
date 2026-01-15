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
                            request.getParentMessageId());

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
                log.error("Cannot update typing status: user not found from principal");
                return;
            }

            // Update typing status (през service)
            messengerService.updateTypingStatus(
                    status.getConversationId(),
                    user,
                    status.getIsTyping());

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
        // Използваме SVTypingStatusDTO само за да пренесем conversationId (isTyping не
        // се използва)
        try {
            UserEntity currentUser = getUserFromPrincipal(principal);

            if (currentUser == null) {
                log.error("Cannot mark conversation as read: user not found from principal");
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
     * Client изпраща: { "eventType": "CALL_REQUEST", "conversationId": 1,
     * "callerId": 5, "receiverId": 10 }
     */
    @MessageMapping("/svmessenger/call-signal")
    public void handleCallSignal(@Payload SVCallSignalDTO signal, Principal principal) {

        try {
            log.debug("📞 [WebSocketController] Received call signal: type={}, conversationId={}",
                    signal.getEventType(), signal.getConversationId());

            UserEntity sender = getUserFromPrincipal(principal);

            if (sender == null) {
                log.error("Cannot handle call signal: user not found from principal");
                return;
            }

            if (!sender.getId().equals(signal.getCallerId()) && !sender.getId().equals(signal.getReceiverId())) {
                log.error("Unauthorized call signal attempt by user {}", sender.getId());
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

            // Изпращане на WebSocket signal
            wsHandler.sendCallSignal(recipientPrincipal, signal);

            // ✅ Изпращане на push notification за CALL_REQUEST (ако recipient е offline или
            // в background)
            if (signal.getEventType() == SVCallEventType.CALL_REQUEST) {
                try {
                    String callerName = sender.getRealName() != null && !sender.getRealName().isBlank()
                            ? sender.getRealName()
                            : sender.getUsername();
                    // CRITICAL: Изпращаме participantId и callerImageUrl за правилно показване на
                    // call UI
                    // participantId се използва за accept/reject call actions
                    // callerImageUrl се използва за показване на аватар в IncomingCallActivity
                    Long participantId = sender.getId();
                    String callerImageUrl = sender.getImageUrl();
                    pushNotificationService.sendIncomingCallNotification(
                            recipientUserId,
                            callerName,
                            signal.getConversationId(),
                            participantId,
                            callerImageUrl);
                } catch (Exception pushError) {
                    log.error("❌ Failed to send push notification for incoming call: {}", pushError.getMessage());
                    // Не прекъсваме WebSocket signal-а дори ако push notification fail-не
                }
            }

            // ✅ CRITICAL: Handle call signal for history (save to database)
            // IMPORTANT: Only save call history when the signal is sent by the user who
            // initiated the action
            // For CALL_END: Only save when sent by the user who pressed "end call" (not
            // when forwarded to the other participant)
            // For CALL_REJECT: Only save when sent by the user who rejected the call
            // This prevents duplicate entries when both participants send signals
            if (signal.getEventType() == SVCallEventType.CALL_END
                    || signal.getEventType() == SVCallEventType.CALL_REJECT ||
                    signal.getEventType() == SVCallEventType.CALL_ENDED
                    || signal.getEventType() == SVCallEventType.CALL_REJECTED ||
                    signal.getEventType() == SVCallEventType.CALL_CANCEL) {
                // CRITICAL: Only save call history if the sender is the one who initiated the
                // action
                // For CALL_END: sender must be either caller or receiver (whoever pressed "end
                // call")
                // For CALL_REJECT: sender must be the receiver (who rejected the call)
                // For CALL_CANCEL: sender must be the caller (who cancelled the call)
                boolean shouldSaveHistory = false;
                if (signal.getEventType() == SVCallEventType.CALL_END
                        || signal.getEventType() == SVCallEventType.CALL_ENDED) {
                    // For CALL_END, save history only if sender is the one who sent the signal (not
                    // forwarded)
                    // The signal is sent by the user who pressed "end call", so we save it
                    shouldSaveHistory = true;
                } else if (signal.getEventType() == SVCallEventType.CALL_REJECT
                        || signal.getEventType() == SVCallEventType.CALL_REJECTED) {
                    // For CALL_REJECT, save history only if sender is the receiver (who rejected)
                    shouldSaveHistory = sender.getId().equals(signal.getReceiverId());
                } else if (signal.getEventType() == SVCallEventType.CALL_CANCEL) {
                    // For CALL_CANCEL, save history only if sender is the caller (who cancelled)
                    shouldSaveHistory = sender.getId().equals(signal.getCallerId());
                }

                if (shouldSaveHistory) {
                    messengerService.handleCallSignalForHistory(signal);
                }
            } else {
                // For other signal types (CALL_REQUEST, CALL_ACCEPT, etc.), don't save call
                // history
                // Call history is only saved for CALL_END and CALL_REJECT
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

        try {
            // Извади user info от session
            Principal principal = headerAccessor.getUser();

            if (principal == null) {
                log.error(
                        "WebSocket connected but Principal is NULL - JWT authentication may have failed. Session ID: {}",
                        headerAccessor.getSessionId());
                return;
            }

            UserEntity user = getUserFromPrincipal(principal);

            if (user == null) {
                log.error("WebSocket connected but UserEntity is NULL for principal: {}", principal.getName());
                return;
            }

            // ✅ ПЪРВО: Обнови онлайн статуса в базата данни
            Integer oldStatus = user.getOnlineStatus();
            user.setOnlineStatus(1);
            user.setLastOnline(Instant.now());
            userRepository.save(user);

            // ✅ СЛЕД ТОВА: Broadcast че е онлайн
            wsHandler.broadcastOnlineStatus(user.getId(), true);

        } catch (IllegalStateException e) {
            // Потребителят не е намерен - вероятно е излязъл или сесията е изтекла
            log.error("User not found during WebSocket connect. Session ID: {}", headerAccessor.getSessionId(), e);
        } catch (Exception e) {
            log.error("Error handling WebSocket connect. Session ID: {}", headerAccessor.getSessionId(), e);
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

                if (user != null) {

                    // ✅ ПЪРВО: Обнови офлайн статуса в базата данни
                    user.setOnlineStatus(0);
                    user.setLastOnline(Instant.now());
                    userRepository.save(user);

                    // ✅ СЛЕД ТОВА: Broadcast че е офлайн
                    wsHandler.broadcastOnlineStatus(user.getId(), false);
                } else {
                    log.error("WebSocket disconnected but user not found for principal: {}", principal.getName());
                }
            } else {
                // Principal може да липсва при някои нормални случаи (например connection
                // timeout, network issues)
                // Това не е грешка, затова логваме на debug ниво
            }
        } catch (IllegalStateException e) {
            // Потребителят не е намерен - вероятно е излязъл или сесията е изтекла
            // Това е нормално при logout, затова само логваме на debug ниво
        } catch (Exception e) {
            log.error("Error handling WebSocket disconnect", e);
        }
    }

    // ========== HELPER METHODS ==========

    /**
     * Извлича UserEntity от Principal
     * Works with JWT authentication (UserEntity Principal), traditional
     * authentication, and OAuth2 authentication.
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
                org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = (org.springframework.security.oauth2.core.user.OAuth2User) principal;
                // За OAuth2, извличаме email от атрибутите
                identifier = oAuth2User.getAttribute("email");
            } else {
                // За традиционна автентикация, използваме getName() (което е email)
                identifier = principal.getName();
            }

            if (identifier == null || identifier.isEmpty()) {
                return null;
            }

            // Нормализиране на email на малки букви
            String normalizedIdentifier = identifier.toLowerCase().trim();

            // Ако identifier изглежда като OAuth2 ID (дълъг числов string без @),
            // това означава че Principal все още съдържа OAuth2 ID, но потребителят вече не
            // е наличен
            // (вероятно е излязъл). В този случай просто връщаме null.
            if (normalizedIdentifier.matches("^\\d+$") && normalizedIdentifier.length() > 15) {
                // Вероятно е OAuth2 ID (sub от Google) - потребителят вече не е наличен след
                // logout
                return null;
            }

            return userRepository.findByEmail(normalizedIdentifier)
                    .or(() -> userRepository.findByUsername(normalizedIdentifier))
                    .orElse(null);
        } catch (Exception e) {
            log.error("Error extracting user from principal", e);
            return null;
        }
    }
}

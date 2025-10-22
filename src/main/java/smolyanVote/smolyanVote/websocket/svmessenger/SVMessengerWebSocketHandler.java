package smolyanVote.smolyanVote.websocket.svmessenger;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVMessageDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVTypingStatusDTO;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Handler за WebSocket операции на SVMessenger
 * Използва SimpMessagingTemplate за изпращане на съобщения
 */
@Component
@Slf4j
public class SVMessengerWebSocketHandler {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    public SVMessengerWebSocketHandler(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    // ========== PRIVATE MESSAGES ==========
    
    /**
     * Изпрати private съобщение към конкретен user
     * 
     * @param recipientUserId ID на получателя
     * @param message MessageDTO
     */
    public void sendPrivateMessage(Long recipientUserId, SVMessageDTO message) {
        log.debug("Sending private message to user {} in conversation {}", 
                recipientUserId, message.getConversationId());
        
        try {
            messagingTemplate.convertAndSendToUser(
                    recipientUserId.toString(),
                    "/queue/svmessenger-messages",
                    message
            );
            log.debug("Message sent successfully via WebSocket");
        } catch (Exception e) {
            log.error("Failed to send WebSocket message", e);
        }
    }
    
    // ========== TYPING STATUS ==========
    
    /**
     * Broadcast typing status в conversation
     * 
     * @param conversationId ID на разговора
     * @param userId ID на user който пише
     * @param username Username на user който пише
     * @param isTyping Дали пише (true) или спря (false)
     */
    public void broadcastTypingStatus(Long conversationId, Long userId, String username, boolean isTyping) {
        log.debug("Broadcasting typing status: conv={}, user={}, typing={}", 
                conversationId, userId, isTyping);
        
        try {
            SVTypingStatusDTO status = new SVTypingStatusDTO(
                    conversationId,
                    userId,
                    username,
                    isTyping,
                    Instant.now()
            );
            
            // Broadcast към topic за този conversation
            messagingTemplate.convertAndSend(
                    "/topic/svmessenger-typing/" + conversationId,
                    status
            );
        } catch (Exception e) {
            log.error("Failed to broadcast typing status", e);
        }
    }
    
    // ========== READ RECEIPTS ==========
    
    /**
     * Изпрати read receipt към sender-а на съобщението
     * 
     * @param senderId ID на изпращача
     * @param messageId ID на прочетеното съобщение
     * @param conversationId ID на разговора
     */
    public void sendReadReceipt(Long senderId, Long messageId, Long conversationId) {
        log.debug("Sending read receipt for message {} to user {}", messageId, senderId);
        
        try {
            Map<String, Object> receipt = new HashMap<>();
            receipt.put("messageId", messageId);
            receipt.put("conversationId", conversationId);
            receipt.put("readAt", Instant.now());
            
            messagingTemplate.convertAndSendToUser(
                    senderId.toString(),
                    "/queue/svmessenger-read-receipts",
                    receipt
            );
        } catch (Exception e) {
            log.error("Failed to send read receipt", e);
        }
    }
    
    /**
     * Изпрати bulk read receipt (всички съобщения прочетени)
     * 
     * @param senderId ID на изпращача
     * @param conversationId ID на разговора
     */
    public void sendBulkReadReceipt(Long senderId, Long conversationId) {
        log.debug("Sending bulk read receipt for conversation {} to user {}", 
                conversationId, senderId);
        
        try {
            Map<String, Object> receipt = new HashMap<>();
            receipt.put("type", "BULK_READ");
            receipt.put("conversationId", conversationId);
            receipt.put("readAt", Instant.now());
            
            messagingTemplate.convertAndSendToUser(
                    senderId.toString(),
                    "/queue/svmessenger-read-receipts",
                    receipt
            );
        } catch (Exception e) {
            log.error("Failed to send bulk read receipt", e);
        }
    }
    
    // ========== ONLINE STATUS ==========
    
    /**
     * Broadcast online/offline status change
     * 
     * @param userId ID на потребителя
     * @param isOnline Дали е online
     */
    public void broadcastOnlineStatus(Long userId, boolean isOnline) {
        log.debug("Broadcasting online status: user={}, online={}", userId, isOnline);
        
        try {
            Map<String, Object> status = new HashMap<>();
            status.put("userId", userId);
            status.put("isOnline", isOnline);
            status.put("timestamp", Instant.now());
            
            // Broadcast към всички
            messagingTemplate.convertAndSend(
                    "/topic/svmessenger-online-status",
                    status
            );
        } catch (Exception e) {
            log.error("Failed to broadcast online status", e);
        }
    }
}

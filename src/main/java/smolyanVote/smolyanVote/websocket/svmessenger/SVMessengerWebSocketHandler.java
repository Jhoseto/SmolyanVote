package smolyanVote.smolyanVote.websocket.svmessenger;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVMessageDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVTypingStatusDTO;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
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
     * Изпрати private съобщение към конкретен user по USERNAME (Spring routes by Principal name)
     *
     * @param recipientUsername Username на получателя
     * @param message MessageDTO
     */
    public void sendPrivateMessageToUsername(String recipientUsername, SVMessageDTO message) {
        log.debug("Sending private message to username {} in conversation {}, messageId: {}",
                recipientUsername, message.getConversationId(), message.getId());

        if (recipientUsername == null || recipientUsername.isBlank()) {
            log.error("Invalid recipient username for websocket message");
            return;
        }
        if (message.getId() == null || message.getConversationId() == null) {
            log.error("Invalid message data: id={}, conversationId={}",
                    message.getId(), message.getConversationId());
            return;
        }

        try {
            messagingTemplate.convertAndSendToUser(
                    recipientUsername,
                    "/queue/svmessenger-messages",
                    message
            );
            log.debug("Message sent successfully via WebSocket to username {}", recipientUsername);
        } catch (Exception e) {
            log.error("Failed to send WebSocket message to username {}: {}", recipientUsername, e.getMessage(), e);
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
    public void sendReadReceipt(String senderPrincipalName, Long messageId, Long conversationId) {
        log.debug("Sending read receipt for message {} to principal {}", messageId, senderPrincipalName);
        
        try {
            Map<String, Object> receipt = new HashMap<>();
            receipt.put("messageId", messageId);
            receipt.put("conversationId", conversationId);
            receipt.put("readAt", Instant.now());
            
            messagingTemplate.convertAndSendToUser(
                    senderPrincipalName,
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
    public void sendBulkReadReceipt(String senderPrincipalName, Long conversationId) {
        log.debug("Sending bulk read receipt for conversation {} to principal {}", 
                conversationId, senderPrincipalName);
        
        try {
            Map<String, Object> receipt = new HashMap<>();
            receipt.put("type", "BULK_READ");
            receipt.put("conversationId", conversationId);
            receipt.put("readAt", Instant.now());
            
            messagingTemplate.convertAndSendToUser(
                    senderPrincipalName,
                    "/queue/svmessenger-read-receipts",
                    receipt
            );
        } catch (Exception e) {
            log.error("Failed to send bulk read receipt", e);
        }
    }

    // ========== DELIVERY RECEIPTS ==========

    /**
     * Изпрати delivery receipt към sender-а на съобщението
     * Извиква се когато съобщение е доставено до получателя
     *
     * @param senderId ID на изпращача
     * @param messageId ID на доставеното съобщение
     * @param conversationId ID на разговора
     */
    public void sendDeliveryReceipt(String senderPrincipalName, Long messageId, Long conversationId) {
        log.debug("Sending delivery receipt for message {} to principal {}", messageId, senderPrincipalName);

        if (senderPrincipalName == null || senderPrincipalName.isBlank() || messageId == null || conversationId == null) {
            log.error("Invalid parameters for delivery receipt: senderId={}, messageId={}, conversationId={}",
                     senderPrincipalName, messageId, conversationId);
            return;
        }

        try {
            Map<String, Object> receipt = new HashMap<>();
            receipt.put("messageId", messageId);
            receipt.put("conversationId", conversationId);
            receipt.put("deliveredAt", Instant.now());

            messagingTemplate.convertAndSendToUser(
                    senderPrincipalName,
                    "/queue/svmessenger-delivery-receipts",
                    receipt
            );
            log.debug("Delivery receipt sent successfully");
        } catch (Exception e) {
            log.error("Failed to send delivery receipt: {}", e.getMessage(), e);
        }
    }

    /**
     * Изпрати bulk delivery receipt (всички не-delivered съобщения са доставени)
     * Извиква се когато потребителят зареди messenger-а
     *
     * @param senderId ID на изпращача
     * @param conversationIds списък с conversation IDs
     */
    public void sendBulkDeliveryReceipt(String senderPrincipalName, List<Long> conversationIds) {
        log.debug("Sending bulk delivery receipt for conversations {} to principal {}",
                conversationIds, senderPrincipalName);

        try {
            Map<String, Object> receipt = new HashMap<>();
            receipt.put("type", "BULK_DELIVERY");
            receipt.put("conversationIds", conversationIds);
            receipt.put("deliveredAt", Instant.now());

            messagingTemplate.convertAndSendToUser(
                    senderPrincipalName,
                    "/queue/svmessenger-delivery-receipts",
                    receipt
            );
        } catch (Exception e) {
            log.error("Failed to send bulk delivery receipt", e);
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

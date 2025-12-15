package smolyanVote.smolyanVote.services.interfaces;

import java.util.Map;

/**
 * Interface за Push Notification Service
 */
public interface MobilePushNotificationService {
    
    /**
     * Изпраща push notification до user
     */
    void sendNotificationToUser(Long userId, String title, String body, Map<String, String> data);
    
    /**
     * Изпраща notification за ново съобщение
     */
    void sendNewMessageNotification(Long userId, String senderName, String messagePreview, Long conversationId);
    
    /**
     * Изпраща notification за входящо обаждане
     */
    void sendIncomingCallNotification(Long userId, String callerName, Long conversationId);
}


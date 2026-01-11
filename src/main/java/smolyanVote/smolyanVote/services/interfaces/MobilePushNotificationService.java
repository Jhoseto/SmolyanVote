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
     * @param userId ID на получателя на нотификацията
     * @param callerName Име на звънящия
     * @param conversationId ID на разговора
     * @param participantId ID на участника (звънящия) - използва се за accept/reject call
     * @param callerImageUrl URL на аватара на звънящия - използва се за показване в call UI
     */
    void sendIncomingCallNotification(Long userId, String callerName, Long conversationId, Long participantId, String callerImageUrl);
}


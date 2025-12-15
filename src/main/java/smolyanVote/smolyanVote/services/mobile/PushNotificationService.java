package smolyanVote.smolyanVote.services.mobile;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.mobile.MobileDeviceTokenEntity;
import smolyanVote.smolyanVote.repositories.mobile.MobileDeviceTokenRepository;
import smolyanVote.smolyanVote.services.interfaces.MobilePushNotificationService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Push Notification Service за мобилни приложения
 * Използва Firebase Cloud Messaging (FCM) за Android и APNs за iOS
 * 
 * NOTE: Firebase Admin SDK setup ще се направи в отделен config клас
 */
@Service
@Slf4j
public class PushNotificationService implements MobilePushNotificationService {

    private final MobileDeviceTokenRepository deviceTokenRepository;

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    public PushNotificationService(MobileDeviceTokenRepository deviceTokenRepository) {
        this.deviceTokenRepository = deviceTokenRepository;
    }

    /**
     * Изпраща push notification до конкретен user
     * 
     * @param userId ID на потребителя
     * @param title Заглавие на notification
     * @param body Текст на notification
     * @param data Допълнителни данни (optional)
     */
    public void sendNotificationToUser(Long userId, String title, String body, Map<String, String> data) {
        if (!firebaseEnabled) {
            log.warn("Firebase is not enabled - skipping push notification");
            return;
        }

        try {
            // Намери всички активни device tokens за user
            List<MobileDeviceTokenEntity> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(userId);

            if (tokens.isEmpty()) {
                log.debug("No active device tokens found for user: {}", userId);
                return;
            }

            // Изпращане на notification до всеки device
            for (MobileDeviceTokenEntity token : tokens) {
                sendNotificationToDevice(token, title, body, data);
            }

            log.info("Push notification sent to {} devices for user: {}", tokens.size(), userId);

        } catch (Exception e) {
            log.error("Error sending push notification to user: {}", userId, e);
        }
    }

    /**
     * Изпраща push notification до конкретен device
     * 
     * @param deviceToken Device token entity
     * @param title Заглавие
     * @param body Текст
     * @param data Допълнителни данни
     */
    private void sendNotificationToDevice(MobileDeviceTokenEntity deviceToken, String title, String body, Map<String, String> data) {
        try {
            String platform = deviceToken.getPlatform().toLowerCase();
            String token = deviceToken.getDeviceToken();

            if ("android".equals(platform)) {
                sendFCMNotification(token, title, body, data);
            } else if ("ios".equals(platform)) {
                sendAPNsNotification(token, title, body, data);
            } else {
                log.warn("Unknown platform: {}", platform);
            }

        } catch (Exception e) {
            log.error("Error sending notification to device: {}", deviceToken.getDeviceToken(), e);
        }
    }

    /**
     * Изпраща FCM notification за Android
     * TODO: Имплементиране с Firebase Admin SDK
     */
    private void sendFCMNotification(String deviceToken, String title, String body, Map<String, String> data) {
        // TODO: Имплементиране с Firebase Admin SDK
        log.info("FCM notification (TODO): token={}, title={}, body={}", deviceToken, title, body);
        
        // Placeholder implementation
        // В production ще използваме Firebase Admin SDK:
        // Message message = Message.builder()
        //     .setToken(deviceToken)
        //     .setNotification(Notification.builder()
        //         .setTitle(title)
        //         .setBody(body)
        //         .build())
        //     .putAllData(data != null ? data : new HashMap<>())
        //     .build();
        // FirebaseMessaging.getInstance().send(message);
    }

    /**
     * Изпраща APNs notification за iOS
     * TODO: Имплементиране с Firebase Admin SDK (поддържа и iOS)
     */
    private void sendAPNsNotification(String deviceToken, String title, String body, Map<String, String> data) {
        // TODO: Имплементиране с Firebase Admin SDK (поддържа и iOS чрез APNs)
        log.info("APNs notification (TODO): token={}, title={}, body={}", deviceToken, title, body);
        
        // Firebase Admin SDK поддържа и iOS чрез APNs конфигурация
    }

    /**
     * Изпраща notification за ново съобщение
     */
    public void sendNewMessageNotification(Long userId, String senderName, String messagePreview, Long conversationId) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "NEW_MESSAGE");
        data.put("conversationId", conversationId.toString());
        data.put("senderName", senderName);

        sendNotificationToUser(userId, "Ново съобщение от " + senderName, messagePreview, data);
    }

    /**
     * Изпраща notification за входящо обаждане
     */
    public void sendIncomingCallNotification(Long userId, String callerName, Long conversationId) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "INCOMING_CALL");
        data.put("conversationId", conversationId.toString());
        data.put("callerName", callerName);

        sendNotificationToUser(userId, "Входящо обаждане", callerName + " те вика", data);
    }
}


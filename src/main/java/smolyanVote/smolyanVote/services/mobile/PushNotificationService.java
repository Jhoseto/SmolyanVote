package smolyanVote.smolyanVote.services.mobile;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
    private FirebaseMessaging firebaseMessaging;

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    public PushNotificationService(MobileDeviceTokenRepository deviceTokenRepository) {
        this.deviceTokenRepository = deviceTokenRepository;
    }

    @Autowired(required = false)
    public void setFirebaseMessaging(FirebaseMessaging firebaseMessaging) {
        this.firebaseMessaging = firebaseMessaging;
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
                sendFCMNotification(token, title, body, data, deviceToken);
            } else if ("ios".equals(platform)) {
                sendAPNsNotification(token, title, body, data, deviceToken);
            } else {
                log.warn("Unknown platform: {}", platform);
            }

        } catch (Exception e) {
            log.error("Error sending notification to device: {}", deviceToken.getDeviceToken(), e);
        }
    }

    /**
     * Изпраща FCM notification за Android
     */
    private void sendFCMNotification(String deviceToken, String title, String body, Map<String, String> data, MobileDeviceTokenEntity tokenEntity) {
        if (firebaseMessaging == null) {
            log.warn("FirebaseMessaging not available - cannot send FCM notification");
            return;
        }

        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            // Добавяне на data payload
            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            Message message = messageBuilder.build();
            String response = firebaseMessaging.send(message);
            log.info("✅ FCM notification sent successfully: token={}, response={}", deviceToken, response);

        } catch (FirebaseMessagingException e) {
            log.error("❌ Failed to send FCM notification: token={}, error={}, errorCode={}", 
                    deviceToken, e.getMessage(), e.getErrorCode());
            
            // ✅ Маркирай device token като неактивен ако е невалиден
            // Проверяваме всички възможни error codes които означават невалиден token
            String errorCode = e.getErrorCode() != null ? e.getErrorCode().name() : "";
            String errorMessage = e.getMessage() != null ? e.getMessage() : "";
            boolean isInvalidToken = 
                "INVALID_ARGUMENT".equals(errorCode) || 
                "REGISTRATION_TOKEN_NOT_REGISTERED".equals(errorCode) ||
                "INVALID_REGISTRATION_TOKEN".equals(errorCode) ||
                "NOT_FOUND".equals(errorCode) ||
                errorMessage.contains("Requested entity was not found") ||
                errorMessage.contains("NotRegistered") ||
                errorMessage.contains("not found");
            
            if (isInvalidToken) {
                log.warn("Invalid device token detected (errorCode={}, message={}) - marking as inactive", 
                        errorCode, errorMessage);
                markTokenAsInactive(tokenEntity);
            }
        } catch (Exception e) {
            log.error("❌ Unexpected error sending FCM notification: token={}", deviceToken, e);
        }
    }

    /**
     * Изпраща APNs notification за iOS
     * Firebase Admin SDK поддържа iOS чрез APNs автоматично
     */
    private void sendAPNsNotification(String deviceToken, String title, String body, Map<String, String> data, MobileDeviceTokenEntity tokenEntity) {
        if (firebaseMessaging == null) {
            log.warn("FirebaseMessaging not available - cannot send APNs notification");
            return;
        }

        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .setApnsConfig(com.google.firebase.messaging.ApnsConfig.builder()
                            .setAps(com.google.firebase.messaging.Aps.builder()
                                    .setAlert(com.google.firebase.messaging.ApsAlert.builder()
                                            .setTitle(title)
                                            .setBody(body)
                                            .build())
                                    .setSound("default")
                                    .build())
                            .build());

            // Добавяне на data payload
            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            Message message = messageBuilder.build();
            String response = firebaseMessaging.send(message);
            log.info("✅ APNs notification sent successfully: token={}, response={}", deviceToken, response);

        } catch (FirebaseMessagingException e) {
            log.error("❌ Failed to send APNs notification: token={}, error={}, errorCode={}", 
                    deviceToken, e.getMessage(), e.getErrorCode());
            
            // ✅ Маркирай device token като неактивен ако е невалиден
            // Проверяваме всички възможни error codes които означават невалиден token
            String errorCode = e.getErrorCode() != null ? e.getErrorCode().name() : "";
            String errorMessage = e.getMessage() != null ? e.getMessage() : "";
            boolean isInvalidToken = 
                "INVALID_ARGUMENT".equals(errorCode) || 
                "REGISTRATION_TOKEN_NOT_REGISTERED".equals(errorCode) ||
                "INVALID_REGISTRATION_TOKEN".equals(errorCode) ||
                "NOT_FOUND".equals(errorCode) ||
                errorMessage.contains("Requested entity was not found") ||
                errorMessage.contains("NotRegistered") ||
                errorMessage.contains("not found");
            
            if (isInvalidToken) {
                log.warn("Invalid device token detected (errorCode={}, message={}) - marking as inactive", 
                        errorCode, errorMessage);
                markTokenAsInactive(tokenEntity);
            }
        } catch (Exception e) {
            log.error("❌ Unexpected error sending APNs notification: token={}", deviceToken, e);
        }
    }
    
    /**
     * Маркира device token като неактивен
     */
    private void markTokenAsInactive(MobileDeviceTokenEntity tokenEntity) {
        try {
            if (tokenEntity != null) {
                tokenEntity.setIsActive(false);
                deviceTokenRepository.save(tokenEntity);
                log.info("Device token marked as inactive: {}", tokenEntity.getDeviceToken());
            }
        } catch (Exception e) {
            log.error("Failed to mark device token as inactive", e);
        }
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


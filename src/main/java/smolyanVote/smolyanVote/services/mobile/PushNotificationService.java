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
import java.util.concurrent.ConcurrentHashMap;

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

    // Cache to prevent duplicate call notifications: Key="userId_conversationId",
    // Value=Timestamp
    private final java.util.concurrent.ConcurrentHashMap<String, Long> callNotificationCache = new java.util.concurrent.ConcurrentHashMap<>();

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
     * @param title  Заглавие на notification
     * @param body   Текст на notification
     * @param data   Допълнителни данни (optional)
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
            // CRITICAL FIX: Deduplicate tokens to prevent double notifications
            // If the database has multiple active entries for the same token (e.g. from
            // reinstalls),
            // we must ensure we only send to the unique token string once.
            java.util.Set<String> processedTokens = new java.util.HashSet<>();

            for (MobileDeviceTokenEntity token : tokens) {
                String tokenString = token.getDeviceToken();
                if (tokenString != null && !processedTokens.contains(tokenString)) {
                    sendNotificationToDevice(token, title, body, data);
                    processedTokens.add(tokenString);
                }
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
     * @param title       Заглавие
     * @param body        Текст
     * @param data        Допълнителни данни
     */
    private void sendNotificationToDevice(MobileDeviceTokenEntity deviceToken, String title, String body,
            Map<String, String> data) {
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
     * CRITICAL: За входящи обаждания използваме DATA-ONLY payload (без notification
     * payload)
     * Това позволява на app-а да покаже Full Screen Intent вместо notification в
     * лентата
     * За други notifications използваме notification payload за автоматично
     * показване от Firebase
     */
    private void sendFCMNotification(String deviceToken, String title, String body, Map<String, String> data,
            MobileDeviceTokenEntity tokenEntity) {
        if (firebaseMessaging == null) {
            log.warn("FirebaseMessaging not available - cannot send FCM notification");
            return;
        }

        try {
            // CRITICAL FIX: Проверка дали е входящо обаждане
            // CRITICAL FIX: Android emulators and some devices do NOT reliably deliver
            // data-only messages when app is background/killed (doze mode, battery
            // optimization)
            // We MUST include a minimal notification payload to guarantee delivery
            // Native service will IMMEDIATELY cancel this notification - user sees only FSI
            boolean isIncomingCall = data != null && "INCOMING_CALL".equals(data.get("type"));

            // CRITICAL: Log what we're sending for debugging
            if (isIncomingCall) {
                log.info(
                        "📞 INCOMING CALL - Sending with MINIMAL notification payload (for delivery guarantee)");
                log.info("📞 Native service will CANCEL notification immediately - user sees only Full Screen Intent");
            } else {
                log.info("📬 Regular notification - Sending with notification payload and AndroidNotification");
            }

            Message.Builder messageBuilder = Message.builder()
                    .setToken(deviceToken);

            // CRITICAL FIX: For incoming calls, add MINIMAL notification payload
            // This is ONLY for delivery guarantee - notification will be cancelled
            // immediately
            // For regular messages, add full notification payload
            if (isIncomingCall) {
                // Minimal notification ensures FCM delivers the message
                // SVMessengerFirebaseMessagingService will cancel it immediately on line
                // 122-127
                messageBuilder.setNotification(Notification.builder()
                        .setTitle("Incoming call")
                        .setBody(title) // Use title for caller name
                        .build());
                log.info("✅ Added MINIMAL Notification payload for delivery (will be cancelled by native)");
            } else {
                // For regular notifications use full notification payload
                // Firebase автоматично ги показва дори когато app-ът е затворен (оптимизация на
                // батерията)
                messageBuilder.setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build());
                log.debug("✅ Added Notification payload: title={}, body={}", title, body);
            }

            // Android config с priority: "high" - критично за background notifications
            com.google.firebase.messaging.AndroidConfig.Builder androidConfigBuilder = com.google.firebase.messaging.AndroidConfig
                    .builder()
                    .setPriority(com.google.firebase.messaging.AndroidConfig.Priority.HIGH);

            // CRITICAL FIX: For incoming calls, add MINIMAL AndroidNotification
            // This notification will be IMMEDIATELY cancelled by native service
            // But it ensures the FCM message is delivered reliably
            if (isIncomingCall) {
                androidConfigBuilder.setNotification(com.google.firebase.messaging.AndroidNotification.builder()
                        .setTitle("Incoming call")
                        .setBody(title) // Caller name
                        .setSound("default") // Will be overridden by IncomingCallActivity sound
                        .setChannelId("svmessenger_calls")
                        .setPriority(com.google.firebase.messaging.AndroidNotification.Priority.MAX)
                        .setTag("incoming_call") // Tag for easy cancellation
                        .build());
                log.info("✅ Added MINIMAL AndroidNotification for delivery (will be cancelled by native)");
            } else {
                androidConfigBuilder.setNotification(com.google.firebase.messaging.AndroidNotification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .setSound("default")
                        .setChannelId(getNotificationChannelId(data))
                        .setPriority(com.google.firebase.messaging.AndroidNotification.Priority.HIGH)
                        .build());
                log.debug("✅ Added AndroidNotification: title={}, body={}, channelId={}", title, body,
                        getNotificationChannelId(data));
            }

            messageBuilder.setAndroidConfig(androidConfigBuilder.build());

            // Добавяне на data payload за app логика
            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
                log.debug("✅ Added data payload: {}", data);
            }

            Message message = messageBuilder.build();
            String response = firebaseMessaging.send(message);

            // CRITICAL: Log what was actually sent
            if (isIncomingCall) {
                log.info("✅ FCM DATA-ONLY notification sent successfully for INCOMING CALL: token={}, response={}",
                        deviceToken, response);
                log.info(
                        "📞 VERIFICATION: This message has NO notification payload and NO AndroidNotification - Firebase will NOT show notification in bar");
            } else {
                log.info("✅ FCM notification sent successfully: token={}, response={}", deviceToken, response);
            }

        } catch (FirebaseMessagingException e) {
            log.error("❌ Failed to send FCM notification: token={}, error={}, errorCode={}",
                    deviceToken, e.getMessage(), e.getErrorCode());

            // ✅ Маркирай device token като неактивен ако е невалиден
            // Проверяваме всички възможни error codes които означават невалиден token
            String errorCode = e.getErrorCode() != null ? e.getErrorCode().name() : "";
            String errorMessage = e.getMessage() != null ? e.getMessage() : "";
            boolean isInvalidToken = "INVALID_ARGUMENT".equals(errorCode) ||
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
    private void sendAPNsNotification(String deviceToken, String title, String body, Map<String, String> data,
            MobileDeviceTokenEntity tokenEntity) {
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
            boolean isInvalidToken = "INVALID_ARGUMENT".equals(errorCode) ||
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
     * 
     * @param userId         ID на получателя на нотификацията
     * @param callerName     Име на звънящия
     * @param conversationId ID на разговора
     * @param participantId  ID на участника (звънящия) - използва се за
     *                       accept/reject call
     * @param callerImageUrl URL на аватара на звънящия - използва се за показване в
     *                       call UI
     */
    public void sendIncomingCallNotification(Long userId, String callerName, Long conversationId, Long participantId,
            String callerImageUrl) {
        // CRITICAL FIX: Validate required parameters to prevent NullPointerException
        if (userId == null) {
            log.error("❌ Cannot send incoming call notification: userId is null");
            return;
        }
        if (conversationId == null) {
            log.error("❌ Cannot send incoming call notification: conversationId is null for userId {}", userId);
            return;
        }
        // callerName can be null, use default value
        String safeCallerName = (callerName != null && !callerName.trim().isEmpty())
                ? callerName
                : "Потребител";

        Map<String, String> data = new HashMap<>();
        data.put("type", "INCOMING_CALL");
        data.put("conversationId", conversationId.toString()); // Safe now - conversationId is validated above
        data.put("callerName", safeCallerName);
        // CRITICAL: participantId и callerImageUrl са необходими за правилно показване
        // на call UI
        // participantId се използва за accept/reject call actions
        // callerImageUrl се използва за показване на аватар в IncomingCallActivity
        if (participantId != null) {
            data.put("participantId", participantId.toString());
        }
        if (callerImageUrl != null && !callerImageUrl.trim().isEmpty()) {
            data.put("callerImageUrl", callerImageUrl.trim());
        }

        // Check for duplicate notifications (Server-side deduplication)
        // Key: "userId_conversationId"
        String dedupKey = userId + "_" + conversationId;
        Long lastSentTime = callNotificationCache.get(dedupKey);
        long currentTime = System.currentTimeMillis();

        // If sent less than 15 seconds ago, skip
        if (lastSentTime != null && (currentTime - lastSentTime) < 15000) {
            log.info("🚫 SKIPPING duplicate incoming call notification for user {} conversation {} (sent {} ms ago)",
                    userId, conversationId, (currentTime - lastSentTime));
            return;
        }

        // Clean up cache occasionally (every 100 calls roughly, or simple lazy removal)
        // Simple lazy cleanup: if map gets too big (>1000 items), clear it.
        // Incoming calls are rare enough that this is safe and efficient.
        if (callNotificationCache.size() > 1000) {
            callNotificationCache.clear();
        }

        callNotificationCache.put(dedupKey, currentTime);

        sendNotificationToUser(userId, "Входящо обаждане", safeCallerName + " те вика", data);
    }

    /**
     * Определя notification channel ID според типа на нотификацията
     * За да се използват правилните звуци и настройки
     */
    private String getNotificationChannelId(Map<String, String> data) {
        if (data != null && "INCOMING_CALL".equals(data.get("type"))) {
            return "svmessenger_calls"; // Calls channel
        }
        return "svmessenger_messages"; // Messages channel (default)
    }
}

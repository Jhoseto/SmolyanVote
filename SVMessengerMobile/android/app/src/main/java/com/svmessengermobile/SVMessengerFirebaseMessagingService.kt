package com.svmessengermobile

import android.app.ActivityManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import java.util.Random
import java.util.concurrent.atomic.AtomicInteger

/**
 * Firebase Messaging Service
 * Обработва push notifications когато app-ът е в background или затворен
 */
class SVMessengerFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        // Atomic counter for notification IDs to prevent collisions
        // CRITICAL: Using atomic counter ensures uniqueness even when multiple notifications
        // arrive within the same 1024ms window (same timestamp bucket)
        // The counter wraps around at Int.MAX_VALUE, but combined with timestamp mask,
        // this provides sufficient uniqueness for practical purposes
        private val notificationIdCounter = AtomicInteger(0)
    }

    override fun onCreate() {
        super.onCreate()
        Log.d("SVMessengerFCM", "🔥 Firebase Messaging Service created")
    }

    /**
     * Check if app is in foreground
     */
    private fun isAppInForeground(): Boolean {
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val runningProcesses = activityManager.runningAppProcesses ?: return false
        
        val packageName = packageName
        for (processInfo in runningProcesses) {
            if (processInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND &&
                processInfo.processName == packageName) {
                return true
            }
        }
        return false
    }

    /**
     * Called when message is received in background or when app is closed
     * 
     * ВАЖНО: Firebase автоматично показва нотификации когато има notification payload + priority: "high"
     * Този метод се извиква само за data-only messages или когато трябва да се обработи допълнително.
     * 
     * Оптимизация като Facebook Messenger:
     * - Firebase FCM автоматично показва нотификации с notification payload (не харчи батерия)
     * - Този service се извиква само когато е нужно (не постоянно работещ)
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d("SVMessengerFCM", "📬 Background notification received: ${remoteMessage.messageId}")
        Log.d("SVMessengerFCM", "📬 Notification data: ${remoteMessage.data}")
        Log.d("SVMessengerFCM", "📬 Notification payload: ${remoteMessage.notification}")

        // ВАЖНО: Когато Firebase получава message с notification payload + priority: "high",
        // той автоматично показва нотификацията дори когато app-ът е затворен.
        // Този метод се извиква само когато app-ът НЕ е в foreground.
        
        // Проверка дали app-ът е в foreground
        // Ако е в foreground, foreground handler ще покаже нотификацията чрез NotificationModule
        if (isAppInForeground()) {
            Log.d("SVMessengerFCM", "⏭️ App is in foreground - foreground handler will show notification")
            // Не показваме тук - foreground handler ще се грижи
            return
        }

        // App-ът е в background или затворен
        // Handle data-only messages (когато няма notification payload)
        // В този случай трябва ръчно да покажем нотификация
        if (remoteMessage.notification == null && remoteMessage.data.isNotEmpty()) {
            Log.d("SVMessengerFCM", "📬 Data-only message received - showing notification manually")
            handleDataMessage(remoteMessage)
            return
        }

        // Handle notification messages (когато има notification payload)
        // ВАЖНО: Firebase автоматично показва нотификациите САМО когато app-ът е напълно затворен.
        // Когато app-ът е в background (процесът работи но не е в foreground),
        // Firebase НЕ показва автоматично нотификациите и onMessageReceived се извиква.
        // В този случай трябва ръчно да покажем нотификацията.
        remoteMessage.notification?.let { notification ->
            Log.d("SVMessengerFCM", "📬 Notification message: title=${notification.title}, body=${notification.body}")
            
            // Firebase автоматично показва нотификациите само когато app-ът е напълно затворен.
            // Когато app-ът е в background, трябва ръчно да покажем нотификацията.
            // Показваме нотификацията ръчно за да гарантираме че винаги се показва.
            Log.d("SVMessengerFCM", "📬 Showing notification manually (app is in background)")
            showNotification(
                notification.title,
                notification.body,
                remoteMessage.data
            )
        }
    }

    /**
     * Handle data-only messages (when notification payload is null)
     */
    private fun handleDataMessage(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data
        val type = data["type"] ?: "NEW_MESSAGE"
        val conversationId = data["conversationId"]
        val title = data["title"] ?: "SVMessenger"
        val body = data["body"] ?: "Ново съобщение"

        Log.d("SVMessengerFCM", "📬 Handling data message: type=$type, conversationId=$conversationId")
        
        // Show notification for data-only messages
        showNotification(title, body, data)
    }

    /**
     * Show notification
     * За обаждания използва Full Screen Intent за да покаже call UI панел в горния край на екрана
     */
    private fun showNotification(title: String?, body: String?, data: Map<String, String>) {
        try {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Determine channel based on notification type
            val channelId = when (data["type"]) {
                "INCOMING_CALL" -> NotificationChannelManager.CALLS_CHANNEL_ID
                else -> NotificationChannelManager.MESSAGES_CHANNEL_ID
            }

            val isIncomingCall = data["type"] == "INCOMING_CALL"
            
            // Generate unique notification ID first - will be used as request code for PendingIntent
            // CRITICAL: Each notification must have a unique request code to prevent Android
            // from caching and reusing the first PendingIntent, which would route all notifications
            // to the same activity with the same extras
            // 
            // CRITICAL FIX: Previous implementation used timestamp mask + random, which could collide
            // when multiple notifications arrived within the same 1024ms window with the same random value.
            // Birthday paradox suggests collisions become likely with ~23+ rapid calls in 1024ms.
            // 
            // NEW STRATEGY: Use timestamp mask + atomic counter to guarantee uniqueness
            // - Timestamp mask (0x7FF00000) creates 1048576ms buckets (masks lower 20 bits)
            // - Atomic counter provides sequential uniqueness within each bucket
            // - CRITICAL FIX: Use 16-bit counter range (0-65535) which is much larger than the
            //   previous 9-bit (512) range. With timestamp buckets of ~17 minutes, the counter
            //   will almost never wrap within a single bucket under normal load.
            // - Even if counter wraps from 65535 to 0 within the same bucket, the next notification
            //   will likely be in a different timestamp bucket, preventing collisions.
            // - Calculation: maskedTimestamp (max 2,146,435,072) + counter (max 65535) = 2,146,500,607 < Int.MAX_VALUE
            val timestamp = System.currentTimeMillis()
            val rawCounter = notificationIdCounter.getAndIncrement()
            // Use lower 16 bits of counter (0-65535) - gives us 65536 unique values per timestamp bucket
            // This is 128x larger than the previous 9-bit (512) range, making wrap-around collisions
            // extremely unlikely. With timestamp buckets of ~17 minutes, we'd need 64+ notifications/second
            // continuously for 17 minutes to cause a wrap within a single bucket.
            val counterValue = rawCounter and 0xFFFF // 0-65535 counter (16 bits)
            // Mask timestamp to 0x7FF00000 (2,146,435,072) to create ~17 minute buckets (masks lower 20 bits)
            // Each bucket lasts ~17 minutes, which is much longer than typical notification intervals
            // This ensures that even if counter wraps, notifications will be in different buckets
            val maskedTimestampLong = timestamp and 0x7FF00000L // Long mask (masks lower 20 bits)
            val maskedTimestamp = maskedTimestampLong.toInt() // Safe conversion
            // CRITICAL FIX: Simple addition is safe because:
            // - maskedTimestamp (max 2,146,435,072) + counterValue (max 65535) = 2,146,500,607
            // - This is well below Int.MAX_VALUE (2,147,483,647), so no overflow risk
            // - The large counter range (65536 values) combined with long bucket duration (~17 min)
            //   makes collisions from counter wrap-around extremely unlikely
            val notificationIdLong = maskedTimestamp.toLong() + counterValue
            val notificationId = notificationIdLong.toInt() // Safe conversion (guaranteed < Int.MAX_VALUE)
            val finalNotificationId = notificationId
            
            // FLAG_IMMUTABLE is required from Android 12+ (API 31)
            // For Android 11 and below, use FLAG_UPDATE_CURRENT only
            val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            // For incoming calls, use Full Screen Intent to show call UI panel
            // For messages, use regular intent to open app
            // CRITICAL: Use notificationId as request code to ensure each notification has unique PendingIntent
            val pendingIntent = if (isIncomingCall) {
                // Full Screen Intent for incoming calls - показва call UI панел в горния край
                val fullScreenIntent = Intent(this, IncomingCallActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    data["conversationId"]?.let { putExtra("conversationId", it) }
                    data["callerName"]?.let { putExtra("callerName", it) }
                    data["callerImageUrl"]?.let { putExtra("callerImageUrl", it) }
                    // CRITICAL FIX: Only add participantId if it can be successfully parsed
                    // If parsing fails (toLongOrNull() returns null), don't add the extra at all
                    // This preserves the protocol where hasExtra("participantId") only returns true
                    // when a valid participantId was actually provided
                    data["participantId"]?.toLongOrNull()?.let { parsedParticipantId ->
                        putExtra("participantId", parsedParticipantId)
                    }
                }
                
                PendingIntent.getActivity(
                    this,
                    notificationId, // Use unique notification ID as request code
                    fullScreenIntent,
                    pendingIntentFlags
                )
            } else {
                // Regular intent for messages
                val intent = Intent(this, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    data["conversationId"]?.let { putExtra("conversationId", it) }
                    data["type"]?.let { putExtra("notificationType", it) }
                }
                
                PendingIntent.getActivity(
                    this,
                    notificationId, // Use unique notification ID as request code
                    intent,
                    pendingIntentFlags
                )
            }

            // Build notification
            // For Android 8.0+ (API 26+), use channel ID
            // For older versions, NotificationCompat handles it automatically
            val notificationBuilder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationCompat.Builder(this, channelId)
            } else {
                NotificationCompat.Builder(this)
            }
            
            notificationBuilder
                .setSmallIcon(android.R.drawable.ic_dialog_info) // TODO: Use custom icon
                .setContentTitle(title ?: "SVMessenger")
                .setContentText(body ?: "Ново съобщение")
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            
            // For incoming calls, set Full Screen Intent to show call UI panel
            // This shows the call UI in the top of the screen even when app is closed
            if (isIncomingCall && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                notificationBuilder.setFullScreenIntent(pendingIntent, true)
                Log.d("SVMessengerFCM", "📞 Full Screen Intent set for incoming call")
            }

            // Sound is handled by notification channel settings
            // Don't override - let the channel sound play
            // The channel already has custom sound configured in NotificationChannelManager

            // Show notification (notificationId was already generated above)
            notificationManager.notify(notificationId, notificationBuilder.build())
            
            Log.d("SVMessengerFCM", "✅ Notification shown: id=$notificationId, channel=$channelId")
        } catch (e: Exception) {
            Log.e("SVMessengerFCM", "❌ Error showing notification:", e)
            e.printStackTrace()
        }
    }

    /**
     * Called when FCM token is refreshed
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("SVMessengerFCM", "🔄 FCM token refreshed: $token")
        // Token will be re-registered by usePushNotifications hook when app becomes active
    }
}


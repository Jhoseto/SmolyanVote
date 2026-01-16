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
        
        // CRITICAL: Cancel ALL notifications immediately when service starts
        // This prevents any notifications from appearing in notification bar
        try {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancelAll()
            Log.d("SVMessengerFCM", "📞 Service onCreate - cancelled all notifications")
        } catch (e: Exception) {
            Log.e("SVMessengerFCM", "❌ Error cancelling notifications in onCreate:", e)
        }
    }

    /**
     * Check if app is in foreground
     * CRITICAL: This method must be accurate - if it returns true when app is closed,
     * Full Screen Intent will not be shown
     */
    private fun isAppInForeground(): Boolean {
        try {
            val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val runningProcesses = activityManager.runningAppProcesses ?: run {
                Log.d("SVMessengerFCM", "📱 No running processes - app is definitely closed")
                return false
            }
            
            val packageName = packageName
            var foundForeground = false
            
            for (processInfo in runningProcesses) {
                if (processInfo.processName == packageName) {
                    val importance = processInfo.importance
                    Log.d("SVMessengerFCM", "📱 Found process: ${processInfo.processName}, importance=$importance")
                    
                    // CRITICAL: Only return true if process is truly in foreground
                    // IMPORTANCE_FOREGROUND means app is visible and user is interacting with it
                    if (importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) {
                        foundForeground = true
                        Log.d("SVMessengerFCM", "📱 App is in FOREGROUND (importance=FOREGROUND)")
                        break
                    } else {
                        // IMPORTANCE_VISIBLE or IMPORTANCE_SERVICE means app is in background
                        Log.d("SVMessengerFCM", "📱 App is in BACKGROUND (importance=$importance)")
                    }
                }
            }
            
            if (!foundForeground) {
                Log.d("SVMessengerFCM", "📱 App is NOT in foreground - will show Full Screen Intent")
            }
            
            return foundForeground
        } catch (e: Exception) {
            Log.e("SVMessengerFCM", "❌ Error checking app state - assuming background:", e)
            // CRITICAL: If we can't determine state, assume background to ensure Full Screen Intent is shown
            return false
        }
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
        // CRITICAL: Log that onMessageReceived was called
        Log.d("SVMessengerFCM", "🔥🔥🔥 onMessageReceived CALLED - this means Firebase received data-only message")
        Log.d("SVMessengerFCM", "🔥 Message ID: ${remoteMessage.messageId}")
        Log.d("SVMessengerFCM", "🔥 From: ${remoteMessage.from}")
        Log.d("SVMessengerFCM", "🔥 Has notification payload: ${remoteMessage.notification != null}")
        Log.d("SVMessengerFCM", "🔥 Has data payload: ${remoteMessage.data.isNotEmpty()}")
        
        // CRITICAL: DO NOT call super.onMessageReceived() for incoming calls
        // super.onMessageReceived() can cause Firebase to show notification automatically
        // We handle everything manually to have full control
        
        val isIncomingCall = remoteMessage.data["type"] == "INCOMING_CALL"
        Log.d("SVMessengerFCM", "🔥 Is incoming call: $isIncomingCall")
        
        // CRITICAL: For incoming calls, cancel ALL notifications IMMEDIATELY
        // This must happen BEFORE any other processing to prevent notification from appearing
        if (isIncomingCall) {
            try {
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.cancelAll()
                Log.d("SVMessengerFCM", "📞 IMMEDIATE cancel ALL - removed any Firebase notifications")
            } catch (e: Exception) {
                Log.e("SVMessengerFCM", "❌ Error in immediate cancel:", e)
            }
        }
        
        // CRITICAL: Only call super for non-incoming-call messages
        // For incoming calls, we handle everything manually
        if (!isIncomingCall) {
            super.onMessageReceived(remoteMessage)
        }
        
        Log.d("SVMessengerFCM", "📬 Background notification received: ${remoteMessage.messageId}")
        Log.d("SVMessengerFCM", "📬 Notification data: ${remoteMessage.data}")
        Log.d("SVMessengerFCM", "📬 Notification payload: ${remoteMessage.notification}")
        Log.d("SVMessengerFCM", "📬 Is incoming call: $isIncomingCall")
        Log.d("SVMessengerFCM", "📬 App state: ${if (isAppInForeground()) "foreground" else "background/closed"}")
        Log.d("SVMessengerFCM", "📬 Android version: ${Build.VERSION.SDK_INT} (${Build.VERSION.RELEASE})")
        
        // REMOVED: Aggressive cancellation that was killing the Full Screen Intent
        // We must let the notification exist so the system can trigger the activity
        /*
        if (isIncomingCall) {
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                try {
                    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    notificationManager.cancelAll()
                    Log.d("SVMessengerFCM", "📞 Safety cancel - removed any notifications that appeared")
                } catch (e: Exception) {
                    // Ignore errors
                }
            }, 10) // Very short delay - 10ms
        }
        */
        
        // CRITICAL FIX: Check if backend sent notification payload (should NOT happen for incoming calls)
        // If notification payload exists, backend is still sending it - this will cause Firebase to show notification
        if (isIncomingCall && remoteMessage.notification != null) {
            Log.e("SVMessengerFCM", "❌ CRITICAL: Backend sent notification payload for incoming call! This will cause notification in bar. Backend must send DATA-ONLY payload.")
            Log.e("SVMessengerFCM", "❌ Notification payload: title=${remoteMessage.notification?.title}, body=${remoteMessage.notification?.body}")
            // CRITICAL: Cancel notification again if backend sent notification payload
            try {
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.cancelAll()
            } catch (e: Exception) {
                // Ignore errors
            }
        }
        
        // CRITICAL FIX: For incoming calls, ALWAYS show Full Screen Intent
        // We delegate EVERYTHING to IncomingCallService - no separate notifications here
        if (isIncomingCall) {
            Log.d("SVMessengerFCM", "📞 Incoming call received - starting IncomingCallService")
            val callerName = remoteMessage.data["callerName"] ?: "Потребител"
            val conversationId = remoteMessage.data["conversationId"]
            val callerImageUrl = remoteMessage.data["callerImageUrl"]
            val participantId = remoteMessage.data["participantId"]?.toLongOrNull()
            
            // CRITICAL: Start foreground service - it will create ONE notification with Full Screen Intent
            try {
                IncomingCallService.startService(
                    this, 
                    callerName,
                    conversationId,
                    callerImageUrl,
                    participantId
                )
                Log.d("SVMessengerFCM", "✅ IncomingCallService started - it manages notification and Full Screen Intent")
            } catch (e: Exception) {
                Log.e("SVMessengerFCM", "❌ CRITICAL: Failed to start foreground service:", e)
                e.printStackTrace()
            }
            return
        }
        
        // CRITICAL FIX: Allow notifications in ALL states (foreground, background, killed)
        // React Native will handle notifications when app is foreground via event listeners
        // Firebase will show notifications when app is background/killed
        // Removed isAppInForeground() check - it was blocking regular push notifications!
        
        // App може да е в foreground, background или killed
        // Handle data-only messages (когато няма notification payload)
        // CRITICAL: This handles regular messages (NEW_MESSAGE, etc.)
        // INCOMING_CALL is already handled above (line 175-196) and will NOT reach here
        if (remoteMessage.notification == null && remoteMessage.data.isNotEmpty()) {
            Log.d("SVMessengerFCM", "📬 Data-only message received - processing")
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
            // CRITICAL DEFENSIVE CHECK: INCOMING_CALL should NEVER reach here
            // Incoming calls are handled by IncomingCallService (line 175-196) and return early
            // This check prevents duplicate notifications if backend sends incorrect payload
            if (data["type"] == "INCOMING_CALL") {
                Log.e("SVMessengerFCM", "❌ CRITICAL BUG: INCOMING_CALL reached showNotification()!")
                Log.e("SVMessengerFCM", "❌ This should be handled by IncomingCallService only!")
                Log.e("SVMessengerFCM", "❌ Check backend payload - it should NOT call showNotification for calls")
                return // Prevent duplicate notification
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Determine channel based on notification type
            val channelId = when (data["type"]) {
                "INCOMING_CALL" -> NotificationChannelManager.CALLS_CHANNEL_ID // Should never happen (caught above)
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
            val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            // CRITICAL FIX: DEDUPLICATION
            // For incoming calls, use conversationId as the Notification ID to prevent stacking.
            // If multiple pushes arrive for the same call, they will update the existing one.
            val notificationId = if (isIncomingCall && data["conversationId"] != null) {
                try {
                    // Use hashCode of conversationId ensures uniqueness per conversation call
                    // We add a prefix/offset to avoid collision with other app notifications
                    val convId = data["conversationId"]
                    ("CALL_" + convId).hashCode()
                } catch (e: Exception) {
                    // Fallback to random if parsing fails
                     (System.currentTimeMillis() % Int.MAX_VALUE).toInt()
                }
            } else {
                 val timestamp = System.currentTimeMillis()
                 val rawCounter = notificationIdCounter.getAndIncrement()
                 val counterValue = rawCounter and 0xFFFF 
                 val maskedTimestampLong = timestamp and 0x7FF00000L 
                 val maskedTimestamp = maskedTimestampLong.toInt()
                 val notificationIdLong = maskedTimestamp.toLong() + counterValue
                 notificationIdLong.toInt()
            }
            
            val finalNotificationId = notificationId

            // For incoming calls, use Full Screen Intent to show call UI panel
            // For messages, use regular intent to open app
            // CRITICAL: Use notificationId as request code to ensure each notification has unique PendingIntent
            val pendingIntent = if (isIncomingCall) {
                // CRITICAL: For incoming calls, IncomingCallService already creates notification with Full Screen Intent
                // We should NOT create a second notification here - return early
                Log.d("SVMessengerFCM", "✅ Incoming call handled by IncomingCallService - skipping duplicate notification")
                return
            } else {
                // Regular intent for messages
                val notificationData = data
                val intent = Intent(this, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    notificationData["conversationId"]?.let { putExtra("conversationId", it) }
                    notificationData["type"]?.let { putExtra("notificationType", it) }
                }
                
                PendingIntent.getActivity(
                    this,
                    notificationId,
                    intent,
                    pendingIntentFlags
                )
            }

            // Build notification for regular messages (not incoming calls, which returned above)
            val notificationBuilder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationCompat.Builder(this, channelId)
            } else {
                NotificationCompat.Builder(this)
            }
            
            notificationBuilder
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title ?: "SVMessenger")
                .setContentText(body ?: "Ново съобщение")
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                
            // Show notification
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


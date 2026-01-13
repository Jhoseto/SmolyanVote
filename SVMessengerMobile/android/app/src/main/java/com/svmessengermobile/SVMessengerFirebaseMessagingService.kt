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
        
        // CRITICAL: Cancel again after very short delay to catch any that Firebase might show
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
        
        // CRITICAL FIX: For incoming calls, ALWAYS show Full Screen Intent when app is background/closed
        // When app is foreground, WebSocket already handled CALL_REQUEST - don't show IncomingCallActivity
        // This prevents conflicts and crashes when app is running
        if (isIncomingCall) {
            val appIsForeground = isAppInForeground()
            Log.d("SVMessengerFCM", "📞 Incoming call received (app state: ${if (appIsForeground) "foreground" else "background/closed"})")
            Log.d("SVMessengerFCM", "📞 Has notification payload: ${remoteMessage.notification != null} (should be false)")
            Log.d("SVMessengerFCM", "📞 Call data: ${remoteMessage.data}")
            
            // CRITICAL: If app is foreground, WebSocket already handled CALL_REQUEST
            // Don't show IncomingCallActivity to avoid conflicts
            if (appIsForeground) {
                Log.d("SVMessengerFCM", "⏭️ App is foreground - WebSocket already handled CALL_REQUEST, skipping Full Screen Intent")
                // CRITICAL: Still cancel any notifications that might have appeared
                try {
                    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    notificationManager.cancelAll()
                } catch (e: Exception) {
                    // Ignore errors
                }
                return
            }
            
            // CRITICAL: App is background/closed - MUST show Full Screen Intent
            Log.d("SVMessengerFCM", "📞 App is background/closed - showing Full Screen Intent")
            val callerName = remoteMessage.data["callerName"] ?: "Потребител"
            
            // CRITICAL: Start foreground service FIRST to keep app alive
            // This is ESSENTIAL for showing Full Screen Intent when app is completely closed
            // Without this, Android may kill the app before Full Screen Intent is shown
            try {
                IncomingCallService.startService(this, callerName)
                Log.d("SVMessengerFCM", "✅ Foreground service started for incoming call")
            } catch (e: Exception) {
                Log.e("SVMessengerFCM", "❌ CRITICAL: Failed to start foreground service:", e)
                e.printStackTrace()
                // CRITICAL: Continue anyway - try to show Full Screen Intent even without service
            }
            
            // CRITICAL: Show notification with Full Screen Intent
            // This MUST happen after foreground service is started
            try {
                showNotification(
                    "Входящо обаждане",
                    callerName,
                    remoteMessage.data
                )
                Log.d("SVMessengerFCM", "✅ Full Screen Intent notification posted")
            } catch (e: Exception) {
                Log.e("SVMessengerFCM", "❌ CRITICAL: Failed to show Full Screen Intent notification:", e)
                e.printStackTrace()
            }
            return
        }
        
        // For other notifications, skip if app is in foreground (no need to show notification)
        if (isAppInForeground()) {
            Log.d("SVMessengerFCM", "⏭️ App is in foreground - skipping notification (not an incoming call)")
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
                // CRITICAL FIX Bug 1: Capture notification data in local variable to avoid conflict with Intent's data property
                val notificationData = data
                val fullScreenIntent = Intent(this, IncomingCallActivity::class.java).apply {
                    // CRITICAL FIX: Add all necessary flags for lock screen and full screen display
                    // FLAG_ACTIVITY_NEW_TASK - Required for starting activity from background
                    // FLAG_ACTIVITY_CLEAR_TOP - Clear any existing instances
                    // FLAG_ACTIVITY_SINGLE_TOP - Don't create new instance if already on top
                    // FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS - Don't show in recent apps
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                            Intent.FLAG_ACTIVITY_CLEAR_TOP or
                            Intent.FLAG_ACTIVITY_SINGLE_TOP or
                            Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
                    notificationData["conversationId"]?.let { putExtra("conversationId", it) }
                    notificationData["callerName"]?.let { putExtra("callerName", it) }
                    notificationData["callerImageUrl"]?.let { putExtra("callerImageUrl", it) }
                    // CRITICAL FIX: Only add participantId if it can be successfully parsed
                    // If parsing fails (toLongOrNull() returns null), don't add the extra at all
                    // This preserves the protocol where hasExtra("participantId") only returns true
                    // when a valid participantId was actually provided
                    notificationData["participantId"]?.toLongOrNull()?.let { parsedParticipantId ->
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
                // CRITICAL FIX Bug 1: Capture notification data in local variable to avoid conflict with Intent's data property
                val notificationData = data
                val intent = Intent(this, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    notificationData["conversationId"]?.let { putExtra("conversationId", it) }
                    notificationData["type"]?.let { putExtra("notificationType", it) }
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
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            
            // CRITICAL: For incoming calls, use Full Screen Intent to show call UI on full screen
            // This works even when app is closed or phone is locked
            if (isIncomingCall) {
                // CRITICAL FIX: Check if notifications are enabled before showing Full Screen Intent
                // Full Screen Intent requires notifications to be enabled
                val areNotificationsEnabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    notificationManager.areNotificationsEnabled()
                } else {
                    true // Android 6 and below - assume enabled
                }
                
                Log.d("SVMessengerFCM", "📞 Notifications enabled: $areNotificationsEnabled")
                
                if (!areNotificationsEnabled) {
                    Log.e("SVMessengerFCM", "❌ CRITICAL: Notifications are disabled - Full Screen Intent will not work. User must enable notifications in Settings.")
                    // Try to launch activity directly as fallback
                    try {
                        val notificationData = data
                        val directIntent = Intent(this, IncomingCallActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                            notificationData["conversationId"]?.let { putExtra("conversationId", it) }
                            notificationData["callerName"]?.let { putExtra("callerName", it) }
                            notificationData["callerImageUrl"]?.let { putExtra("callerImageUrl", it) }
                            notificationData["participantId"]?.toLongOrNull()?.let { parsedParticipantId ->
                                putExtra("participantId", parsedParticipantId)
                            }
                        }
                        startActivity(directIntent)
                        Log.d("SVMessengerFCM", "📞 Launched IncomingCallActivity directly (notifications disabled)")
                        return
                    } catch (e: Exception) {
                        Log.e("SVMessengerFCM", "❌ Failed to launch IncomingCallActivity directly:", e)
                        return
                    }
                }
                
                // CRITICAL: Check notification channel importance for Android 8.0+ (API 26+)
                // Full Screen Intent requires IMPORTANCE_HIGH or higher
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val channel = notificationManager.getNotificationChannel(channelId)
                    if (channel != null) {
                        val importance = channel.importance
                        Log.d("SVMessengerFCM", "📞 Notification channel importance: $importance (required: IMPORTANCE_HIGH=${android.app.NotificationManager.IMPORTANCE_HIGH})")
                        if (importance < android.app.NotificationManager.IMPORTANCE_HIGH) {
                            Log.e("SVMessengerFCM", "❌ CRITICAL: Notification channel importance is too low ($importance) - Full Screen Intent requires IMPORTANCE_HIGH or higher")
                        }
                    } else {
                        Log.e("SVMessengerFCM", "❌ CRITICAL: Notification channel not found: $channelId")
                    }
                }
                
                // CRITICAL FIX: Use Full Screen Intent for all Android versions that support it (API 29+)
                // For older versions, try to launch activity directly with proper flags
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // Android Q+ (API 29+): Use Full Screen Intent
                    // Full Screen Intent directly shows IncomingCallActivity on full screen
                    // CRITICAL FIX: Full Screen Intent works on lock screen and when app is minimized
                    // The activity must have showWhenLocked and turnScreenOn flags set (already done in AndroidManifest and Activity)
                    // CRITICAL: Set Full Screen Intent FIRST - this is the most important setting
                    notificationBuilder.setFullScreenIntent(pendingIntent, true)
                    // CRITICAL: Set MAX priority - REQUIRED for Full Screen Intent to work on lock screen
                    notificationBuilder.setPriority(NotificationCompat.PRIORITY_MAX)
                    // CRITICAL: Set visibility to PUBLIC - REQUIRED for Full Screen Intent to work on lock screen
                    notificationBuilder.setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    notificationBuilder.setCategory(NotificationCompat.CATEGORY_CALL)
                    notificationBuilder.setOngoing(true)
                    notificationBuilder.setAutoCancel(false)
                    // CRITICAL FIX: Hide notification completely from notification bar - only show Full Screen Intent
                    // Android requires a notification for Full Screen Intent, but we can make it invisible
                    // The Full Screen Intent will show the activity directly on full screen
                    notificationBuilder.setContentTitle("") // Empty title - notification won't show in bar
                    notificationBuilder.setContentText("") // Empty text - notification won't show in bar
                    notificationBuilder.setSmallIcon(android.R.drawable.ic_dialog_info) // Required but won't be visible
                    // CRITICAL: Remove sound/vibration - activity handles sound
                    notificationBuilder.setSound(null)
                    notificationBuilder.setVibrate(null)
                    notificationBuilder.setLights(0, 0, 0)
                    notificationBuilder.setShowWhen(false) // Hide timestamp
                    // CRITICAL: Post notification - Full Screen Intent will show activity immediately
                    // The notification itself will be invisible in notification bar
                    try {
                        val notification = notificationBuilder.build()
                        notificationManager.notify(notificationId, notification)
                        Log.d("SVMessengerFCM", "✅ Full Screen Intent notification posted (Android Q+) - will show on lock screen and when app minimized")
                        Log.d("SVMessengerFCM", "📞 Notification ID: $notificationId, Channel: $channelId")
                        Log.d("SVMessengerFCM", "📞 Full Screen Intent PendingIntent created with flags: $pendingIntentFlags")
                        Log.d("SVMessengerFCM", "📞 Notification has Full Screen Intent: ${notification.fullScreenIntent != null}")
                        
                        // CRITICAL FIX: Cancel notification MULTIPLE times with increasing delays
                        // Firebase can show notification asynchronously, so we need multiple cancel attempts
                        val cancelDelays = intArrayOf(1, 5, 10, 25, 50, 100, 200, 500) // More aggressive cancel attempts
                        cancelDelays.forEach { delay ->
                            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                                try {
                                    notificationManager.cancel(notificationId)
                                    notificationManager.cancelAll() // Also cancel all as safety
                                    if (delay <= 10) { // Log only for initial cancels to avoid spam
                                        Log.d("SVMessengerFCM", "✅ Notification cancelled at ${delay}ms (Full Screen Intent triggered)")
                                    }
                                } catch (e: Exception) {
                                    // Ignore errors in cancel attempts
                                }
                            }, delay.toLong())
                        }
                        
                        // CRITICAL: Also cancel ALL notifications as final safety net
                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                            try {
                                notificationManager.cancelAll()
                                Log.d("SVMessengerFCM", "✅ Final safety cancel - removed ALL notifications")
                            } catch (e: Exception) {
                                // Ignore errors
                            }
                        }, 1000) // Final safety net after 1 second
                    } catch (e: SecurityException) {
                        Log.e("SVMessengerFCM", "❌ SecurityException when posting Full Screen Intent notification - permission may be missing:", e)
                        // Fallback: Try to launch activity directly
                        try {
                            val notificationData = data
                            val directIntent = Intent(this, IncomingCallActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                                notificationData["conversationId"]?.let { putExtra("conversationId", it) }
                                notificationData["callerName"]?.let { putExtra("callerName", it) }
                                notificationData["callerImageUrl"]?.let { putExtra("callerImageUrl", it) }
                                notificationData["participantId"]?.toLongOrNull()?.let { parsedParticipantId ->
                                    putExtra("participantId", parsedParticipantId)
                                }
                            }
                            startActivity(directIntent)
                            Log.d("SVMessengerFCM", "📞 Fallback: Launched IncomingCallActivity directly after SecurityException")
                        } catch (fallbackError: Exception) {
                            Log.e("SVMessengerFCM", "❌ Fallback failed - could not launch IncomingCallActivity:", fallbackError)
                        }
                    } catch (e: Exception) {
                        Log.e("SVMessengerFCM", "❌ Unexpected error when posting Full Screen Intent notification:", e)
                        e.printStackTrace()
                    }
                } else {
                    // Android P and below (API < 29): Full Screen Intent not available
                    // CRITICAL FIX: Try to launch IncomingCallActivity directly with proper flags
                    // This allows the activity to show on lockscreen even on older Android versions
                    var directLaunchSucceeded = false
                    try {
                        // CRITICAL FIX Bug 1: Capture notification data in local variable to avoid conflict with Intent's data property
                        val notificationData = data
                        val directIntent = Intent(this, IncomingCallActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                            notificationData["conversationId"]?.let { putExtra("conversationId", it) }
                            notificationData["callerName"]?.let { putExtra("callerName", it) }
                            notificationData["callerImageUrl"]?.let { putExtra("callerImageUrl", it) }
                            notificationData["participantId"]?.toLongOrNull()?.let { parsedParticipantId ->
                                putExtra("participantId", parsedParticipantId)
                            }
                        }
                        // CRITICAL: Start activity directly - this may work on some devices even without Full Screen Intent
                        startActivity(directIntent)
                        directLaunchSucceeded = true
                        Log.d("SVMessengerFCM", "📞 Successfully launched IncomingCallActivity directly (Android P and below) - no notification needed")
                    } catch (e: Exception) {
                        Log.e("SVMessengerFCM", "❌ Failed to launch IncomingCallActivity directly:", e)
                        // Fallback: Show notification (user must tap to open)
                    }
                    
                    // CRITICAL FIX: Only show notification if direct launch failed
                    // If direct launch succeeded, no notification is needed
                    if (!directLaunchSucceeded) {
                        notificationBuilder.setAutoCancel(false)
                        notificationBuilder.setCategory(NotificationCompat.CATEGORY_CALL)
                        notificationBuilder.setOngoing(true)
                        notificationBuilder.setPriority(NotificationCompat.PRIORITY_MAX)
                        notificationBuilder.setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        notificationBuilder.setDefaults(NotificationCompat.DEFAULT_ALL)
                        notificationManager.notify(notificationId, notificationBuilder.build())
                        Log.d("SVMessengerFCM", "📞 Notification shown for incoming call (Android P and below) - direct launch failed, user can tap to open")
                    }
                }
            } else {
                // Regular messages: Show normal notification
                notificationBuilder.setAutoCancel(true)
                notificationManager.notify(notificationId, notificationBuilder.build())
                Log.d("SVMessengerFCM", "✅ Notification shown: id=$notificationId, channel=$channelId")
            }
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


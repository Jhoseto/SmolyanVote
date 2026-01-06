package com.svmessengermobile

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

/**
 * Firebase Messaging Service
 * Обработва push notifications когато app-ът е в background или затворен
 */
class SVMessengerFirebaseMessagingService : FirebaseMessagingService() {

    override fun onCreate() {
        super.onCreate()
        Log.d("SVMessengerFCM", "🔥 Firebase Messaging Service created")
    }

    /**
     * Called when message is received in background or when app is closed
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d("SVMessengerFCM", "📬 Background notification received: ${remoteMessage.messageId}")
        Log.d("SVMessengerFCM", "📬 Notification data: ${remoteMessage.data}")
        Log.d("SVMessengerFCM", "📬 Notification payload: ${remoteMessage.notification}")

        // Handle data-only messages (when notification payload is null)
        if (remoteMessage.notification == null && remoteMessage.data.isNotEmpty()) {
            Log.d("SVMessengerFCM", "📬 Data-only message received")
            handleDataMessage(remoteMessage)
            return
        }

        // Handle notification messages
        remoteMessage.notification?.let { notification ->
            Log.d("SVMessengerFCM", "📬 Notification message: title=${notification.title}, body=${notification.body}")
            showNotification(notification.title, notification.body, remoteMessage.data)
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
     */
    private fun showNotification(title: String?, body: String?, data: Map<String, String>) {
        try {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Determine channel based on notification type
            val channelId = when (data["type"]) {
                "INCOMING_CALL" -> NotificationChannelManager.CALLS_CHANNEL_ID
                else -> NotificationChannelManager.MESSAGES_CHANNEL_ID
            }

            // Create intent to open app
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                // Add conversation ID if available
                data["conversationId"]?.let { putExtra("conversationId", it) }
                data["type"]?.let { putExtra("notificationType", it) }
            }

            // FLAG_IMMUTABLE is required from Android 12+ (API 31)
            // For Android 11 and below, use FLAG_UPDATE_CURRENT only
            val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                pendingIntentFlags
            )

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

            // Sound is handled by notification channel settings
            // Don't override - let the channel sound play
            // The channel already has custom sound configured in NotificationChannelManager

            // Show notification
            val notificationId = System.currentTimeMillis().toInt()
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


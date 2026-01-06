package com.svmessengermobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap

/**
 * Notification Module for React Native
 * Показва local notifications когато app-ът е в foreground
 */
class NotificationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NotificationModule"
    }

    @ReactMethod
    fun showNotification(
        title: String,
        body: String,
        data: ReadableMap?,
        promise: Promise
    ) {
        try {
            val context = reactApplicationContext
            
            // Determine channel based on notification type
            val notificationType = data?.getString("type") ?: "NEW_MESSAGE"
            val channelId = when (notificationType) {
                "INCOMING_CALL" -> NotificationChannelManager.CALLS_CHANNEL_ID
                else -> NotificationChannelManager.MESSAGES_CHANNEL_ID
            }

            // Create intent to open app
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                // Add conversation ID if available
                data?.getString("conversationId")?.let { putExtra("conversationId", it) }
                data?.getString("type")?.let { putExtra("notificationType", it) }
            }

            // FLAG_IMMUTABLE is required from Android 12+ (API 31)
            // For Android 11 and below, use FLAG_UPDATE_CURRENT only
            val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                pendingIntentFlags
            )

            // Build notification
            // For Android 8.0+ (API 26+), use channel ID
            // For older versions, NotificationCompat handles it automatically
            val notificationBuilder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationCompat.Builder(context, channelId)
            } else {
                NotificationCompat.Builder(context)
            }
            
            notificationBuilder
                .setSmallIcon(android.R.drawable.ic_dialog_info) // TODO: Use custom icon
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

            // Sound is handled by notification channel settings
            // Don't override - let the channel sound play
            // The channel already has custom sound configured in NotificationChannelManager

            // Show notification
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val notificationId = System.currentTimeMillis().toInt()
            notificationManager.notify(notificationId, notificationBuilder.build())
            
            Log.d("NotificationModule", "✅ Notification shown: id=$notificationId, channel=$channelId, title=$title")
            promise.resolve(notificationId)
        } catch (e: Exception) {
            Log.e("NotificationModule", "❌ Error showing notification:", e)
            e.printStackTrace()
            promise.reject("NOTIFICATION_ERROR", "Error showing notification: ${e.message}", e)
        }
    }
}


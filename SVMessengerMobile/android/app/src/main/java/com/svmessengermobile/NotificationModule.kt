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
import androidx.localbroadcastmanager.content.LocalBroadcastManager
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
    
    /**
     * Send broadcast when call state changes
     * CRITICAL: This allows IncomingCallActivity to automatically close when call ends
     */
    @ReactMethod
    fun sendCallStateBroadcast(callState: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            
            // CRITICAL: Send both specific action AND CALL_STATE_CHANGED with state in extra
            // This ensures compatibility with both old and new broadcast receivers
            val stateUpper = callState.uppercase()
            
            // Send specific action broadcast (for compatibility)
            val specificIntent = Intent().apply {
                when (stateUpper) {
                    "IDLE" -> action = "com.svmessengermobile.CALL_IDLE"
                    "DISCONNECTED" -> action = "com.svmessengermobile.CALL_ENDED"
                    "REJECTED" -> action = "com.svmessengermobile.CALL_REJECTED"
                    else -> {
                        // For unknown states, still send CALL_STATE_CHANGED
                    }
                }
            }
            if (specificIntent.action != null) {
                LocalBroadcastManager.getInstance(context).sendBroadcast(specificIntent)
                Log.d("NotificationModule", "✅ Specific call state broadcast sent: ${specificIntent.action}")
            }
            
            // CRITICAL: Also send CALL_STATE_CHANGED with state in extra (for new receivers)
            val stateIntent = Intent("com.svmessengermobile.CALL_STATE_CHANGED").apply {
                putExtra("state", stateUpper)
            }
            LocalBroadcastManager.getInstance(context).sendBroadcast(stateIntent)
            Log.d("NotificationModule", "✅ CALL_STATE_CHANGED broadcast sent: state=$stateUpper")
            
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("NotificationModule", "❌ Error sending call state broadcast:", e)
            e.printStackTrace()
            promise.reject("BROADCAST_ERROR", "Error sending broadcast: ${e.message}", e)
        }
    }
    
    /**
     * Show Full Screen Intent for incoming call from React Native background handler
     * CRITICAL: This is called when app is closed and Firebase doesn't call onMessageReceived
     * This method replicates the logic from SVMessengerFirebaseMessagingService.showNotification
     */
    @ReactMethod
    fun showIncomingCallFullScreenIntent(data: ReadableMap, promise: Promise) {
        try {
            val context = reactApplicationContext
            Log.d("NotificationModule", "📞 showIncomingCallFullScreenIntent called from React Native background handler")
            
            // Extract call data
            val conversationId = data.getString("conversationId")
            val callerName = data.getString("callerName") ?: "Потребител"
            val callerImageUrl = data.getString("callerImageUrl")
            val participantId = data.getString("participantId")?.toLongOrNull()
            
            Log.d("NotificationModule", "📞 Call data: conversationId=$conversationId, callerName=$callerName, participantId=$participantId")
            
                // CRITICAL: Start foreground service to keep app alive
            // This is ESSENTIAL for showing Full Screen Intent when app is completely closed
            try {
                IncomingCallService.startService(
                    context, 
                    callerName,
                    conversationId,
                    callerImageUrl,
                    participantId
                )
                Log.d("NotificationModule", "✅ Foreground service started for incoming call")
            } catch (e: Exception) {
                Log.e("NotificationModule", "❌ Failed to start foreground service:", e)
                // Continue anyway - try to show Full Screen Intent even without service
            }
            
            // CRITICAL: Use the same logic as SVMessengerFirebaseMessagingService.showNotification
            // This ensures consistency and proper Full Screen Intent display
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channelId = NotificationChannelManager.CALLS_CHANNEL_ID
            
            // Generate unique notification ID (same logic as SVMessengerFirebaseMessagingService)
            val timestamp = System.currentTimeMillis()
            val notificationId = (timestamp and 0x7FFFFFFF).toInt() // Use timestamp as ID
            
            // Create Full Screen Intent
            val fullScreenIntent = Intent(context, IncomingCallActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
                conversationId?.let { putExtra("conversationId", it) }
                putExtra("callerName", callerName)
                callerImageUrl?.let { putExtra("callerImageUrl", it) }
                participantId?.let { putExtra("participantId", it) }
            }
            
            val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            
            val pendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                fullScreenIntent,
                pendingIntentFlags
            )
            
            // Build notification with Full Screen Intent
            val notificationBuilder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationCompat.Builder(context, channelId)
            } else {
                NotificationCompat.Builder(context)
            }
            
            // CRITICAL: For Android Q+ (API 29+), use Full Screen Intent
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                notificationBuilder.setFullScreenIntent(pendingIntent, true)
                notificationBuilder.setPriority(NotificationCompat.PRIORITY_MAX)
                notificationBuilder.setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                notificationBuilder.setCategory(NotificationCompat.CATEGORY_CALL)
                notificationBuilder.setOngoing(true)
                notificationBuilder.setAutoCancel(false)
                // Hide notification from bar - only show Full Screen Intent
                notificationBuilder.setContentTitle("")
                notificationBuilder.setContentText("")
                notificationBuilder.setSmallIcon(android.R.drawable.ic_dialog_info)
                notificationBuilder.setSound(null)
                notificationBuilder.setVibrate(null)
                notificationBuilder.setLights(0, 0, 0)
                notificationBuilder.setShowWhen(false)
                
                // Post notification
                val notification = notificationBuilder.build()
                notificationManager.notify(notificationId, notification)
                Log.d("NotificationModule", "✅ Full Screen Intent notification posted from React Native background handler")
                
                // REMOVED: Aggressive cancellation loops
                // We rely on IncomingCallActivity to cancel the notification when the user answers/declines
                Log.d("NotificationModule", "✅ Full Screen Intent posted from React Native BG. Waiting for user interaction.")
            } else {
                // Android P and below - try to launch activity directly
                try {
                    context.startActivity(fullScreenIntent)
                    Log.d("NotificationModule", "📞 Launched IncomingCallActivity directly (Android P-)")
                } catch (e: Exception) {
                    Log.e("NotificationModule", "❌ Failed to launch IncomingCallActivity directly:", e)
                    promise.reject("LAUNCH_ERROR", "Failed to launch IncomingCallActivity: ${e.message}", e)
                    return
                }
            }
            
            promise.resolve(notificationId)
        } catch (e: Exception) {
            Log.e("NotificationModule", "❌ Error showing Full Screen Intent:", e)
            e.printStackTrace()
            promise.reject("FULL_SCREEN_INTENT_ERROR", "Error showing Full Screen Intent: ${e.message}", e)
        }
    }
}




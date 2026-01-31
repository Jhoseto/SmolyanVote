package com.svmessengermobile

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * Foreground Service for incoming calls
 * CRITICAL: This service keeps the app alive in background to show Full Screen Intent
 * This is essential for showing incoming calls when app is closed or phone is locked
 * 
 * Professional Best Practice: Using foreground service ensures incoming calls work reliably
 * Similar to WhatsApp, Telegram, Facebook Messenger - all use foreground service for calls
 */
class IncomingCallService : Service() {

    companion object {
        private const val CHANNEL_ID = "svmessenger_incoming_call_v3" // CHANGED: Force new channel with HIGH importance
        private const val NOTIFICATION_ID = 999999 // Unique ID for service notification
        private const val ACTION_STOP_SERVICE = "com.svmessengermobile.STOP_INCOMING_CALL_SERVICE"

        /**
         * Start incoming call service
         * CRITICAL: This must be called when showing incoming call to keep app alive
         */
        fun startService(context: Context, callerName: String, conversationId: String?, callerImageUrl: String?, participantId: Long?) {
            val intent = Intent(context, IncomingCallService::class.java).apply {
                putExtra("callerName", callerName)
                conversationId?.let { putExtra("conversationId", it) }
                callerImageUrl?.let { putExtra("callerImageUrl", it) }
                participantId?.let { putExtra("participantId", it) }
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            Log.d("IncomingCallService", "📞 Service start requested for caller: $callerName")
        }

        /**
         * Stop incoming call service
         * CRITICAL: This must be called when call is answered or rejected
         */
        fun stopService(context: Context) {
            val intent = Intent(context, IncomingCallService::class.java)
            context.stopService(intent)
            Log.d("IncomingCallService", "📞 Service stop requested")
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.d("IncomingCallService", "📞 IncomingCallService created")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("IncomingCallService", "📞 IncomingCallService started")

        val callerName = intent?.getStringExtra("callerName") ?: "Потребител"
        val conversationId = intent?.getStringExtra("conversationId")
        val callerImageUrl = intent?.getStringExtra("callerImageUrl")
        val participantId = intent?.getLongExtra("participantId", 0L)

        // CRITICAL FIX: Start IncomingCallActivity IMMEDIATELY for instant display
        // This shows the call UI right away while service starts in background
        // Eliminates the "ugly notification first" problem
        try {
            val activityIntent = Intent(this, IncomingCallActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or 
                         Intent.FLAG_ACTIVITY_SINGLE_TOP or
                         Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
                putExtra("callerName", callerName)
                conversationId?.let { putExtra("conversationId", it) }
                callerImageUrl?.let { putExtra("callerImageUrl", it) }
                putExtra("participantId", participantId)
            }
            startActivity(activityIntent)
            Log.d("IncomingCallService", "✅ Started IncomingCallActivity directly")
        } catch (e: Exception) {
            Log.e("IncomingCallService", "❌ Failed to start activity directly:", e)
        }

        // CRITICAL: Start foreground service with Full Screen Intent notification
        // The notification serves as backup if activity fails to start
        val notification = createNotification(callerName, conversationId, callerImageUrl, participantId)
        
        // CRITICAL FIX: Specify foreground service type for Android 14+
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+
            try {
                // Use reflection or hardcoded value for FOREGROUND_SERVICE_TYPE_SHORT_SERVICE (2048)
                // ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE = 2048
                startForeground(NOTIFICATION_ID, notification, 2048)
            } catch (e: Exception) {
                startForeground(NOTIFICATION_ID, notification)
            }
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        Log.d("IncomingCallService", "📞 Foreground service started for caller: $callerName")

        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Delete old channel to ensure fresh settings
            try {
                notificationManager.deleteNotificationChannel("svmessenger_incoming_call_service")
            } catch (e: Exception) {
                // Ignore
            }

            // CRITICAL: Use HIGH importance for Full Screen Intent to work
            // Android requires HIGH priority notification to trigger Full Screen Intent
            // We will dismiss the notification immediately when IncomingCallActivity starts
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Входящи обаждания",
                NotificationManager.IMPORTANCE_HIGH // MUST be HIGH for Full Screen Intent
            ).apply {
                description = "Известия за входящи разговори"
                setShowBadge(false)
                // Set default sound - will be dismissed before it plays
                val soundUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE)
                val audioAttributes = android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
                setSound(soundUri, audioAttributes)
                enableVibration(false) // No vibration - Activity handles it
                enableLights(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(callerName: String, conversationId: String?, callerImageUrl: String?, participantId: Long?): Notification {
        // CRITICAL FIX: Full Screen Intent REQUIRES FLAG_ACTIVITY_NEW_TASK to work!
        // NEW_TASK is mandatory for FSI, but CLEAR_TOP is what kills the app
        // Use NEW_TASK + SINGLE_TOP to trigger FSI without destroying MainActivity
        val fullScreenIntent = Intent(this, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            putExtra("callerName", callerName)
            conversationId?.let { putExtra("conversationId", it) }
            callerImageUrl?.let { putExtra("callerImageUrl", it) }
            participantId?.let { putExtra("participantId", it) }
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            112233, // Unique request code
            fullScreenIntent,
            pendingIntentFlags
        )


        // CRITICAL: Full Screen Intent REQUIRES HIGH/MAX priority!
        // BUT we can make notification invisible via SECRET visibility and empty content
        // User will NEVER see notification tray icon - only the Full Screen Intent Activity
        // IncomingCallActivity cancels notification immediately (line 62)
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("") // Empty - won't show in notification tray
            .setContentText("") // Empty - won't show in notification tray
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setPriority(NotificationCompat.PRIORITY_MAX) // MAX REQUIRED for Full Screen Intent!
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET) // SECRET - invisible on lockscreen
            .setOngoing(false) 
            .setAutoCancel(true)
            .setOnlyAlertOnce(true) // No repeated alerts
            .setSilent(true) // Completely silent
            .setSound(null) // No sound (IncomingCallActivity plays sound)
            .setVibrate(null) // No vibration
            .setTimeoutAfter(60000) // Auto-cancel after 60 seconds
            // CRITICAL: Full Screen Intent - this is what user sees!
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)

        return builder.build()
    }
}

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
        private const val CHANNEL_ID = "svmessenger_incoming_call_service"
        private const val NOTIFICATION_ID = 999999 // Unique ID for service notification
        private const val ACTION_STOP_SERVICE = "com.svmessengermobile.STOP_INCOMING_CALL_SERVICE"

        /**
         * Start incoming call service
         * CRITICAL: This must be called when showing incoming call to keep app alive
         */
        fun startService(context: Context, callerName: String) {
            val intent = Intent(context, IncomingCallService::class.java).apply {
                putExtra("callerName", callerName)
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

        // CRITICAL: Start foreground service immediately
        // This prevents the service from being killed by the system
        val notification = createNotification(callerName)
        startForeground(NOTIFICATION_ID, notification)

        Log.d("IncomingCallService", "📞 Foreground service started for caller: $callerName")

        // Return START_NOT_STICKY - service should not be restarted if killed
        // Incoming calls are time-sensitive, restarting doesn't make sense
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        // This is a started service, not bound
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d("IncomingCallService", "📞 IncomingCallService destroyed")
    }

    /**
     * Create notification channel for foreground service
     * CRITICAL: Channel must exist on Android O+ (API 26+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Входящи обаждания",
                NotificationManager.IMPORTANCE_LOW // Low importance - don't show notification
            ).apply {
                description = "Foreground service за входящи обаждания"
                setShowBadge(false)
                // CRITICAL: Silent notification - no sound, no vibration
                setSound(null, null)
                enableVibration(false)
                enableLights(false)
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Create notification for foreground service
     * CRITICAL: This notification is required for foreground service but should be invisible
     */
    private fun createNotification(callerName: String): Notification {
        // Create intent to open IncomingCallActivity if user taps notification
        val intent = Intent(this, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

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

        // Build minimal notification
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Входящо обаждане")
            .setContentText(callerName)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(pendingIntent)
            .setAutoCancel(false)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW) // Low priority - don't intrude
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setSilent(true) // Silent - no sound, no vibration

        return builder.build()
    }
}

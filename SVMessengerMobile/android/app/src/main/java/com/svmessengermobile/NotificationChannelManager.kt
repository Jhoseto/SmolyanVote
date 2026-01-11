package com.svmessengermobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build

object NotificationChannelManager {
    const val MESSAGES_CHANNEL_ID = "svmessenger_messages"
    const val CALLS_CHANNEL_ID = "svmessenger_calls"
    
    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Audio attributes for notification sounds
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            
            // Get sound URI for messages (s1.mp3)
            val messagesSoundUri = getSoundUri(context, "s1")
            
            // Messages channel
            val messagesChannel = NotificationChannel(
                MESSAGES_CHANNEL_ID,
                "Съобщения",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Нотификации за нови съобщения"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
                // Set custom sound for messages
                if (messagesSoundUri != null) {
                    setSound(messagesSoundUri, audioAttributes)
                }
            }
            
            // Get sound URI for calls (incoming_call.mp3)
            val callsSoundUri = getSoundUri(context, "incoming_call")
            
            // Calls channel
            // CRITICAL: IMPORTANCE_HIGH is required for Full Screen Intent to work
            val callsChannel = NotificationChannel(
                CALLS_CHANNEL_ID,
                "Обаждания",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Нотификации за входящи обаждания"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
                // Set custom sound for calls
                if (callsSoundUri != null) {
                    setSound(callsSoundUri, audioAttributes)
                }
            }
            
            notificationManager.createNotificationChannel(messagesChannel)
            notificationManager.createNotificationChannel(callsChannel)
        }
    }
    
    /**
     * Get sound URI from raw resources
     */
    private fun getSoundUri(context: Context, soundName: String): Uri? {
        return try {
            val resourceId = context.resources.getIdentifier(soundName, "raw", context.packageName)
            if (resourceId != 0) {
                Uri.parse("android.resource://${context.packageName}/$resourceId")
            } else {
                android.util.Log.w("NotificationChannelManager", "Sound not found: $soundName")
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("NotificationChannelManager", "Error getting sound URI for $soundName:", e)
            null
        }
    }
}


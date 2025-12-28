package com.svmessengermobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

object NotificationChannelManager {
    const val MESSAGES_CHANNEL_ID = "svmessenger_messages"
    const val CALLS_CHANNEL_ID = "svmessenger_calls"
    
    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Messages channel
            val messagesChannel = NotificationChannel(
                MESSAGES_CHANNEL_ID,
                "Съобщения",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Нотификации за нови съобщения"
                enableVibration(true)
                enableLights(true)
            }
            
            // Calls channel
            val callsChannel = NotificationChannel(
                CALLS_CHANNEL_ID,
                "Обаждания",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Нотификации за входящи обаждания"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
            }
            
            notificationManager.createNotificationChannel(messagesChannel)
            notificationManager.createNotificationChannel(callsChannel)
        }
    }
}


package com.svmessengermobile

import android.app.Activity
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

/**
 * Permissions Module
 * Проверява и управлява permissions и настройки които не могат да се request runtime
 */
class PermissionsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PermissionsModule"
    }

    /**
     * Check if Full Screen Intent permission is granted
     * CRITICAL: On Android 12+ (API 31+), USE_FULL_SCREEN_INTENT is a special permission
     * that can be checked but not requested runtime. User must enable it in Settings.
     * On Android 11 and below, it's granted automatically if declared in manifest.
     */
    @ReactMethod
    fun checkFullScreenIntentPermission(promise: Promise) {
        try {
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            val result = Arguments.createMap()
            
            // CRITICAL FIX: Check notifications first - Full Screen Intent requires notifications to be enabled
            val areNotificationsEnabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                notificationManager.areNotificationsEnabled()
            } else {
                true // Android 6 and below - assume enabled
            }
            
            if (!areNotificationsEnabled) {
                // Notifications are disabled - Full Screen Intent won't work
                result.putBoolean("granted", false)
                result.putBoolean("canRequest", false)
                result.putString("reason", "Notifications are disabled")
                promise.resolve(result)
                return
            }
            
            // CRITICAL FIX: On Android 12+ (API 31+), check if app can use Full Screen Intent
            // This requires checking notification channel importance and system settings
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // Android 12+ (API 31+): Full Screen Intent permission is granted if:
                // 1. Notifications are enabled (already checked)
                // 2. App is not restricted by system
                // We can't directly check USE_FULL_SCREEN_INTENT, but we can check if notifications work
                // If notifications work and channel has IMPORTANCE_HIGH, Full Screen Intent should work
                val callsChannel = notificationManager.getNotificationChannel(NotificationChannelManager.CALLS_CHANNEL_ID)
                val channelImportance = callsChannel?.importance ?: NotificationManager.IMPORTANCE_DEFAULT
                
                // Full Screen Intent requires IMPORTANCE_HIGH or higher
                val hasHighImportance = channelImportance >= NotificationManager.IMPORTANCE_HIGH
                
                result.putBoolean("granted", hasHighImportance)
                result.putBoolean("canRequest", false) // Can't request runtime on Android 12+
                result.putString("reason", if (hasHighImportance) "Granted" else "Notification channel importance too low")
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10-11 (API 29-30): Full Screen Intent is granted if notifications are enabled
                // and app has USE_FULL_SCREEN_INTENT in manifest (already declared)
                result.putBoolean("granted", true)
                result.putBoolean("canRequest", false)
                result.putString("reason", "Granted (Android 10-11)")
            } else {
                // Android 9 and below - granted automatically if in manifest
                result.putBoolean("granted", true)
                result.putBoolean("canRequest", false)
                result.putString("reason", "Granted (Android 9 and below)")
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", "Error checking Full Screen Intent permission: ${e.message}", e)
        }
    }

    /**
     * Open Full Screen Intent permission settings
     */
    @ReactMethod
    fun openFullScreenIntentSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                data = Uri.parse("package:${reactApplicationContext.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", "Error opening Full Screen Intent settings: ${e.message}", e)
        }
    }

    /**
     * Check if battery optimization is disabled (unrestricted)
     * Battery optimization can block background services and notifications
     */
    @ReactMethod
    fun checkBatteryOptimization(promise: Promise) {
        try {
            val result = Arguments.createMap()
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
                val packageName = reactApplicationContext.packageName
                val isIgnoringBatteryOptimizations = powerManager.isIgnoringBatteryOptimizations(packageName)
                
                result.putBoolean("isIgnoring", isIgnoringBatteryOptimizations)
                result.putBoolean("canRequest", true)
            } else {
                // Android 5 and below - no battery optimization
                result.putBoolean("isIgnoring", true)
                result.putBoolean("canRequest", false)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("BATTERY_CHECK_ERROR", "Error checking battery optimization: ${e.message}", e)
        }
    }

    /**
     * Open battery optimization settings
     */
    @ReactMethod
    fun openBatteryOptimizationSettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(false) // Not available on older Android versions
            }
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", "Error opening battery optimization settings: ${e.message}", e)
        }
    }

    /**
     * Request to ignore battery optimization
     */
    @ReactMethod
    fun requestIgnoreBatteryOptimization(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
                val packageName = reactApplicationContext.packageName
                
                if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    
                    // Get current activity to start intent
                    val currentActivity = reactApplicationContext.currentActivity
                    if (currentActivity != null) {
                        currentActivity.startActivity(intent)
                        promise.resolve(true)
                    } else {
                        promise.reject("NO_ACTIVITY", "No current activity available")
                    }
                } else {
                    promise.resolve(true) // Already ignoring
                }
            } else {
                promise.resolve(true) // Not needed on older Android versions
            }
        } catch (e: Exception) {
            promise.reject("BATTERY_REQUEST_ERROR", "Error requesting battery optimization: ${e.message}", e)
        }
    }
}

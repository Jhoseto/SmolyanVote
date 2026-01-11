package com.svmessengermobile

import android.app.Activity
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
     * This permission can't be requested runtime - user must enable it in Settings
     */
    @ReactMethod
    fun checkFullScreenIntentPermission(promise: Promise) {
        try {
            // Full Screen Intent permission is granted if app can show notifications
            // We can't directly check this, but we can check if notifications are enabled
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            
            val result = Arguments.createMap()
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val areNotificationsEnabled = notificationManager.areNotificationsEnabled()
                result.putBoolean("granted", areNotificationsEnabled)
                result.putBoolean("canRequest", false) // Can't request runtime
            } else {
                // Android 6 and below - assume granted
                result.putBoolean("granted", true)
                result.putBoolean("canRequest", false)
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

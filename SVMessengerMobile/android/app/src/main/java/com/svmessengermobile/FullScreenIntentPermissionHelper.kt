package com.svmessengermobile

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.annotation.RequiresApi

/**
 * Helper class for managing system permissions required for Full Screen Intent
 * 
 * CRITICAL: On Android 10+ (API 29+), Full Screen Intent requires:
 * 1. SYSTEM_ALERT_WINDOW permission (Display over other apps)
 * 2. Battery optimization disabled (optional but recommended)
 * 
 * Without these, Full Screen Intent will NOT show when app is background/killed
 */
object FullScreenIntentPermissionHelper {
    
    private const val TAG = "FSI_PermissionHelper"
    
    /**
     * Check if app has "Display over other apps" permission
     * CRITICAL: This is REQUIRED for Full Screen Intent to work in background
     */
    fun canDrawOverlays(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            // Pre-Marshmallow doesn't require this permission
            true
        }
    }
    
    /**
     * Open Settings page for "Display over other apps" permission
     */
    @RequiresApi(Build.VERSION_CODES.M)
    fun openDrawOverlaysSettings(context: Context) {
        try {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            )
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            Log.d(TAG, "Opened 'Display over other apps' settings")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open overlay settings", e)
        }
    }
    
    /**
     * Check if battery optimization is disabled for the app
     * RECOMMENDED but not strictly required for Full Screen Intent
     */
    fun isBatteryOptimizationDisabled(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            powerManager.isIgnoringBatteryOptimizations(context.packageName)
        } else {
            true
        }
    }
    
    /**
     * Open Settings page for battery optimization
     */
    @RequiresApi(Build.VERSION_CODES.M)
    fun openBatteryOptimizationSettings(context: Context) {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = Uri.parse("package:${context.packageName}")
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            Log.d(TAG, "Opened battery optimization settings")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open battery optimization settings", e)
            // Fallback: Open general battery settings
            try {
                val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                fallbackIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(fallbackIntent)
            } catch (fallbackError: Exception) {
                Log.e(TAG, "Fallback also failed", fallbackError)
            }
        }
    }
    
    /**
     * Check if ALL required permissions are granted
     */
    fun hasAllRequiredPermissions(context: Context): Boolean {
        val canDrawOverlays = canDrawOverlays(context)
        val batteryOptDisabled = isBatteryOptimizationDisabled(context)
        
        Log.d(TAG, "Permission status: canDrawOverlays=$canDrawOverlays, batteryOptDisabled=$batteryOptDisabled")
        
        // Battery optimization is RECOMMENDED but not strictly required
        // Only require canDrawOverlays for Android 10+
        return canDrawOverlays
    }
    
    /**
     * Get user-friendly explanation of what permissions are needed
     */
    fun getPermissionExplanation(): String {
        return """
            За да показваме входящи обаждания когато приложението е минимизирано или затворено, трябва да разрешите:
            
            1. "Показване върху други приложения" - ЗАДЪЛЖИТЕЛНО
               Позволява на обаждането да се показва на цял екран
            
            2. "Изключване от оптимизация на батерията" - ПРЕПОРЪЧИТЕЛНО
               Осигурява надеждно получаване на обаждания
        """.trimIndent()
    }
}

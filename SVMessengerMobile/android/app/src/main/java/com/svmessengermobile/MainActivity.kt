package com.svmessengermobile

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Collections

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    android.util.Log.d("MainActivity", "🚀 onCreate() called")
    try {
      super.onCreate(savedInstanceState)
      android.util.Log.d("MainActivity", "✅ onCreate() completed")
      
      // CRITICAL: Check and request required permissions for Full Screen Intent
      checkAndRequestFullScreenIntentPermissions()
      
      // Handle incoming call actions from IncomingCallActivity
      handleIncomingCallAction(intent)
      
      // Enable React Native Dev Menu for debugging
      // This allows shaking device or pressing Ctrl+M to open Dev Menu
      android.util.Log.d("MainActivity", "🔧 Dev Menu enabled for debugging")
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "❌ CRITICAL: onCreate() failed:", e)
      e.printStackTrace()
      throw e
    }
  }
  
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    // Handle incoming call actions when activity is already running
    intent?.let { handleIncomingCallAction(it) }
  }
  
  /**
   * Check and log required permissions for Full Screen Intent
   * CRITICAL: React Native will show custom permission screen
   * MainActivity only checks and logs status - does NOT force Settings opening
   */
  private fun checkAndRequestFullScreenIntentPermissions() {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val canDrawOverlays = FullScreenIntentPermissionHelper.canDrawOverlays(this)
        val batteryOptDisabled = FullScreenIntentPermissionHelper.isBatteryOptimizationDisabled(this)
        
        android.util.Log.d("MainActivity", "🔐 Permission status:")
        android.util.Log.d("MainActivity", "  - Display over other apps: $canDrawOverlays")
        android.util.Log.d("MainActivity", "  - Battery optimization disabled: $batteryOptDisabled")
        
        if (!canDrawOverlays) {
          android.util.Log.w("MainActivity", "⚠️ 'Display over other apps' permission NOT granted")
          android.util.Log.w("MainActivity", "⚠️ React Native will show custom permission screen")
          // DON'T auto-open Settings! React Native AppNavigator handles this with better UX
        } else {
          android.util.Log.d("MainActivity", "✅ All required permissions granted - Full Screen Intent will work")
        }
        
        if (!batteryOptDisabled) {
          android.util.Log.w("MainActivity", "⚠️ RECOMMENDED: Disable battery optimization for reliable call notifications")
          // Don't auto-open battery settings - only if user explicitly requests it
        }
      } else {
        android.util.Log.d("MainActivity", "✅ Android version < M - No system permissions required")
      }
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "❌ Error checking permissions:", e)
    }
  }
  
  /**
   * Handle incoming call actions (accept/reject) from IncomingCallActivity
   */
  private fun handleIncomingCallAction(intent: Intent?) {
    val action = intent?.getStringExtra("action")
    if (action == "accept_call" || action == "reject_call") {
      android.util.Log.d("MainActivity", "📞 Handling call action: $action")
      
      val conversationId = intent?.getStringExtra("conversationId")
      // CRITICAL FIX: Always read participantId, even if it's 0, because 0 is a valid participant ID
      // Use a sentinel value to detect if participantId was actually provided in the intent
      // We use Long.MIN_VALUE as the default to detect if the extra was missing
      val participantId: Long? = if (intent != null && intent.hasExtra("participantId")) {
        intent.getLongExtra("participantId", 0L) // If extra exists, 0L is a valid value
      } else {
        null // Extra was not provided
      }
      
      // Send event to React Native
      try {
        val reactInstanceManager = reactInstanceManager
        val reactContext = reactInstanceManager?.currentReactContext
        
        if (reactContext != null) {
          // Create event data
          // CRITICAL FIX: Always include participantId if it was provided in the intent, even if it's 0
          // This allows React Native to distinguish between missing participantId (undefined) and valid 0
          val eventData: WritableMap = Arguments.createMap().apply {
            putString("action", action)
            conversationId?.let { putString("conversationId", it) }
            // Always include participantId if it was provided (even if 0), null means it wasn't provided
            participantId?.let { putDouble("participantId", it.toDouble()) }
          }
          
          // Emit event to React Native
          reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IncomingCallAction", eventData)
          
          android.util.Log.d("MainActivity", "✅ Call action event sent to React Native: $action")
        } else {
          android.util.Log.w("MainActivity", "⚠️ React context not ready, will retry in onResume")
          // Store action in queue to process later when React context is ready
          // CRITICAL: Using a queue prevents overwriting when multiple calls arrive during initialization
          // CRITICAL: Synchronized access to prevent ConcurrentModificationException
          synchronized(pendingCallActions) {
            pendingCallActions.add(PendingCallAction(action, conversationId, participantId))
            android.util.Log.d("MainActivity", "📞 Queued call action: $action (queue size: ${pendingCallActions.size})")
          }
        }
      } catch (e: Exception) {
        android.util.Log.e("MainActivity", "❌ Error sending call action event:", e)
        e.printStackTrace()
      }
    }
  }
  
  // Store pending call actions in a queue to handle multiple calls during initialization
  // CRITICAL: Using a queue prevents overwriting when multiple calls arrive before React context is ready
  // CRITICAL: Using synchronized list to prevent ConcurrentModificationException when accessed from multiple threads
  // CRITICAL FIX: participantId is nullable to distinguish between missing (null) and valid 0
  private data class PendingCallAction(
    val action: String,
    val conversationId: String?,
    val participantId: Long? // Nullable to distinguish between missing and valid 0
  )
  
  // Thread-safe list to prevent ConcurrentModificationException
  // handleIncomingCallAction can be called from onCreate/onNewIntent (main thread)
  // while onResume (also main thread) reads and clears the list
  // Synchronization prevents race conditions during rapid intent delivery
  // Using Collections.synchronizedList with explicit synchronized blocks for critical sections
  private val pendingCallActions = Collections.synchronizedList(mutableListOf<PendingCallAction>())
  
  override fun onResume() {
    super.onResume()
    
    // Process all pending call actions if React context is now ready
    // CRITICAL: Synchronized access to prevent ConcurrentModificationException
    // CRITICAL FIX: Only clear queue after successful processing, or re-queue if React context unavailable
    // Previous implementation cleared queue before checking React context, causing lost actions
    val actionsToProcess: List<PendingCallAction>
    synchronized(pendingCallActions) {
      if (pendingCallActions.isEmpty()) {
        return
      }
      android.util.Log.d("MainActivity", "📞 Processing ${pendingCallActions.size} pending call action(s)")
      // Copy to avoid concurrent modification during processing
      // DO NOT clear yet - we'll clear only after successful processing
      actionsToProcess = ArrayList(pendingCallActions)
    }
    
    // Process actions outside synchronized block to avoid holding lock during React Native operations
    if (actionsToProcess.isNotEmpty()) {
      try {
        val reactInstanceManager = reactInstanceManager
        val reactContext = reactInstanceManager?.currentReactContext
        
        if (reactContext != null) {
          // Process all pending actions and track which ones succeeded
          // CRITICAL FIX: Track successful actions individually to avoid reprocessing them
          val successfulActions = mutableListOf<PendingCallAction>()
          val failedActions = mutableListOf<PendingCallAction>()
          
          actionsToProcess.forEach { pendingAction ->
            try {
              val eventData: WritableMap = Arguments.createMap().apply {
                putString("action", pendingAction.action)
                pendingAction.conversationId?.let { putString("conversationId", it) }
                // CRITICAL FIX: Always include participantId if it was provided (even if 0)
                // Null means it wasn't in the original intent, so we don't include it
                // This allows React Native to distinguish between missing participantId (undefined) and valid 0
                pendingAction.participantId?.let { putDouble("participantId", it.toDouble()) }
              }
              
              reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("IncomingCallAction", eventData)
              
              android.util.Log.d("MainActivity", "✅ Pending call action event sent to React Native: ${pendingAction.action}")
              successfulActions.add(pendingAction)
            } catch (e: Exception) {
              android.util.Log.e("MainActivity", "❌ Error sending individual call action event:", e)
              failedActions.add(pendingAction)
            }
          }
          
          // CRITICAL: Only remove successfully processed actions from queue
          // Failed actions remain in queue for retry, but successful ones are removed immediately
          // This prevents duplicate processing of successful actions
          synchronized(pendingCallActions) {
            // Remove only the successfully processed actions
            successfulActions.forEach { action ->
              pendingCallActions.remove(action)
            }
            
            if (successfulActions.isNotEmpty()) {
              android.util.Log.d("MainActivity", "✅ Removed ${successfulActions.size} successfully processed call action(s) from queue")
            }
            if (failedActions.isNotEmpty()) {
              android.util.Log.w("MainActivity", "⚠️ ${failedActions.size} action(s) failed, keeping them in queue for retry")
            }
          }
        } else {
          // React context not ready - keep actions in queue for next onResume
          android.util.Log.w("MainActivity", "⚠️ React context not ready, keeping ${actionsToProcess.size} action(s) in queue for retry")
        }
      } catch (e: Exception) {
        android.util.Log.e("MainActivity", "❌ Error sending pending call action events:", e)
        // On error, keep actions in queue for retry
        android.util.Log.w("MainActivity", "⚠️ Error occurred, keeping actions in queue for retry")
      }
    }
  }
  
  /**
   * Enable Dev Menu with hardware menu button (if available)
   * Also enables Ctrl+M / Cmd+M keyboard shortcut
   * Note: ReactActivity already provides getReactInstanceManager() method
   */
  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    // Only show dev menu in debug builds
    if (keyCode == KeyEvent.KEYCODE_MENU && com.svmessengermobile.BuildConfig.DEBUG) {
      try {
        // Use the method from ReactActivity directly (not a property to avoid conflict)
        val reactInstanceManager = getReactInstanceManager()
        if (reactInstanceManager != null) {
          reactInstanceManager.showDevOptionsDialog()
          return true
        }
      } catch (e: Exception) {
        android.util.Log.w("MainActivity", "⚠️ Failed to show dev menu (non-critical):", e)
      }
    }
    return super.onKeyUp(keyCode, event)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    android.util.Log.d("MainActivity", "📱 getMainComponentName() called")
    return "SVMessengerMobile"
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    android.util.Log.d("MainActivity", "⚛️ createReactActivityDelegate() called")
    try {
      val delegate = DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
      android.util.Log.d("MainActivity", "✅ ReactActivityDelegate created")
      return delegate
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "❌ Failed to create ReactActivityDelegate:", e)
      e.printStackTrace()
      throw e
    }
  }
}

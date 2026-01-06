package com.svmessengermobile

import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    android.util.Log.d("MainActivity", "🚀 onCreate() called")
    try {
      super.onCreate(savedInstanceState)
      android.util.Log.d("MainActivity", "✅ onCreate() completed")
      
      // Enable React Native Dev Menu for debugging
      // This allows shaking device or pressing Ctrl+M to open Dev Menu
      android.util.Log.d("MainActivity", "🔧 Dev Menu enabled for debugging")
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "❌ CRITICAL: onCreate() failed:", e)
      e.printStackTrace()
      throw e
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

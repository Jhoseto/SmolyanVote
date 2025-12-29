package com.svmessengermobile

import android.os.Bundle
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
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "❌ CRITICAL: onCreate() failed:", e)
      e.printStackTrace()
      throw e
    }
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

package com.svmessengermobile

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class RNSoundPlayerPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    android.util.Log.d("RNSoundPlayerPackage", "🔊 Creating RNSoundPlayerModule...")
    try {
      val module = RNSoundPlayerModule(reactContext)
      android.util.Log.d("RNSoundPlayerPackage", "✅ RNSoundPlayerModule created successfully")
      return listOf(module)
    } catch (e: Exception) {
      android.util.Log.e("RNSoundPlayerPackage", "❌ Failed to create RNSoundPlayerModule:", e)
      e.printStackTrace()
      // Return empty list instead of crashing
      return emptyList()
    }
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}


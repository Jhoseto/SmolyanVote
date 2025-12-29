package com.svmessengermobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.google.firebase.FirebaseApp
import com.svmessengermobile.BuildConfig

class MainApplication : Application(), ReactApplication {

  // React Native 0.81.0 requires both reactHost and reactNativeHost
  override val reactHost: ReactHost by lazy {
    android.util.Log.d("MainApplication", "📦 Initializing ReactHost...")
    try {
      val packages = PackageList(this).packages.apply {
        // Packages that cannot be autolinked yet can be added manually here, for example:
        // add(MyReactNativePackage())
        // Note: @livekit/react-native is auto-linked and initializes automatically
        // Add custom sound player package with error handling
        try {
          android.util.Log.d("MainApplication", "🔊 Adding RNSoundPlayerPackage...")
          add(RNSoundPlayerPackage())
          android.util.Log.d("MainApplication", "✅ RNSoundPlayerPackage added")
        } catch (e: Exception) {
          android.util.Log.e("MainApplication", "❌ Failed to add RNSoundPlayerPackage:", e)
          e.printStackTrace()
          // Continue without sound player - non-critical
        }
      }
      
      android.util.Log.d("MainApplication", "📦 Creating ReactHost with ${packages.size} packages...")
      // Use explicit parameters to avoid overload resolution ambiguity
      // Specify isHermesEnabled explicitly to resolve ambiguity
      val host = getDefaultReactHost(
        context = applicationContext,
        packageList = packages,
        isHermesEnabled = true,
        useDevSupport = true
      )
      android.util.Log.d("MainApplication", "✅ ReactHost created successfully")
      host
    } catch (e: Exception) {
      android.util.Log.e("MainApplication", "❌ CRITICAL: Failed to create ReactHost:", e)
      e.printStackTrace()
      throw e
    }
  }

  // ReactApplication interface requires reactNativeHost for backward compatibility
  // Create a custom ReactNativeHost implementation for React Native 0.81.0
  override val reactNativeHost: ReactNativeHost = object : ReactNativeHost(this) {
    override fun getPackages(): List<com.facebook.react.ReactPackage> {
      val packages = PackageList(application).packages.apply {
        try {
          add(RNSoundPlayerPackage())
        } catch (e: Exception) {
          android.util.Log.e("MainApplication", "❌ Failed to add RNSoundPlayerPackage:", e)
        }
      }
      return packages
    }

    override fun getJSMainModuleName(): String {
      return "index"
    }

    override fun getUseDeveloperSupport(): Boolean {
      return BuildConfig.DEBUG
    }
  }

  override fun onCreate() {
    super.onCreate()
    
    android.util.Log.d("MainApplication", "🚀 onCreate() called")

    // Initialize Firebase - CRITICAL for push notifications!
    // Wrap in try-catch to prevent crash if google-services.json is missing or malformed
    try {
      android.util.Log.d("MainApplication", "🔥 Initializing Firebase...")
      FirebaseApp.initializeApp(this)
      android.util.Log.d("MainApplication", "✅ Firebase initialized successfully")
    } catch (e: Exception) {
      // Firebase initialization failed - app should still work without push notifications
      android.util.Log.e("MainApplication", "❌ Firebase initialization failed (non-critical):", e)
      android.util.Log.w("MainApplication", "⚠️ App will continue without push notifications")
      e.printStackTrace()
    }

    // Initialize React Native with error handling
    try {
      android.util.Log.d("MainApplication", "⚛️ Loading React Native...")
      loadReactNative(this)
      android.util.Log.d("MainApplication", "✅ React Native loaded successfully")
    } catch (e: Exception) {
      android.util.Log.e("MainApplication", "❌ CRITICAL: Failed to load React Native:", e)
      e.printStackTrace()
      // Re-throw to show error to user
      throw e
    }
  }
}

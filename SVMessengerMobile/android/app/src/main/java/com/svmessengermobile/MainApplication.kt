package com.svmessengermobile

import android.app.Application
import android.os.Build
import android.webkit.CookieManager
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
        try {
          android.util.Log.d("MainApplication", "📢 Adding NotificationPackage...")
          add(NotificationPackage())
          android.util.Log.d("MainApplication", "✅ NotificationPackage added")
        } catch (e: Exception) {
          android.util.Log.e("MainApplication", "❌ Failed to add NotificationPackage:", e)
          e.printStackTrace()
          // Continue without notification module - non-critical
        }
        try {
          android.util.Log.d("MainApplication", "🔐 Adding PermissionsPackage...")
          add(PermissionsPackage())
          android.util.Log.d("MainApplication", "✅ PermissionsPackage added")
        } catch (e: Exception) {
          android.util.Log.e("MainApplication", "❌ Failed to add PermissionsPackage:", e)
          e.printStackTrace()
          // Continue without permissions module - non-critical
        }
      }
      
      android.util.Log.d("MainApplication", "📦 Creating ReactHost with ${packages.size} packages...")
      // Use explicit parameters to avoid overload resolution ambiguity
      // Specify isHermesEnabled explicitly to resolve ambiguity
      // CRITICAL: useDevSupport must be false in release builds to prevent crashes
      val host = getDefaultReactHost(
        context = applicationContext,
        packageList = packages,
        isHermesEnabled = true,
        useDevSupport = BuildConfig.DEBUG  // Only enable dev support in debug builds
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
        try {
          add(NotificationPackage())
        } catch (e: Exception) {
          android.util.Log.e("MainApplication", "❌ Failed to add NotificationPackage:", e)
        }
        try {
          add(PermissionsPackage())
        } catch (e: Exception) {
          android.util.Log.e("MainApplication", "❌ Failed to add PermissionsPackage:", e)
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

    // Configure CookieManager to allow secure cookies over HTTP in development
    // This fixes "Strict Secure Cookie policy" warnings on Android R+ (API 30+)
    // Note: The warning is expected in development when using HTTP. In production with HTTPS, it won't appear.
    try {
      if (BuildConfig.DEBUG) {
        android.util.Log.d("MainApplication", "🍪 Configuring CookieManager for development...")
        val cookieManager = CookieManager.getInstance()
        // Allow cookies in general
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          cookieManager.setAcceptCookie(true)
        }
        // Note: setAcceptThirdPartyCookies requires a WebView instance
        // The "Strict Secure Cookie" warning is expected when using HTTP in development
        // It's a security feature and won't affect functionality
        android.util.Log.d("MainApplication", "✅ CookieManager configured (warnings are expected in dev mode)")
      }
    } catch (e: Exception) {
      android.util.Log.w("MainApplication", "⚠️ Failed to configure CookieManager (non-critical):", e)
    }

    // Initialize Notification Channels - CRITICAL for Android 8.0+ (API 26+)!
    // For Android 11 and below (API 30-), channels are still required if minSdkVersion >= 26
    // Must be called before Firebase initialization
    try {
      android.util.Log.d("MainApplication", "📢 Creating notification channels...")
      NotificationChannelManager.createChannels(this)
      android.util.Log.d("MainApplication", "✅ Notification channels created successfully")
    } catch (e: Exception) {
      android.util.Log.e("MainApplication", "❌ Failed to create notification channels:", e)
      e.printStackTrace()
      // Continue - channels might already exist or app is running on older Android
    }

    // Initialize Firebase - CRITICAL for push notifications!
    // Wrap in try-catch to prevent crash if google-services.json is missing or malformed
    try {
      android.util.Log.d("MainApplication", "🔥 Initializing Firebase...")
      // Check if Firebase is already initialized (prevents duplicate initialization crash)
      if (FirebaseApp.getApps(this).isEmpty()) {
        FirebaseApp.initializeApp(this)
        android.util.Log.d("MainApplication", "✅ Firebase initialized successfully")
      } else {
        android.util.Log.d("MainApplication", "✅ Firebase already initialized")
      }
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

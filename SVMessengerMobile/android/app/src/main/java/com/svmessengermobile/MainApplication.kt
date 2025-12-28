package com.svmessengermobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.google.firebase.FirebaseApp

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          // Note: @livekit/react-native is auto-linked and initializes automatically
          // Add custom sound player package
          add(RNSoundPlayerPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    
    // Initialize Firebase - CRITICAL for push notifications!
    FirebaseApp.initializeApp(this)
    
    loadReactNative(this)
  }
}

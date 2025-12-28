package com.svmessengermobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          // Note: @livekit/react-native is auto-linked and initializes automatically
          add(SoundPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Create notification channels for Android 8.0+
    NotificationChannelManager.createChannels(this)
    loadReactNative(this)
  }
}

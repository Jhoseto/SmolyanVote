# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ========== React Native Core ==========
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
    void set*(***);
    *** get*();
}

# React Native annotations
-keep @interface com.facebook.react.bridge.ReactMethod
-keep @interface com.facebook.react.bridge.ReactProp
-keep @interface com.facebook.react.bridge.ReactPropGroup
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
    @com.facebook.react.bridge.ReactProp *;
    @com.facebook.react.bridge.ReactPropGroup *;
}

# React Native core classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native packages and modules
-keep class * implements com.facebook.react.ReactPackage { *; }
-keep class * extends com.facebook.react.ReactPackage { *; }
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class * extends com.facebook.react.bridge.BaseJavaModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class * extends com.facebook.react.uimanager.SimpleViewManager { *; }

# React Native interfaces and implementations
-keep class * implements com.facebook.react.ReactApplication { *; }
-keep class * extends com.facebook.react.ReactActivity { *; }
-keep class * extends com.facebook.react.ReactActivityDelegate { *; }
-keep class * extends com.facebook.react.ReactFragment { *; }
-keep class * implements com.facebook.react.bridge.ActivityEventListener { *; }
-keep class * implements com.facebook.react.bridge.LifecycleEventListener { *; }
-keep class * implements com.facebook.react.bridge.WindowFocusChangeListener { *; }
-keep class * implements com.facebook.react.bridge.ApplicationLifecycleDispatchers { *; }
-keep class * implements com.facebook.react.bridge.ReactApplicationLifecycleDispatchers { *; }
-keep class * extends com.facebook.react.HeadlessJsTaskService { *; }
-keep class * extends com.facebook.react.modules.core.DeviceEventManagerModule { *; }

# React Native bridge classes
-keep class com.facebook.react.ReactInstanceManager { *; }
-keep class com.facebook.react.ReactInstanceManager$* { *; }
-keep class com.facebook.react.ReactHost { *; }
-keep class com.facebook.react.ReactHost$* { *; }
-keep class com.facebook.react.ReactNativeHost { *; }
-keep class com.facebook.react.ReactNativeHost$* { *; }
-keep class com.facebook.react.ReactRootView { *; }
-keep class com.facebook.react.ReactRootView$* { *; }
-keep class com.facebook.react.bridge.ReactApplicationContext { *; }
-keep class com.facebook.react.bridge.ReactContext { *; }
-keep class com.facebook.react.bridge.CatalystInstance { *; }
-keep class com.facebook.react.bridge.JavaScriptExecutor { *; }
-keep class com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.bridge.Promise { *; }
-keep class com.facebook.react.bridge.Callback { *; }
-keep interface com.facebook.react.bridge.ReadableMap { *; }
-keep interface com.facebook.react.bridge.ReadableArray { *; }
-keep interface com.facebook.react.bridge.WritableMap { *; }
-keep interface com.facebook.react.bridge.WritableArray { *; }
-keep class com.facebook.react.bridge.WritableNativeMap { *; }
-keep class com.facebook.react.bridge.WritableNativeArray { *; }
-keep class com.facebook.react.bridge.ReadableNativeMap { *; }
-keep class com.facebook.react.bridge.ReadableNativeArray { *; }

# React Native UIManager
-keep class com.facebook.react.uimanager.UIManagerModule { *; }
-keep class com.facebook.react.uimanager.NativeViewHierarchyManager { *; }
-keep class com.facebook.react.uimanager.ViewManagerRegistry { *; }
-keep class com.facebook.react.uimanager.ComponentRegistry { *; }
-keep class com.facebook.react.uimanager.ReactShadowNode { *; }
-keep class com.facebook.react.uimanager.LayoutShadowNode { *; }
-keep class com.facebook.react.uimanager.ReactStylesDiffMap { *; }

# ========== Hermes ==========
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# ========== Native Methods ==========
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# ========== Application Classes ==========
-keep class com.svmessengermobile.** { *; }

# ========== Third-Party Libraries ==========

# LiveKit / WebRTC
-keep class io.livekit.** { *; }
-keep class io.livekit.reactnative.** { *; }
-keep class org.webrtc.** { *; }
-keep class com.oney.WebRTCModule.** { *; }
-dontwarn io.livekit.**
-dontwarn org.webrtc.**

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Facebook SDK
-keep class com.facebook.** { *; }
-keep class com.facebook.reactnative.androidsdk.** { *; }
-dontwarn com.facebook.reactnative.androidsdk.**

# react-native-screens
-keep class com.swmansion.rnscreens.** { *; }
-dontwarn com.swmansion.rnscreens.**

# react-native-permissions
-keep class com.zoontek.rnpermissions.** { *; }
-dontwarn com.zoontek.rnpermissions.**

# react-native-keychain
-keep class com.oblador.keychain.** { *; }
-dontwarn com.oblador.keychain.**

# react-native-encrypted-storage
-keep class com.emeraldsanto.encryptedstorage.** { *; }
-dontwarn com.emeraldsanto.encryptedstorage.**

# react-native-image-picker
-keep class com.imagepicker.** { *; }
-dontwarn com.imagepicker.**

# react-native-linear-gradient
-keep class com.BV.LinearGradient.** { *; }
-dontwarn com.BV.LinearGradient.**

# react-native-svg
-keep class com.horcrux.svg.** { *; }
-dontwarn com.horcrux.svg.**

# react-native-safe-area-context
-keep class com.th3rdwave.safeareacontext.** { *; }
-dontwarn com.th3rdwave.safeareacontext.**

# react-native-gesture-handler
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.gesturehandler.**

# react-native-google-signin
-keep class com.reactnativegooglesignin.** { *; }
-dontwarn com.reactnativegooglesignin.**

# react-native-incall-manager
-keep class com.github.zmxv.** { *; }
-keep class com.zmxv.RNSound.** { *; }
-keep class io.wazo.callkeep.** { *; }
-dontwarn com.github.zmxv.**
-dontwarn com.zmxv.RNSound.**
-dontwarn io.wazo.callkeep.**

# react-native-vector-icons
-keep class com.oblador.vectoricons.** { *; }
-dontwarn com.oblador.vectoricons.**

# react-native-heroicons
-keep class com.reactnativeheroicons.** { *; }
-dontwarn com.reactnativeheroicons.**

# react-native-emoji-selector
-keep class com.reactnativeemojiselector.** { *; }
-dontwarn com.reactnativeemojiselector.**

# react-native-async-storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

# react-native-netinfo
-keep class com.reactnativecommunity.netinfo.** { *; }
-dontwarn com.reactnativecommunity.netinfo.**

# ========== Android System Classes ==========
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
-keep class * implements android.webkit.JavascriptInterface { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
-keep @androidx.annotation.Keep class *
-keepclassmembers class * {
    @androidx.annotation.Keep *;
}

# ========== Attributes ==========
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes SourceFile,LineNumberTable
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# ========== Logging ==========
# Remove logging in release (but keep error logs for debugging)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
}

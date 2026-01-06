package com.svmessengermobile

import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class RNSoundPlayerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  
  private val mediaPlayers = mutableMapOf<String, MediaPlayer>()
  private var globalVolume: Float = 0.8f

  init {
    android.util.Log.d("RNSoundPlayerModule", "🔊 RNSoundPlayerModule initialized")
  }

  override fun getName(): String {
    return "RNSoundPlayer"
  }

  @ReactMethod
  fun playSound(soundName: String, loop: Boolean, promise: Promise) {
    try {
      // Stop existing sound with same name if playing
      stopSoundInternal(soundName)

      val context = reactApplicationContext
      val resourceId = context.resources.getIdentifier(
        soundName.replace(".mp3", ""),
        "raw",
        context.packageName
      )

      if (resourceId == 0) {
        promise.reject("SOUND_NOT_FOUND", "Sound file not found: $soundName")
        return
      }

      val mediaPlayer = MediaPlayer.create(context, resourceId)
      if (mediaPlayer == null) {
        promise.reject("PLAYER_CREATE_FAILED", "Failed to create MediaPlayer for: $soundName")
        return
      }

      // Set proper audio attributes for notification sounds
      // This ensures sounds play correctly even when device is in silent/do-not-disturb mode
      val audioAttributesBuilder = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      
      // FLAG_AUDIBILITY_ENFORCED is available from Android 10+ (API 29)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        audioAttributesBuilder.setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
      }
      
      val audioAttributes = audioAttributesBuilder.build()
      mediaPlayer.setAudioAttributes(audioAttributes)
      mediaPlayer.setVolume(globalVolume, globalVolume)
      mediaPlayer.isLooping = loop
      
      // Set audio stream type for compatibility
      try {
        mediaPlayer.setAudioStreamType(AudioManager.STREAM_NOTIFICATION)
      } catch (e: Exception) {
        // Ignore - audio attributes should handle this
        android.util.Log.w("RNSoundPlayerModule", "Could not set audio stream type: ${e.message}")
      }
      
      mediaPlayer.setOnCompletionListener {
        if (!loop) {
          mediaPlayers.remove(soundName)
          it.release()
        }
      }

      mediaPlayer.setOnErrorListener { mp, what, extra ->
        mediaPlayers.remove(soundName)
        mp.release()
        false
      }

      mediaPlayers[soundName] = mediaPlayer
      mediaPlayer.start()

      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("PLAY_ERROR", "Error playing sound: ${e.message}", e)
    }
  }

  // Internal method to stop sound without promise (for internal use)
  private fun stopSoundInternal(soundName: String) {
    try {
      val mediaPlayer = mediaPlayers.remove(soundName)
      if (mediaPlayer != null) {
        if (mediaPlayer.isPlaying) {
          mediaPlayer.stop()
        }
        mediaPlayer.release()
      }
    } catch (e: Exception) {
      // Ignore errors when stopping internally
    }
  }

  @ReactMethod
  fun stopSound(soundName: String, promise: Promise) {
    try {
      stopSoundInternal(soundName)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("STOP_ERROR", "Error stopping sound: ${e.message}", e)
    }
  }

  @ReactMethod
  fun setVolume(volume: Double, promise: Promise) {
    try {
      globalVolume = volume.toFloat().coerceIn(0f, 1f)
      
      // Update volume for all currently playing sounds
      mediaPlayers.values.forEach { mp ->
        mp.setVolume(globalVolume, globalVolume)
      }
      
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("VOLUME_ERROR", "Error setting volume: ${e.message}", e)
    }
  }

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    // Cleanup all media players
    mediaPlayers.values.forEach { mp ->
      try {
        if (mp.isPlaying) {
          mp.stop()
        }
        mp.release()
      } catch (e: Exception) {
        // Ignore errors during cleanup
      }
    }
    mediaPlayers.clear()
  }
}


package com.svmessengermobile

import android.content.Context
import android.media.SoundPool
import android.media.AudioAttributes
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import java.util.concurrent.ConcurrentHashMap

class SoundModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val soundPool: SoundPool
    private val soundMap = ConcurrentHashMap<String, Int>()
    private val streamMap = ConcurrentHashMap<Int, Int>()
    
    init {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        
        soundPool = SoundPool.Builder()
            .setMaxStreams(5)
            .setAudioAttributes(audioAttributes)
            .build()
        
        // Load sounds
        loadSounds()
    }
    
    private fun loadSounds() {
        val context = reactApplicationContext
        try {
            soundMap["s1"] = soundPool.load(context, R.raw.s1, 1)
            soundMap["incoming_call"] = soundPool.load(context, R.raw.incoming_call, 1)
            soundMap["out_call"] = soundPool.load(context, R.raw.out_call, 1)
        } catch (e: Exception) {
            android.util.Log.e("SoundModule", "Error loading sounds: ${e.message}", e)
        }
    }
    
    override fun getName(): String {
        return "SoundModule"
    }
    
    @ReactMethod
    fun playSound(soundName: String, volume: Float, loop: Boolean, promise: Promise) {
        try {
            val soundId = soundMap[soundName]
            if (soundId == null || soundId == 0) {
                promise.reject("SOUND_NOT_FOUND", "Sound $soundName not found")
                return
            }
            
            val loopMode = if (loop) -1 else 0
            val streamId = soundPool.play(soundId, volume, volume, 1, loopMode, 1.0f)
            
            if (streamId > 0) {
                streamMap[streamId] = soundId
                promise.resolve(streamId)
            } else {
                promise.reject("PLAY_FAILED", "Failed to play sound")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message ?: "Unknown error")
        }
    }
    
    @ReactMethod
    fun stopSound(streamId: Int, promise: Promise) {
        try {
            soundPool.stop(streamId)
            streamMap.remove(streamId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message ?: "Unknown error")
        }
    }
    
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        soundPool.release()
        soundMap.clear()
        streamMap.clear()
    }
}


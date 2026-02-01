package com.svmessengermobile

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import java.io.IOException

/**
 * Incoming Call Activity
 * Показва full screen call UI панел на целия екран
 * когато app-ът е затворен и има входящо обаждане
 * 
 * Използва Full Screen Intent за да се покаже дори когато app-ът е напълно затворен
 * Възпроизвежда звук постоянно докато не се приключи обаждането
 */
class IncomingCallActivity : Activity() {

    private lateinit var callerNameText: TextView
    private lateinit var callerAvatar: ImageView
    private lateinit var acceptButton: View
    private lateinit var rejectButton: View
    
    // MediaPlayer за възпроизвеждане на звука за входящо обаждане
    private var mediaPlayer: MediaPlayer? = null
    
    // CRITICAL: Wake Lock за да се гарантира че екранът остава включен
    private var wakeLock: android.os.PowerManager.WakeLock? = null
    
    // CRITICAL: BroadcastReceiver за автоматично затваряне когато call е приключил
    private var callStateReceiver: BroadcastReceiver? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d("IncomingCallActivity", "📞 IncomingCallActivity created")
        
        try {
            // Cancel notifications
            try {
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
                notificationManager.cancelAll()
            } catch (e: Exception) {
                Log.e("IncomingCallActivity", "❌ Error cancelling notifications:", e)
            }
            
            acquireWakeLock()
            setupWindow()
            
            // USE XML LAYOUT
            setContentView(R.layout.activity_incoming_call)
            
            // Bind Views
            callerNameText = findViewById(R.id.callerName)
            callerAvatar = findViewById(R.id.callerAvatar)
            acceptButton = findViewById(R.id.btnAccept)
            rejectButton = findViewById(R.id.btnReject)

            val pulseRing1 = findViewById<View>(R.id.pulseRing1)
            val pulseRing2 = findViewById<View>(R.id.pulseRing2)
            
            // Get call data
            val conversationId = intent.getStringExtra("conversationId")
            val callerName = intent.getStringExtra("callerName") ?: "Потребител"
            val callerImageUrl = intent.getStringExtra("callerImageUrl")
            val participantIdProvided = intent.hasExtra("participantId")
            val participantId = if (participantIdProvided) {
                intent.getLongExtra("participantId", 0L)
            } else {
                null
            }
            
            setupUI(callerName, callerImageUrl)
            setupButtonListeners(conversationId, participantId, participantIdProvided)
            startIncomingCallSound()
            registerCallStateReceiver()
            
            // Start Animations
            startAnimations(pulseRing1, pulseRing2, callerAvatar)
            
        } catch (e: Exception) {
            Log.e("IncomingCallActivity", "❌ CRITICAL ERROR in onCreate:", e)
            try {
                releaseWakeLock()
                stopIncomingCallSound()
            } catch (cleanupError: Exception) { }
            finish()
        }
    }

    private fun setupWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            try {
                val keyguardManager = getSystemService(KEYGUARD_SERVICE) as android.app.KeyguardManager
                keyguardManager.requestDismissKeyguard(this, null)
            } catch (e: Exception) { }
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_FULLSCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        )
        
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
    }
    
    private fun startIncomingCallSound() {
        try {
            stopIncomingCallSound()
            mediaPlayer = MediaPlayer()
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            
            mediaPlayer?.setAudioAttributes(audioAttributes)
            
            // Try to load custom sound, fallback to default ringtone if needed
            // For now assuming R.raw.incoming_call exists as per previous code
            val assetFileDescriptor = resources.openRawResourceFd(R.raw.incoming_call)
            mediaPlayer?.setDataSource(
                assetFileDescriptor.fileDescriptor,
                assetFileDescriptor.startOffset,
                assetFileDescriptor.length
            )
            assetFileDescriptor.close()
            
            mediaPlayer?.prepare()
            mediaPlayer?.isLooping = true
            mediaPlayer?.setVolume(1.0f, 1.0f)
            mediaPlayer?.start()
        } catch (e: Exception) {
            Log.e("IncomingCallActivity", "❌ Error starting sound:", e)
        }
    }
    
    private fun stopIncomingCallSound() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) { }
    }

    private fun startAnimations(ringWave1: View, ringWave2: View, avatar: ImageView) {
        val anim1 = android.animation.ObjectAnimator.ofFloat(ringWave1, "scaleX", 1f, 1.5f).apply {
            duration = 2000
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim1Y = android.animation.ObjectAnimator.ofFloat(ringWave1, "scaleY", 1f, 1.5f).apply {
            duration = 2000
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim1Alpha = android.animation.ObjectAnimator.ofFloat(ringWave1, "alpha", 0.3f, 0f).apply {
            duration = 2000
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        
        val anim2 = android.animation.ObjectAnimator.ofFloat(ringWave2, "scaleX", 1f, 1.8f).apply {
            duration = 2000
            startDelay = 500
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim2Y = android.animation.ObjectAnimator.ofFloat(ringWave2, "scaleY", 1f, 1.8f).apply {
            duration = 2000
            startDelay = 500
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim2Alpha = android.animation.ObjectAnimator.ofFloat(ringWave2, "alpha", 0.2f, 0f).apply {
            duration = 2000
            startDelay = 500
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        
        val avatarPulse = android.animation.ObjectAnimator.ofFloat(avatar, "scaleX", 1f, 1.05f).apply {
            duration = 1000
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.REVERSE
        }
        val avatarPulseY = android.animation.ObjectAnimator.ofFloat(avatar, "scaleY", 1f, 1.05f).apply {
            duration = 1000
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.REVERSE
        }

        android.animation.AnimatorSet().apply {
            playTogether(anim1, anim1Y, anim1Alpha, anim2, anim2Y, anim2Alpha, avatarPulse, avatarPulseY)
            start()
        }
    }

    private fun setupUI(callerName: String, callerImageUrl: String?) {
        callerNameText.text = callerName
        if (!callerImageUrl.isNullOrEmpty()) {
            Glide.with(this)
                .load(callerImageUrl)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop()
                .placeholder(android.R.drawable.ic_menu_call)
                .error(android.R.drawable.ic_menu_call)
                .into(callerAvatar)
        }
    }

    private fun setupButtonListeners(conversationId: String?, participantId: Long?, participantIdProvided: Boolean) {
        val commonIntentConfig: (Intent, String) -> Unit = { intent, action ->
            intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            intent.putExtra("action", action)
            conversationId?.let { intent.putExtra("conversationId", it) }
            if (participantIdProvided && participantId != null) {
                intent.putExtra("participantId", participantId)
            }
        }

        acceptButton.setOnClickListener {
            stopIncomingCallSound()
            IncomingCallService.stopService(this)
            
            val intent = Intent(this, MainActivity::class.java)
            commonIntentConfig(intent, "accept_call")
            startActivity(intent)
            finish()
        }
        
        rejectButton.setOnClickListener {
            stopIncomingCallSound()
            IncomingCallService.stopService(this)
            
            val intent = Intent(this, MainActivity::class.java)
            commonIntentConfig(intent, "reject_call")
            startActivity(intent)
            finish()
        }
    }
    


    private fun registerCallStateReceiver() {
        callStateReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val action = intent?.action
                val state = intent?.getStringExtra("state")
                val shouldClose = action == "com.svmessengermobile.CALL_ENDED" ||
                        action == "com.svmessengermobile.CALL_REJECTED" ||
                        action == "com.svmessengermobile.CALL_IDLE" ||
                        action == "com.svmessengermobile.CALL_STATE_CHANGED" && 
                        (state == "IDLE" || state == "DISCONNECTED" || state == "REJECTED" || state == "ENDED")
                
                if (shouldClose) {
                    stopIncomingCallSound()
                    releaseWakeLock()
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        finishAndRemoveTask()
                    } else {
                        finish()
                    }
                }
            }
        }
        val filter = IntentFilter().apply {
            addAction("com.svmessengermobile.CALL_ENDED")
            addAction("com.svmessengermobile.CALL_REJECTED")
            addAction("com.svmessengermobile.CALL_IDLE")
            addAction("com.svmessengermobile.CALL_STATE_CHANGED")
        }
        LocalBroadcastManager.getInstance(this).registerReceiver(callStateReceiver!!, filter)
    }
    
    private fun unregisterCallStateReceiver() {
        callStateReceiver?.let { receiver ->
            try {
                LocalBroadcastManager.getInstance(this).unregisterReceiver(receiver)
            } catch (e: Exception) {
                Log.e("IncomingCallActivity", "❌ Error unregistering BroadcastReceiver:", e)
            }
        }
        callStateReceiver = null
    }
    
    /**
     * Acquire Wake Lock to keep screen on
     * CRITICAL: This is essential for incoming calls - screen must stay on even when phone is locked
     */
    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            // CRITICAL: Use FULL_WAKE_LOCK with ACQUIRE_CAUSES_WAKEUP and ON_AFTER_RELEASE
            // This ensures screen turns on and stays on for incoming calls
            @Suppress("DEPRECATION")
            wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or
                PowerManager.ACQUIRE_CAUSES_WAKEUP or
                PowerManager.ON_AFTER_RELEASE,
                "SVMessenger:IncomingCallWakeLock"
            )
            // Acquire wake lock for maximum 2 minutes (120 seconds)
            // This prevents battery drain if user never answers
            wakeLock?.acquire(120000) // 2 minutes timeout
            Log.d("IncomingCallActivity", "✅ Wake Lock acquired - screen will stay on")
        } catch (e: Exception) {
            Log.e("IncomingCallActivity", "❌ Failed to acquire Wake Lock:", e)
        }
    }
    
    /**
     * Release Wake Lock
     * CRITICAL: Always release wake lock to prevent battery drain
     */
    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.d("IncomingCallActivity", "✅ Wake Lock released")
                }
            }
            wakeLock = null
        } catch (e: Exception) {
            Log.e("IncomingCallActivity", "❌ Error releasing Wake Lock:", e)
        }
    }
    
    override fun onBackPressed() {
        // CRITICAL: Prevent back button from dismissing call screen
        // User must accept or reject the call
        Log.d("IncomingCallActivity", "📞 Back button pressed - ignoring (user must accept/reject call)")
    }
}


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
    private lateinit var acceptButton: Button
    private lateinit var rejectButton: Button
    
    // MediaPlayer за възпроизвеждане на звука за входящо обаждане
    private var mediaPlayer: MediaPlayer? = null
    
    // CRITICAL: Wake Lock за да се гарантира че екранът остава включен
    // Това е критично за входящи обаждания - екранът трябва да свети дори когато телефонът е заключен
    private var wakeLock: android.os.PowerManager.WakeLock? = null
    
    // CRITICAL: BroadcastReceiver за автоматично затваряне когато call е приключил
    // Това предотвратява показването на IncomingCallActivity след като call е приключил
    private var callStateReceiver: BroadcastReceiver? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d("IncomingCallActivity", "📞 IncomingCallActivity created")
        
        // CRITICAL: Wrap everything in try-catch to prevent crashes
        try {
            // CRITICAL: Cancel ALL notifications IMMEDIATELY before anything else
            // This removes the notification from tray while Full Screen Intent already triggered
            try {
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
                notificationManager.cancelAll()
                Log.d("IncomingCallActivity", "🧹 ALL Notifications cancelled IMMEDIATELY on Activity start")
            } catch (e: Exception) {
                Log.e("IncomingCallActivity", "❌ Error cancelling notifications:", e)
            }
            
            // CRITICAL: Acquire Wake Lock FIRST before anything else
            // This ensures screen stays on even when phone is locked
            acquireWakeLock()
            
            // Set up full screen overlay window
            setupWindow()
            
            // Set content view
            setContentView(createCallUI())
            
            // Get call data from intent
            val conversationId = intent.getStringExtra("conversationId")
            val callerName = intent.getStringExtra("callerName") ?: "Потребител"
            val callerImageUrl = intent.getStringExtra("callerImageUrl")
            // CRITICAL FIX: Check if participantId was actually provided in the intent
            // If it wasn't provided, we should not include it in the response intent to MainActivity
            // This allows MainActivity to distinguish between missing participantId and valid 0
            val participantIdProvided = intent.hasExtra("participantId")
            val participantId = if (participantIdProvided) {
                intent.getLongExtra("participantId", 0L)
            } else {
                null
            }
            
            Log.d("IncomingCallActivity", "📞 Call data: conversationId=$conversationId, callerName=$callerName, participantId=$participantId (provided=$participantIdProvided)")
            
            // Setup UI
            setupUI(callerName, callerImageUrl)
            
            // Setup button listeners
            setupButtonListeners(conversationId, participantId, participantIdProvided)
            
            // CRITICAL: Start playing incoming call sound continuously
            startIncomingCallSound()
            
            // CRITICAL: Register BroadcastReceiver to listen for call state changes
            // This allows IncomingCallActivity to automatically close when call ends
            registerCallStateReceiver()
        } catch (e: Exception) {
            Log.e("IncomingCallActivity", "❌ CRITICAL ERROR in onCreate - finishing activity to prevent crash:", e)
            e.printStackTrace()
            // CRITICAL: Release resources and finish activity to prevent crash
            try {
                releaseWakeLock()
                stopIncomingCallSound()
            } catch (cleanupError: Exception) {
                Log.e("IncomingCallActivity", "❌ Error during cleanup:", cleanupError)
            }
            finish()
        }
    }

    /**
     * Setup window for full screen
     * CRITICAL: Must be full screen to work properly with Full Screen Intent
     * CRITICAL FIX: Enhanced for lock screen and minimized app scenarios
     */
    private fun setupWindow() {
        // CRITICAL: Enable showing over lockscreen and turning screen on
        // This MUST be called before setContentView() for it to work properly
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            // CRITICAL FIX: Also request to unlock device if possible
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                try {
                    val keyguardManager = getSystemService(KEYGUARD_SERVICE) as android.app.KeyguardManager
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        keyguardManager.requestDismissKeyguard(this, null)
                    }
                } catch (e: Exception) {
                    Log.e("IncomingCallActivity", "Failed to dismiss keyguard:", e)
                }
            }
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        
        // CRITICAL: Keep screen on, dismiss keyguard, full screen
        // These flags ensure the activity shows on lock screen and turns screen on
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_FULLSCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        )
        
        // Full screen - cover entire screen
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        
        // CRITICAL FIX: Set window to be shown on lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }
        
        // Hide system UI for immersive experience (like a real phone call)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            window.decorView.systemUiVisibility = (
                android.view.View.SYSTEM_UI_FLAG_FULLSCREEN or
                android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            )
        }
        
        Log.d("IncomingCallActivity", "✅ Window configured for full screen display on lock screen")
    }
    
    /**
     * Start playing incoming call sound continuously
     * CRITICAL: This plays the sound in the Activity, not just in notification
     * This ensures the sound continues even if notification is dismissed
     */
    private fun startIncomingCallSound() {
        try {
            // Release any existing MediaPlayer
            stopIncomingCallSound()
            
            // Create new MediaPlayer
            mediaPlayer = MediaPlayer()
            
            // Set audio attributes for call sound (USAGE_VOICE_COMMUNICATION for calls)
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            
            mediaPlayer?.setAudioAttributes(audioAttributes)
            
            // Load sound from raw resources
            val assetFileDescriptor = resources.openRawResourceFd(R.raw.incoming_call)
            mediaPlayer?.setDataSource(
                assetFileDescriptor.fileDescriptor,
                assetFileDescriptor.startOffset,
                assetFileDescriptor.length
            )
            assetFileDescriptor.close()
            
            // Prepare and start playing
            mediaPlayer?.prepare()
            mediaPlayer?.isLooping = true // Loop continuously
            mediaPlayer?.setVolume(1.0f, 1.0f) // Full volume
            mediaPlayer?.start()
            
            Log.d("IncomingCallActivity", "📞 Incoming call sound started")
        } catch (e: IOException) {
            Log.e("IncomingCallActivity", "❌ Error starting incoming call sound:", e)
        } catch (e: Exception) {
            Log.e("IncomingCallActivity", "❌ Error starting incoming call sound:", e)
        }
    }
    
    /**
     * Stop playing incoming call sound
     */
    private fun stopIncomingCallSound() {
        try {
            mediaPlayer?.let {
                if (it.isPlaying) {
                    it.stop()
                }
                it.release()
            }
            mediaPlayer = null
            Log.d("IncomingCallActivity", "📞 Incoming call sound stopped")
        } catch (e: Exception) {
            Log.e("IncomingCallActivity", "❌ Error stopping incoming call sound:", e)
        }
    }

    /**
     * Create full screen call UI layout programmatically
     * WORLD-CLASS PREMIUM DESIGN - White/Light theme with gradients and premium details
     */
    private fun createCallUI(): View {
        // Main container - full screen with premium white gradient background
        val mainContainer = android.widget.RelativeLayout(this).apply {
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT,
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT
            )
            // Premium white gradient background
            background = createGradientDrawable(
                intArrayOf(0xFFFFFFFF.toInt(), 0xFFF8FAFC.toInt(), 0xFFF1F5F9.toInt()),
                android.graphics.drawable.GradientDrawable.Orientation.TOP_BOTTOM
            )
        }
        
        // Content container - centered vertically
        val contentContainer = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT,
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT
            ).apply {
                addRule(android.widget.RelativeLayout.CENTER_IN_PARENT)
            }
            setPadding(dpToPx(24), dpToPx(40), dpToPx(24), dpToPx(40))
        }
        
        // Avatar container with ring waves (will be animated)
        val avatarContainer = android.widget.FrameLayout(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.CENTER_HORIZONTAL
                bottomMargin = dpToPx(32)
            }
        }
        
        // Premium ring waves with gradient colors (will be animated)
        val ringWave1 = createPremiumRingWave(170, 0xFF22c55e.toInt(), 0xFF34d399.toInt())
        val ringWave2 = createPremiumRingWave(170, 0xFF16a34a.toInt(), 0xFF22c55e.toInt())
        val ringWave3 = createPremiumRingWave(170, 0xFF15803d.toInt(), 0xFF16a34a.toInt())
        
        avatarContainer.addView(ringWave1)
        avatarContainer.addView(ringWave2)
        avatarContainer.addView(ringWave3)
        
        // Premium avatar with gradient border and shadow
        callerAvatar = ImageView(this).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                dpToPx(160),
                dpToPx(160)
            ).apply {
                gravity = android.view.Gravity.CENTER
            }
            scaleType = ImageView.ScaleType.CENTER_CROP
            setImageResource(android.R.drawable.ic_menu_call)
            // Premium gradient border
            setPadding(dpToPx(6), dpToPx(6), dpToPx(6), dpToPx(6))
            background = createPremiumAvatarBorder()
            // Add shadow/elevation
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                elevation = dpToPx(16).toFloat()
            }
        }
        avatarContainer.addView(callerAvatar)
        
        contentContainer.addView(avatarContainer)
        
        // Caller info container
        val callerInfoContainer = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.CENTER_HORIZONTAL
                bottomMargin = dpToPx(48)
            }
        }
        
        // Premium caller name with gradient text effect
        callerNameText = TextView(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.CENTER_HORIZONTAL
                bottomMargin = dpToPx(20)
            }
            textSize = 42f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(0xFF111827.toInt()) // Dark text on white background
            gravity = android.view.Gravity.CENTER
            // Add subtle shadow for depth
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                setShadowLayer(dpToPx(2).toFloat(), 0f, dpToPx(1).toFloat(), 0x1A000000.toInt())
            }
        }
        callerInfoContainer.addView(callerNameText)
        
        // Premium calling status card with glassmorphism
        val callingCard = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setPadding(dpToPx(24), dpToPx(14), dpToPx(24), dpToPx(14))
            background = createPremiumStatusCard()
            // Add shadow
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                elevation = dpToPx(8).toFloat()
            }
        }
        
        // Premium pulsing dot with gradient
        val pulsingDot = View(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(
                dpToPx(12),
                dpToPx(12)
            ).apply {
                marginEnd = dpToPx(12)
            }
            background = createGradientCircleDrawable(dpToPx(12), 0xFF22c55e.toInt(), 0xFF34d399.toInt())
        }
        callingCard.addView(pulsingDot)
        
        // Premium calling text
        val callingText = TextView(this).apply {
            text = "Входящо обаждане..."
            textSize = 17f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(0xFF15803d.toInt()) // Dark green text
        }
        callingCard.addView(callingText)
        
        callerInfoContainer.addView(callingCard)
        contentContainer.addView(callerInfoContainer)
        
        // Buttons container
        val buttonsContainer = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }
        
        // Accept button (left) - зелена слушалка отляво
        acceptButton = createPremiumButton("Приеми", 0xFF10b981.toInt())
        buttonsContainer.addView(acceptButton)
        
        // Spacer
        val spacer = View(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(
                dpToPx(70),
                dpToPx(1)
            )
        }
        buttonsContainer.addView(spacer)
        
        // Reject button (right) - червена слушалка отдясно
        rejectButton = createPremiumButton("Откажи", 0xFFef4444.toInt())
        buttonsContainer.addView(rejectButton)
        
        contentContainer.addView(buttonsContainer)
        mainContainer.addView(contentContainer)
        
        // Start animations
        startAnimations(ringWave1, ringWave2, ringWave3, callerAvatar, pulsingDot)
        
        return mainContainer
    }
    
    /**
     * Create premium ring wave with gradient for animation
     */
    private fun createPremiumRingWave(size: Int, color1: Int, color2: Int): View {
        return View(this).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                dpToPx(size),
                dpToPx(size)
            ).apply {
                gravity = android.view.Gravity.CENTER
            }
            background = createGradientCircleDrawable(dpToPx(size), color1, color2)
            alpha = 0.6f
        }
    }
    
    /**
     * Create WORLD-CLASS premium button with 3D gradient effect
     */
    private fun createPremiumButton(text: String, baseColor: Int): Button {
        val button = Button(this).apply {
            this.text = text
            layoutParams = android.widget.LinearLayout.LayoutParams(
                dpToPx(88),
                dpToPx(88)
            )
            setTextColor(ContextCompat.getColor(this@IncomingCallActivity, android.R.color.white))
            textSize = 13f
            setTypeface(null, android.graphics.Typeface.BOLD)
            // Premium gradient background
            val lighterColor = if (baseColor == 0xFF10b981.toInt()) {
                0xFF34d399.toInt() // Lighter green for accept
            } else {
                0xFFf87171.toInt() // Lighter red for reject
            }
            background = createPremiumButtonDrawable(baseColor, lighterColor)
            // Premium shadow/elevation
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                elevation = dpToPx(12).toFloat()
            }
        }
        return button
    }
    
    /**
     * Create gradient circle drawable
     */
    private fun createGradientCircleDrawable(size: Int, color1: Int, color2: Int): android.graphics.drawable.Drawable {
        val drawable = android.graphics.drawable.GradientDrawable(
            android.graphics.drawable.GradientDrawable.Orientation.TL_BR,
            intArrayOf(color1, color2)
        ).apply {
            shape = android.graphics.drawable.GradientDrawable.OVAL
            setSize(size, size)
        }
        return drawable
    }
    
    /**
     * Create circle drawable
     */
    private fun createCircleDrawable(size: Int, color: Int): android.graphics.drawable.Drawable {
        val drawable = android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.OVAL
            setColor(color)
            setSize(size, size)
        }
        return drawable
    }
    
    /**
     * Create premium gradient drawable
     */
    private fun createGradientDrawable(colors: IntArray, orientation: android.graphics.drawable.GradientDrawable.Orientation): android.graphics.drawable.Drawable {
        val drawable = android.graphics.drawable.GradientDrawable(orientation, colors)
        return drawable
    }
    
    /**
     * Create premium avatar border with gradient
     */
    private fun createPremiumAvatarBorder(): android.graphics.drawable.Drawable {
        val drawable = android.graphics.drawable.GradientDrawable(
            android.graphics.drawable.GradientDrawable.Orientation.TL_BR,
            intArrayOf(0xFF22c55e.toInt(), 0xFF34d399.toInt())
        ).apply {
            shape = android.graphics.drawable.GradientDrawable.OVAL
            setSize(dpToPx(160), dpToPx(160))
            setStroke(dpToPx(6), 0xFF22c55e.toInt())
        }
        return drawable
    }
    
    /**
     * Create premium status card with glassmorphism
     */
    private fun createPremiumStatusCard(): android.graphics.drawable.Drawable {
        val drawable = android.graphics.drawable.GradientDrawable(
            android.graphics.drawable.GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(0xFFFFFFFF.toInt(), 0xFFF8FAFC.toInt())
        ).apply {
            shape = android.graphics.drawable.GradientDrawable.RECTANGLE
            cornerRadius = dpToPx(28).toFloat()
            setStroke(dpToPx(2), 0xFFE5E7EB.toInt()) // Light gray border
            // Add subtle shadow effect with alpha
            setColor(0xFFFFFFFF.toInt())
        }
        return drawable
    }
    
    /**
     * Create premium button drawable with 3D gradient effect
     */
    private fun createPremiumButtonDrawable(color1: Int, color2: Int): android.graphics.drawable.Drawable {
        val drawable = android.graphics.drawable.GradientDrawable(
            android.graphics.drawable.GradientDrawable.Orientation.TL_BR,
            intArrayOf(color2, color1) // Lighter to darker for 3D effect
        ).apply {
            shape = android.graphics.drawable.GradientDrawable.OVAL
            setSize(dpToPx(88), dpToPx(88))
        }
        return drawable
    }
    
    /**
     * Create rounded rectangle drawable
     */
    private fun createRoundedRectDrawable(radius: Int, fillColor: Int, borderColor: Int): android.graphics.drawable.Drawable {
        val drawable = android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.RECTANGLE
            setColor(fillColor)
            cornerRadius = radius.toFloat()
            setStroke(dpToPx(1), borderColor)
        }
        return drawable
    }
    
    /**
     * Start animations for ring waves, avatar pulse, and pulsing dot
     */
    private fun startAnimations(ringWave1: View, ringWave2: View, ringWave3: View, avatar: ImageView, dot: View) {
        // Premium ring wave 1 animation with smoother easing
        val anim1 = android.animation.ObjectAnimator.ofFloat(ringWave1, "scaleX", 1f, 2.1f).apply {
            duration = 1800
            interpolator = android.view.animation.AccelerateDecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim1Y = android.animation.ObjectAnimator.ofFloat(ringWave1, "scaleY", 1f, 2.1f).apply {
            duration = 1800
            interpolator = android.view.animation.AccelerateDecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim1Alpha = android.animation.ObjectAnimator.ofFloat(ringWave1, "alpha", 0.6f, 0f).apply {
            duration = 1800
            interpolator = android.view.animation.DecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        
        // Premium ring wave 2 animation (delayed) with smoother easing
        val anim2 = android.animation.ObjectAnimator.ofFloat(ringWave2, "scaleX", 1f, 2.6f).apply {
            duration = 1800
            startDelay = 400
            interpolator = android.view.animation.AccelerateDecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim2Y = android.animation.ObjectAnimator.ofFloat(ringWave2, "scaleY", 1f, 2.6f).apply {
            duration = 1800
            startDelay = 400
            interpolator = android.view.animation.AccelerateDecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim2Alpha = android.animation.ObjectAnimator.ofFloat(ringWave2, "alpha", 0.5f, 0f).apply {
            duration = 1800
            startDelay = 400
            interpolator = android.view.animation.DecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        
        // Premium ring wave 3 animation (more delayed) with smoother easing
        val anim3 = android.animation.ObjectAnimator.ofFloat(ringWave3, "scaleX", 1f, 3.2f).apply {
            duration = 1800
            startDelay = 800
            interpolator = android.view.animation.AccelerateDecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim3Y = android.animation.ObjectAnimator.ofFloat(ringWave3, "scaleY", 1f, 3.2f).apply {
            duration = 1800
            startDelay = 800
            interpolator = android.view.animation.AccelerateDecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        val anim3Alpha = android.animation.ObjectAnimator.ofFloat(ringWave3, "alpha", 0.4f, 0f).apply {
            duration = 1800
            startDelay = 800
            interpolator = android.view.animation.DecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.RESTART
        }
        
        // Premium avatar pulse animation with spring effect
        val avatarPulse = android.animation.ObjectAnimator.ofFloat(avatar, "scaleX", 1f, 1.15f).apply {
            duration = 1200
            interpolator = android.view.animation.OvershootInterpolator(0.5f)
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.REVERSE
        }
        val avatarPulseY = android.animation.ObjectAnimator.ofFloat(avatar, "scaleY", 1f, 1.15f).apply {
            duration = 1200
            interpolator = android.view.animation.OvershootInterpolator(0.5f)
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.REVERSE
        }
        
        // Premium pulsing dot animation with smoother easing
        val dotPulse = android.animation.ObjectAnimator.ofFloat(dot, "alpha", 1f, 0.2f).apply {
            duration = 1200
            interpolator = android.view.animation.AccelerateDecelerateInterpolator()
            repeatCount = android.animation.ObjectAnimator.INFINITE
            repeatMode = android.animation.ObjectAnimator.REVERSE
        }
        
        // Start all animations
        android.animation.AnimatorSet().apply {
            playTogether(anim1, anim1Y, anim1Alpha, anim2, anim2Y, anim2Alpha, anim3, anim3Y, anim3Alpha, avatarPulse, avatarPulseY, dotPulse)
            start()
        }
    }

    /**
     * Setup UI with caller information
     */
    private fun setupUI(callerName: String, callerImageUrl: String?) {
        callerNameText.text = callerName
        
        // Load avatar
        if (!callerImageUrl.isNullOrEmpty()) {
            Glide.with(this)
                .load(callerImageUrl)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop()
                .placeholder(android.R.drawable.ic_menu_call)
                .error(android.R.drawable.ic_menu_call)
                .into(callerAvatar)
        } else {
            callerAvatar.setImageResource(android.R.drawable.ic_menu_call)
        }
    }

    /**
     * Setup button listeners
     */
    // CRITICAL FIX: Accept nullable participantId and flag indicating if it was provided
    // This allows us to only include participantId in the intent if it was originally provided
    private fun setupButtonListeners(conversationId: String?, participantId: Long?, participantIdProvided: Boolean) {
        acceptButton.setOnClickListener {
            Log.d("IncomingCallActivity", "📞 Accept button clicked")
            // CRITICAL: Stop foreground service when call is accepted
            try {
                IncomingCallService.stopService(this)
                Log.d("IncomingCallActivity", "📞 Foreground service stopped (call accepted)")
            } catch (e: Exception) {
                Log.e("IncomingCallActivity", "❌ Error stopping foreground service:", e)
            }
            // CRITICAL: Stop sound before navigating
            stopIncomingCallSound()
            // CRITICAL FIX: Open app and accept call WITHOUT cold restart
            // Use SINGLE_TOP to resume existing MainActivity without destroying it
            // Use REORDER_TO_FRONT to bring MainActivity to front if it's in back stack
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                putExtra("action", "accept_call")
                conversationId?.let { putExtra("conversationId", it) }
                // CRITICAL FIX: Only include participantId if it was originally provided in the intent
                // This allows MainActivity to distinguish between missing participantId (null) and valid 0
                if (participantIdProvided && participantId != null) {
                    putExtra("participantId", participantId)
                }
            }
            startActivity(intent)
            finish()
        }
        
        rejectButton.setOnClickListener {
            Log.d("IncomingCallActivity", "📞 Reject button clicked")
            // CRITICAL: Stop foreground service when call is rejected
            try {
                IncomingCallService.stopService(this)
                Log.d("IncomingCallActivity", "📞 Foreground service stopped (call rejected)")
            } catch (e: Exception) {
                Log.e("IncomingCallActivity", "❌ Error stopping foreground service:", e)
            }
            // CRITICAL: Stop sound before navigating
            stopIncomingCallSound()
            // CRITICAL FIX: Open app and reject call WITHOUT cold restart
            // Use SINGLE_TOP to resume existing MainActivity without destroying it
            // Use REORDER_TO_FRONT to bring MainActivity to front if it's in back stack
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                putExtra("action", "reject_call")
                conversationId?.let { putExtra("conversationId", it) }
                // CRITICAL FIX: Only include participantId if it was originally provided in the intent
                // This allows MainActivity to distinguish between missing participantId (null) and valid 0
                if (participantIdProvided && participantId != null) {
                    putExtra("participantId", participantId)
                }
            }
            startActivity(intent)
            finish()
        }
    }

    /**
     * Convert dp to pixels
     */
    private fun dpToPx(dp: Int): Int {
        val density = resources.displayMetrics.density
        return (dp * density).toInt()
    }

    override fun onPause() {
        super.onPause()
        // CRITICAL: Don't stop sound on pause - keep playing even if user switches apps
        // Only stop when activity is destroyed or call is accepted/rejected
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // CRITICAL: Unregister BroadcastReceiver
        unregisterCallStateReceiver()
        // CRITICAL: Release Wake Lock when activity is destroyed
        releaseWakeLock()
        // CRITICAL: Stop sound when activity is destroyed
        stopIncomingCallSound()
        Log.d("IncomingCallActivity", "📞 IncomingCallActivity destroyed")
    }
    
    /**
     * Register BroadcastReceiver to listen for call state changes
     * CRITICAL: This allows IncomingCallActivity to automatically close when call ends
     */
    private fun registerCallStateReceiver() {
        callStateReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val action = intent?.action
                val state = intent?.getStringExtra("state")
                Log.d("IncomingCallActivity", "📞 BroadcastReceiver received action: $action, state: $state")
                
                // CRITICAL: Close activity when call ends (IDLE, DISCONNECTED, REJECTED, ENDED)
                // Check both action and state for compatibility
                val shouldClose = action == "com.svmessengermobile.CALL_ENDED" ||
                        action == "com.svmessengermobile.CALL_REJECTED" ||
                        action == "com.svmessengermobile.CALL_IDLE" ||
                        action == "com.svmessengermobile.CALL_STATE_CHANGED" && 
                        (state == "IDLE" || state == "DISCONNECTED" || state == "REJECTED" || state == "ENDED")
                
                if (shouldClose) {
                    Log.d("IncomingCallActivity", "📞 Call ended (action=$action, state=$state) - closing IncomingCallActivity")
                    // Stop sound before closing
                    stopIncomingCallSound()
                    // Release wake lock
                    releaseWakeLock()
                    // Finish activity
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        finishAndRemoveTask()
                    } else {
                        finish()
                    }
                }
            }
        }
        
        // Register receiver for local broadcasts
        val filter = IntentFilter().apply {
            addAction("com.svmessengermobile.CALL_ENDED")
            addAction("com.svmessengermobile.CALL_REJECTED")
            addAction("com.svmessengermobile.CALL_IDLE")
            addAction("com.svmessengermobile.CALL_STATE_CHANGED") // CRITICAL: Also listen for CALL_STATE_CHANGED
        }
        
        try {
            LocalBroadcastManager.getInstance(this).registerReceiver(callStateReceiver!!, filter)
            Log.d("IncomingCallActivity", "✅ BroadcastReceiver registered for call state changes")
        } catch (e: Exception) {
            Log.e("IncomingCallActivity", "❌ Error registering BroadcastReceiver:", e)
        }
    }
    
    /**
     * Unregister BroadcastReceiver
     */
    private fun unregisterCallStateReceiver() {
        callStateReceiver?.let {
            try {
                LocalBroadcastManager.getInstance(this).unregisterReceiver(it)
                Log.d("IncomingCallActivity", "✅ BroadcastReceiver unregistered")
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


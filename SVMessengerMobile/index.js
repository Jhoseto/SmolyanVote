/**
 * SVMessenger Mobile - Entry Point
 * Това е главният entry point на приложението
 * 
 * ВАЖНО: WebRTC globals ТРЯБВА да се регистрират ПРЕДИ всички imports,
 * защото livekit-client се импортира в CallScreen и се инициализира веднага.
 */

// ========== STEP 1: Register WebRTC globals FIRST (before any imports) ==========
// Using @livekit/react-native's registerGlobals() - the proper way for React Native
// ВАЖНО: Lazy import за да избегнем crash ако native модулът не е готов
try {
  const { registerGlobals } = require('@livekit/react-native');
  if (registerGlobals && typeof registerGlobals === 'function') {
    registerGlobals();
    console.log('✅ WebRTC globals registered successfully via @livekit/react-native');
  } else {
    console.warn('⚠️ registerGlobals is not available - WebRTC may not work');
  }
} catch (error) {
  console.error('❌ Failed to register WebRTC globals:', error?.message || error);
  console.warn('⚠️ App will continue but WebRTC features may not work');
  console.warn('⚠️ Ensure @livekit/react-native and @livekit/react-native-webrtc are installed and linked');
}

// ========== STEP 2: Polyfills for TextDecoder/TextEncoder ==========
// Modern React Native versions have built-in TextDecoder/TextEncoder
// Only add polyfills if they're not available
if (typeof global.TextDecoder === 'undefined') {
  try {
    // Try to use the built-in ones first
    const { TextDecoder: RNTextDecoder, TextEncoder: RNTextEncoder } = require('react-native');
    if (RNTextDecoder) global.TextDecoder = RNTextDecoder;
    if (RNTextEncoder) global.TextEncoder = RNTextEncoder;
  } catch (error) {
    console.warn('Built-in TextDecoder/TextEncoder not available, using basic polyfills');
    // Fallback to basic polyfills only if needed
    global.TextDecoder = class TextDecoder {
      constructor(encoding = 'utf-8') { this.encoding = encoding; }
      decode(input) { return String(input); }
    };
    global.TextEncoder = class TextEncoder {
      constructor(encoding = 'utf-8') { this.encoding = encoding; }
      encode(input) { return new Uint8Array(Buffer.from(String(input))); }
    };
  }
}

// ========== STEP 3: Now import React Native modules ==========
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register the main app component
AppRegistry.registerComponent(appName, () => App);

/**
 * Background Message Handler for Firebase
 * Това се изпълнява в background thread за background notifications
 * ВАЖНО: Lazy import за да избегнем crash ако Firebase не е инициализиран
 */
// Register background handler (only if Firebase is available) - LAZY IMPORT
try {
  // Lazy import - само когато е нужно, не при module load
  const messaging = require('@react-native-firebase/messaging').default;
  if (messaging) {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification received:', remoteMessage);
      // Handle background notification here
      // Note: This runs in a separate thread, so you can't use React hooks or navigation here
    });
    console.log('✅ Firebase background message handler registered');
  }
} catch (error) {
  // Firebase не е наличен или не е инициализиран - това е OK, app-ът трябва да работи и без него
  console.warn('⚠️ Firebase messaging not available (non-critical):', error?.message || error);
  console.warn('⚠️ App will continue without push notifications background handler');
}

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
// Polyfill for TextDecoder and TextEncoder (required for STOMP WebSocket library)
// React Native doesn't have these built-in, so we need to add them
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    constructor(encoding = 'utf-8') {
      this.encoding = encoding;
    }
    decode(input) {
      if (typeof input === 'string') {
        return input;
      }
      // Convert Uint8Array or ArrayBuffer to string
      if (input instanceof Uint8Array) {
        let result = '';
        for (let i = 0; i < input.length; i++) {
          result += String.fromCharCode(input[i]);
        }
        return result;
      }
      if (input instanceof ArrayBuffer) {
        const view = new Uint8Array(input);
        let result = '';
        for (let i = 0; i < view.length; i++) {
          result += String.fromCharCode(view[i]);
        }
        return result;
      }
      return String(input);
    }
  };
}

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    constructor(encoding = 'utf-8') {
      this.encoding = encoding;
    }
    encode(input) {
      const str = String(input);
      const utf8 = [];
      for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        if (charCode < 0x80) {
          utf8.push(charCode);
        } else if (charCode < 0x800) {
          utf8.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
        } else if (charCode < 0xd800 || charCode >= 0xe000) {
          utf8.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
        } else {
          i++;
          charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charCode >> 18), 0x80 | ((charCode >> 12) & 0x3f), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
        }
      }
      return new Uint8Array(utf8);
    }
  };
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

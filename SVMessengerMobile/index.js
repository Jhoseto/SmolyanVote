/**
 * SVMessenger Mobile - Entry Point
 * Това е главният entry point на приложението
 * 
 * ВАЖНО: WebRTC globals ТРЯБВА да се регистрират ПРЕДИ всички imports,
 * защото livekit-client се импортира в CallScreen и се инициализира веднага.
 */

// ========== STEP 1: Register WebRTC globals FIRST (before any imports) ==========
// This MUST happen before any code that imports livekit-client
// Using require() instead of import ensures this executes immediately, before ES6 imports
let webrtcRegistered = false;
try {
  const webrtc = require('react-native-webrtc');
  
  if (webrtc && webrtc.RTCPeerConnection) {
    const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream, MediaStreamTrack, mediaDevices } = webrtc;
    
    // Verify all required APIs are available
    const hasRequiredAPIs = RTCPeerConnection && 
                            RTCSessionDescription && 
                            RTCIceCandidate && 
                            MediaStream && 
                            MediaStreamTrack;
    
    if (!hasRequiredAPIs) {
      console.error('❌ Missing required WebRTC APIs:', {
        hasRTCPeerConnection: !!RTCPeerConnection,
        hasRTCSessionDescription: !!RTCSessionDescription,
        hasRTCIceCandidate: !!RTCIceCandidate,
        hasMediaStream: !!MediaStream,
        hasMediaStreamTrack: !!MediaStreamTrack,
      });
      throw new Error('Missing required WebRTC APIs');
    }
    
    // Set global WebRTC APIs that livekit-client expects
    global.RTCPeerConnection = RTCPeerConnection;
    global.RTCSessionDescription = RTCSessionDescription;
    global.RTCIceCandidate = RTCIceCandidate;
    global.MediaStream = MediaStream;
    global.MediaStreamTrack = MediaStreamTrack;
    
    // getUserMedia is CRITICAL for livekit-client - must be bound successfully
    let getUserMediaBound = false;
    let getUserMediaError = null;
    
    if (mediaDevices && mediaDevices.getUserMedia) {
      try {
        global.navigator = global.navigator || {};
        global.navigator.mediaDevices = global.navigator.mediaDevices || {};
        global.navigator.mediaDevices.getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
        
        // Verify binding was successful
        if (typeof global.navigator.mediaDevices.getUserMedia === 'function') {
          getUserMediaBound = true;
          console.log('✅ getUserMedia bound successfully');
        } else {
          getUserMediaError = 'getUserMedia binding failed - function is not callable after binding';
          console.error('❌', getUserMediaError);
        }
      } catch (bindError) {
        getUserMediaError = `Error binding getUserMedia: ${bindError.message}`;
        console.error('❌', getUserMediaError);
      }
    } else {
      getUserMediaError = 'mediaDevices or getUserMedia is undefined';
      console.error('❌', getUserMediaError, {
        hasMediaDevices: !!mediaDevices,
        hasGetUserMedia: !!(mediaDevices && mediaDevices.getUserMedia),
      });
    }
    
    // Only mark as registered if getUserMedia was successfully bound
    if (!getUserMediaBound) {
      console.error('❌ getUserMedia is required for livekit-client but was not bound');
      console.error('❌ getUserMedia error:', getUserMediaError);
      throw new Error(`getUserMedia binding failed: ${getUserMediaError || 'unknown error'}`);
    }
    
    // Also set window for compatibility (some libraries check window instead of global)
    if (typeof global.window === 'undefined') {
      global.window = global;
    }
    
    // Verify all globals are set correctly
    // CRITICAL: getUserMediaBound MUST be true for registration to succeed
    const allGlobalsSet = getUserMediaBound && // Explicit check that getUserMedia was bound
                         global.RTCPeerConnection &&
                         global.RTCSessionDescription &&
                         global.RTCIceCandidate &&
                         global.MediaStream &&
                         global.MediaStreamTrack &&
                         typeof global.navigator?.mediaDevices?.getUserMedia === 'function';
    
    if (allGlobalsSet) {
      webrtcRegistered = true;
      console.log('✅ WebRTC globals registered successfully for livekit-client');
      console.log('✅ Verified: RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream, MediaStreamTrack, getUserMedia');
    } else {
      console.error('❌ WebRTC globals verification failed:', {
        getUserMediaBound: getUserMediaBound, // Explicit check result
        hasRTCPeerConnection: !!global.RTCPeerConnection,
        hasRTCSessionDescription: !!global.RTCSessionDescription,
        hasRTCIceCandidate: !!global.RTCIceCandidate,
        hasMediaStream: !!global.MediaStream,
        hasMediaStreamTrack: !!global.MediaStreamTrack,
        hasGetUserMedia: typeof global.navigator?.mediaDevices?.getUserMedia === 'function',
      });
      throw new Error('WebRTC globals verification failed');
    }
  } else {
    console.warn('⚠️ react-native-webrtc module loaded but RTCPeerConnection is undefined');
    console.warn('⚠️ This usually means the native module is not properly linked');
  }
} catch (error) {
  console.error('❌ Failed to register WebRTC globals:', error.message);
  console.error('❌ Error details:', error);
  console.warn('⚠️ This usually means:');
  console.warn('   1. react-native-webrtc is not installed (run: npm install react-native-webrtc)');
  console.warn('   2. Native module is not linked (rebuild Android app after npm install)');
  console.warn('   3. Android app needs to be rebuilt (cd android && ./gradlew clean && cd .. && npm run android)');
  webrtcRegistered = false;
}

// Verify registration
if (!webrtcRegistered) {
  console.error('❌ CRITICAL: WebRTC globals NOT registered! LiveKit calls will fail!');
  console.error('❌ Please rebuild Android app: cd android && ./gradlew clean && cd .. && npm run android');
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

// ========== STEP 3: Now import React Native modules (after WebRTC setup) ==========
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register the main app component
AppRegistry.registerComponent(appName, () => App);

/**
 * Background Message Handler for Firebase
 * Това се изпълнява в background thread за background notifications
 */
// Register background handler (only if Firebase is available)
try {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background notification received:', remoteMessage);
    // Handle background notification here
    // Note: This runs in a separate thread, so you can't use React hooks or navigation here
  });
} catch (error) {
  console.warn('Firebase messaging not initialized yet:', error);
}

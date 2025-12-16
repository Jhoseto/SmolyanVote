/**
 * SVMessenger Mobile - Entry Point
 * Това е главният entry point на приложението
 */

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

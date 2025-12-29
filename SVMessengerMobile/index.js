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
      encode(input) {
        // React Native doesn't have Buffer - use manual UTF-8 encoding
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
}

// ========== STEP 3: Global Error Handling ==========
// Handle unhandled promise rejections to prevent app crashes
if (typeof global !== 'undefined') {
  // Handle unhandled promise rejections
  if (typeof Promise !== 'undefined' && Promise.reject) {
    const originalReject = Promise.reject;
    Promise.reject = function(reason) {
      console.error('🚨 Unhandled promise rejection:', reason);
      return originalReject.call(this, reason);
    };
  }
  
  // Handle global errors
  if (global.ErrorUtils) {
    const originalHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('🚨 Global error handler:', error, { isFatal });
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }
}

// ========== STEP 4: Import React Native modules ==========
console.log('📦 [index.js] Step 4: Importing React Native modules...');

// Wrap everything in a try-catch to prevent silent crashes
try {
  const { AppRegistry } = require('react-native');
  console.log('✅ [index.js] AppRegistry imported');
  
  console.log('📦 [index.js] Importing App component...');
  const App = require('./App').default;
  console.log('✅ [index.js] App component imported');
  
  console.log('📦 [index.js] Loading app.json...');
  const appJson = require('./app.json');
  const appName = appJson.name;
  console.log('✅ [index.js] App name:', appName);
  
  console.log('📦 [index.js] Registering app component...');
  
  // Wrap App component in error boundary
  const SafeApp = () => {
    try {
      console.log('🚀 [index.js] SafeApp rendering...');
      return App();
    } catch (error) {
      console.error('❌ [index.js] Error rendering App:', error);
      const React = require('react');
      const { View, Text } = require('react-native');
      return React.createElement(View, {
        style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }
      }, [
        React.createElement(Text, {
          key: 'title',
          style: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#000' }
        }, 'Грешка при стартиране'),
        React.createElement(Text, {
          key: 'message',
          style: { fontSize: 14, color: '#666', textAlign: 'center' }
        }, error?.message || 'Неизвестна грешка')
      ]);
    }
  };
  
  AppRegistry.registerComponent(appName, () => {
    console.log('🚀 [index.js] App component registered, will render on mount');
    return SafeApp;
  });
  console.log('✅ [index.js] App component registered successfully');
} catch (error) {
  console.error('❌ [index.js] CRITICAL ERROR during app registration:', error);
  console.error('❌ [index.js] Error message:', error?.message);
  console.error('❌ [index.js] Error stack:', error?.stack);
  
  // Try to register a minimal error component
  try {
    const { AppRegistry } = require('react-native');
    const { View, Text } = require('react-native');
    const appJson = require('./app.json');
    AppRegistry.registerComponent(appJson.name, () => {
      return () => {
        const React = require('react');
        const { View, Text } = require('react-native');
        return React.createElement(View, {
          style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }
        }, [
          React.createElement(Text, {
            key: 'title',
            style: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#000' }
          }, 'Грешка при стартиране'),
          React.createElement(Text, {
            key: 'message',
            style: { fontSize: 14, color: '#666', textAlign: 'center' }
          }, error?.message || 'Неизвестна грешка'),
          React.createElement(Text, {
            key: 'hint',
            style: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10 }
          }, 'Провери конзолата за детайли')
        ]);
      };
    });
    console.log('✅ [index.js] Fallback error component registered');
  } catch (fallbackError) {
    console.error('❌ [index.js] Even fallback registration failed:', fallbackError);
    console.error('❌ [index.js] Fallback error:', fallbackError?.message);
    console.error('❌ [index.js] Fallback stack:', fallbackError?.stack);
  }
}

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

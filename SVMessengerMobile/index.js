/**
 * SVMessenger Mobile - Entry Point
 * Това е главният entry point на приложението
 */

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

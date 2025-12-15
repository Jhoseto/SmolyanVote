/**
 * Background Message Handler for Firebase
 * Това се изпълнява в background thread за background notifications
 */

import messaging from '@react-native-firebase/messaging';

// Register background handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification received:', remoteMessage);
  // Handle background notification here
  // Note: This runs in a separate thread, so you can't use React hooks or navigation here
});

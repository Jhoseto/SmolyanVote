import React from 'react';
import { SVMessengerProvider } from './context/SVMessengerContext';
import SVMessengerWidget from './components/SVMessengerWidget';

/**
 * Главен App компонент за SVMessenger
 * Проверява authentication и монтира widget-а
 */
function App() {
  // Вземи user data от window object (предаден от Thymeleaf)
  const userData = window.SVMESSENGER_USER_DATA || { isAuthenticated: false };
  
  // Debug log
  if (process.env.NODE_ENV === 'development') {
    console.log('SVMessenger User Data:', userData);
  }
  
  // Ако user не е authenticated, не показвай нищо
  if (!userData.isAuthenticated) {
    console.log('SVMessenger: User not authenticated, hiding widget');
    return null;
  }
  
  return (
    <SVMessengerProvider userData={userData}>
      <SVMessengerWidget />
    </SVMessengerProvider>
  );
}

export default App;

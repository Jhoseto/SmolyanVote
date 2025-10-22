import React from 'react';
import { SVMessengerProvider } from './context/SVMessengerContext';
import SVMessengerWidget from './components/SVMessengerWidget';

/**
 * Главен App компонент за SVMessenger
 */
function App() {
  // Вземи user data от window object (предаден от Thymeleaf)
  const userData = window.SVMESSENGER_USER_DATA || { isAuthenticated: false };
  
  // Ако user не е authenticated, не показвай нищо
  if (!userData.isAuthenticated) {
    return null;
  }
  
  return (
    <SVMessengerProvider userData={userData}>
      <SVMessengerWidget />
    </SVMessengerProvider>
  );
}

export default App;

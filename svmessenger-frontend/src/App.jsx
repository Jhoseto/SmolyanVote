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

  // TEMPORARY: Force authentication for testing
  userData.isAuthenticated = true;
  userData.id = 1;  // Krupi ID
  userData.username = 'krupi';
  userData.email = 'krupek@smolyanvote.com';

  // Debug log
  console.log('🎯 App component userData:', userData);
  if (process.env.NODE_ENV === 'development') {
  }

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

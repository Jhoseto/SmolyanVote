import React, { useEffect } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import UserSearch from './UserSearch';
import './SVMessengerWidget.css';

/**
 * Главен SVMessenger Widget компонент
 */
function SVMessengerWidget() {
  const {
    isOpen,
    isLoading,
    error,
    currentUser,
    loadConversations,
    clearError
  } = useSVMessenger();
  
  // Load conversations on mount
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, loadConversations]);
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);
  
  if (!currentUser) {
    return null;
  }
  
  return (
    <div className={`svmessenger-widget ${isOpen ? 'open' : ''}`}>
      {/* Error notification */}
      {error && (
        <div className="svmessenger-error">
          <span>{error}</span>
          <button onClick={clearError} className="close-error">×</button>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="svmessenger-loading">
          <div className="spinner"></div>
          <span>Зареждане...</span>
        </div>
      )}
      
      {/* Main content */}
      <div className="svmessenger-content">
        <ConversationList />
        <ChatWindow />
        <UserSearch />
      </div>
    </div>
  );
}

export default SVMessengerWidget;

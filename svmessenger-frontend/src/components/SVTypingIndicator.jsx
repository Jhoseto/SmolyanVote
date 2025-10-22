import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';

/**
 * Typing Indicator компонент
 * Показва "User is typing..." анимация
 */
const SVTypingIndicator = ({ conversationId }) => {
  const { conversations, typingUsers } = useSVMessenger();
  
  const conversation = conversations.find(c => c.id === conversationId);
  const typingUserId = typingUsers[conversationId];
  
  if (!conversation || !typingUserId) {
    return null;
  }

  // Find the user who is typing
  const typingUser = conversation.otherUser;

  return (
    <div className="svmessenger-typing-indicator">
      <div className="svmessenger-typing-avatar">
        <img 
          src={typingUser.imageUrl || '/images/default-avatar.png'} 
          alt={typingUser.username}
          onError={(e) => {
            e.target.src = '/images/default-avatar.png';
          }}
        />
      </div>
      
      <div className="svmessenger-typing-content">
        <div className="svmessenger-typing-bubble">
          <div className="svmessenger-typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <span className="svmessenger-typing-text">
          {typingUser.realName || typingUser.username} пише...
        </span>
      </div>
    </div>
  );
};

export default SVTypingIndicator;

import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { formatMessageTimeOnly } from '../utils/svDateFormatter';
import { linkifyText, isOnlyEmoji } from '../utils/svHelpers';

/**
 * Single Message Item компонент
 * Показва едно съобщение в thread-а
 */
const SVMessageItem = ({ message }) => {
  const { currentUser } = useSVMessenger();
  
  const isOwnMessage = message.senderId === currentUser.id;
  const isEmojiOnly = isOnlyEmoji(message.text);

  return (
    <div className={`svmessenger-message-item ${isOwnMessage ? 'own' : 'other'}`}>
      {/* Avatar (only for other messages) */}
      {!isOwnMessage && (
        <div className="svmessenger-message-avatar">
          <img 
            src={message.senderImageUrl || '/images/default-avatar.png'} 
            alt={message.senderUsername}
            onError={(e) => {
              e.target.src = '/images/default-avatar.png';
            }}
          />
        </div>
      )}

      {/* Message Content */}
      <div className="svmessenger-message-content">
        {/* Message Bubble */}
        <div className={`svmessenger-message-bubble ${isEmojiOnly ? 'emoji-only' : ''}`}>
          <div 
            className="svmessenger-message-text"
            dangerouslySetInnerHTML={{ 
              __html: linkifyText(message.text) 
            }}
          />
        </div>
        
        {/* Message Time and Status (separate element below bubble) */}
        <div className="svmessenger-message-meta">
          <span className="svmessenger-message-time-only">
            {formatMessageTimeOnly(message.sentAt)}
          </span>
          
          {/* Read receipt for own messages */}
          {isOwnMessage && (
            <div className="svmessenger-message-read-status">
              {message.isRead ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SVMessageItem;

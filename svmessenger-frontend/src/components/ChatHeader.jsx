import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { formatDisplayName, getInitials } from '../utils/stringUtils';
import './ChatHeader.css';

/**
 * Header на чат прозореца
 */
function ChatHeader({ conversation }) {
  const { closeConversation } = useSVMessenger();
  
  const { participant } = conversation;
  const displayName = formatDisplayName(participant);
  const initials = getInitials(displayName);
  
  return (
    <div className="chat-header">
      <div className="chat-header-info">
        {/* Avatar */}
        <div className="chat-avatar">
          {participant.imageUrl ? (
            <img 
              src={participant.imageUrl} 
              alt={displayName}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-initials">
              {initials}
            </div>
          )}
          
          {/* Online status */}
          {participant.isOnline && (
            <div className="online-indicator"></div>
          )}
        </div>
        
        {/* User info */}
        <div className="chat-user-info">
          <h3 className="chat-user-name">{displayName}</h3>
          <p className="chat-user-status">
            {participant.isOnline ? 'Онлайн' : 'Офлайн'}
          </p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="chat-header-actions">
        <button 
          className="close-chat-btn"
          onClick={closeConversation}
          title="Затвори чат"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;

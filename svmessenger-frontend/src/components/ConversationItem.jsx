import React from 'react';
import { formatConversationDate } from '../utils/dateUtils';
import { formatDisplayName as formatName, getInitials, getFirstWords } from '../utils/stringUtils';
import './ConversationItem.css';

/**
 * Елемент от списъка с разговори
 */
function ConversationItem({ conversation, isActive, onClick, currentUser }) {
  const { participant, lastMessage, unreadCount } = conversation;
  
  // Определи кой е другият участник
  const otherParticipant = participant;
  const displayName = formatName(otherParticipant);
  const initials = getInitials(displayName);
  
  // Форматирай последното съобщение
  const lastMessageText = lastMessage 
    ? getFirstWords(lastMessage.messageText, 3)
    : 'Няма съобщения';
  
  const lastMessageTime = lastMessage 
    ? formatConversationDate(lastMessage.sentAt)
    : '';
  
  // Провери дали последното съобщение е от текущия user
  const isLastMessageFromMe = lastMessage && lastMessage.sender.id === currentUser.id;
  
  return (
    <div 
      className={`conversation-item ${isActive ? 'active' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="conversation-avatar">
        {otherParticipant.imageUrl ? (
          <img 
            src={otherParticipant.imageUrl} 
            alt={displayName}
            className="avatar-image"
          />
        ) : (
          <div className="avatar-initials">
            {initials}
          </div>
        )}
        
        {/* Online status indicator */}
        {otherParticipant.isOnline && (
          <div className="online-indicator"></div>
        )}
      </div>
      
      {/* Content */}
      <div className="conversation-content">
        <div className="conversation-header">
          <h4 className="conversation-name">{displayName}</h4>
          {lastMessageTime && (
            <span className="conversation-time">{lastMessageTime}</span>
          )}
        </div>
        
        <div className="conversation-preview">
          <p className={`conversation-message ${isLastMessageFromMe ? 'from-me' : ''}`}>
            {isLastMessageFromMe && 'Вие: '}
            {lastMessageText}
          </p>
          
          {/* Unread count */}
          {unreadCount > 0 && (
            <span className="unread-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationItem;

import React from 'react';
import { formatMessageDate } from '../utils/dateUtils';
import { formatMessageText, formatDisplayName, getInitials } from '../utils/stringUtils';
import './MessageItem.css';

/**
 * Елемент от списъка със съобщения
 */
function MessageItem({ message, currentUser, showAvatar, showTimestamp }) {
  const { sender, messageText, sentAt, isRead, isEdited } = message;
  const isFromMe = sender.id === currentUser.id;
  const displayName = formatDisplayName(sender);
  const initials = getInitials(displayName);
  
  // Форматирай текста на съобщението
  const formattedText = formatMessageText(messageText);
  
  return (
    <div className={`message-item ${isFromMe ? 'from-me' : 'from-other'}`}>
      {/* Avatar (само за съобщения от други потребители) */}
      {!isFromMe && showAvatar && (
        <div className="message-avatar">
          {sender.imageUrl ? (
            <img 
              src={sender.imageUrl} 
              alt={displayName}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-initials">
              {initials}
            </div>
          )}
        </div>
      )}
      
      {/* Message content */}
      <div className="message-content">
        {/* Sender name (само за съобщения от други потребители) */}
        {!isFromMe && showAvatar && (
          <div className="message-sender">
            {displayName}
          </div>
        )}
        
        {/* Message bubble */}
        <div className={`message-bubble ${isFromMe ? 'my-message' : 'other-message'}`}>
          <div 
            className="message-text"
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
          
          {/* Message status */}
          <div className="message-status">
            {isEdited && (
              <span className="edited-indicator">(редактирано)</span>
            )}
            <span className="message-time">
              {formatMessageDate(sentAt)}
            </span>
            {isFromMe && (
              <span className={`read-status ${isRead ? 'read' : 'unread'}`}>
                {isRead ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Timestamp (показва се под групата съобщения) */}
      {showTimestamp && (
        <div className="message-timestamp">
          {formatMessageDate(sentAt)}
        </div>
      )}
    </div>
  );
}

export default MessageItem;

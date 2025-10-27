import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { formatConversationTime } from '../utils/svDateFormatter';
import { truncateText } from '../utils/svHelpers';

/**
 * Single Conversation Item компонент
 * Показва един разговор в списъка
 */
const SVConversationItem = ({ conversation }) => {
  const { openChat, removeFromConversationList, activeChats } = useSVMessenger();
  
  // Check if this conversation is active (open as chat)
  const isActive = activeChats.some(chat => chat.conversation.id === conversation.id && !chat.isMinimized);

  const handleClick = () => {
    openChat(conversation.id);
  };

  const handleRemove = (e) => {
    e.stopPropagation(); // Prevent opening chat when clicking X
    if (removeFromConversationList) {
      removeFromConversationList(conversation.id);
    }
  };

  return (
    <div 
      className={`svmessenger-conversation-item ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      {/* Remove button */}
      <button 
        className="svmessenger-conversation-remove"
        onClick={handleRemove}
        title="Премахни от панела"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      {/* Avatar */}
      <div className="svmessenger-conversation-avatar">
        <img 
          src={conversation.otherUser.imageUrl || '/images/default-avatar.png'} 
          alt={conversation.otherUser.username}
          onError={(e) => {
            e.target.src = '/images/default-avatar.png';
          }}
        />
        {/* Online indicator */}
        {conversation.otherUser.isOnline && (
          <div className="svmessenger-online-indicator"></div>
        )}
      </div>

      {/* Content */}
      <div className="svmessenger-conversation-content">
        <div className="svmessenger-conversation-top-row">
          <h4 className="svmessenger-conversation-name">
            {conversation.otherUser.realName || conversation.otherUser.username}
          </h4>
          <span className="svmessenger-conversation-time">
            {formatConversationTime(conversation.lastMessage?.sentAt)}
          </span>
        </div>
        
        <div className="svmessenger-conversation-preview">
          <p className="svmessenger-conversation-text">
            {conversation.lastMessage ? 
              truncateText(conversation.lastMessage.text, 50) : 
              'Няма съобщения'
            }
          </p>
          
          {/* Unread count */}
          {conversation.unreadCount > 0 && (
            <span className="svmessenger-conversation-unread">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SVConversationItem;

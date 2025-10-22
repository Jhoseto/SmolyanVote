import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { formatConversationTime } from '../utils/svDateFormatter';
import { truncateText } from '../utils/svHelpers';

/**
 * Single Conversation Item компонент
 * Показва един разговор в списъка
 */
const SVConversationItem = ({ conversation }) => {
  const { openChat } = useSVMessenger();

  const handleClick = () => {
    openChat(conversation.id);
  };

  return (
    <div 
      className="svmessenger-conversation-item"
      onClick={handleClick}
    >
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
        <div className="svmessenger-conversation-header">
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

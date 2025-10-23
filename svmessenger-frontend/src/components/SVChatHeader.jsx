import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';

/**
 * Chat Header компонент
 * Показва информация за потребителя и контроли
 */
const SVChatHeader = ({ conversation, onClose, onMinimize }) => {
  const { otherUser } = conversation;

  return (
    <div className="svmessenger-chat-header">
      {/* User Info */}
      <div className="svmessenger-chat-user-info">
        <div className="svmessenger-chat-avatar">
          <img 
            src={otherUser.imageUrl || '/images/default-avatar.png'} 
            alt={otherUser.username}
            onError={(e) => {
              e.target.src = '/images/default-avatar.png';
            }}
          />
          {/* Online indicator */}
          {otherUser.isOnline && (
            <div className="svmessenger-online-indicator"></div>
          )}
        </div>
        
        <div className="svmessenger-chat-user-details">
          <h4 className="svmessenger-chat-username">
            {otherUser.realName || otherUser.username}
          </h4>
          <span className="svmessenger-chat-status">
            {otherUser.isOnline ? 'Онлайн' : 'Офлайн'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="svmessenger-chat-controls">
        <button 
          className="svmessenger-chat-minimize"
          onClick={onMinimize}
          title={conversation.isMinimized ? 'Разгъни' : 'Сгъни'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            {conversation.isMinimized ? (
              <path d="M19 13H5v-2h14v2z"/>
            ) : (
              <path d="M19 13H5v-2h14v2z"/>
            )}
          </svg>
        </button>
        
        <button 
          className="svmessenger-chat-close"
          onClick={onClose}
          title="Затвори"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SVChatHeader;

import React, { useState, useEffect } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVConversationItem from './SVConversationItem';
import { formatConversationTime } from '../utils/svDateFormatter';

/**
 * Conversation List Popup компонент
 * Показва списък с всички разговори
 */
const SVConversationList = ({ onClose, onSearchClick }) => {
  const {
    conversations,
    isLoadingConversations,
    loadConversations
  } = useSVMessenger();

  const [searchQuery, setSearchQuery] = useState('');

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.otherUser.username.toLowerCase().includes(query) ||
      conv.otherUser.realName?.toLowerCase().includes(query) ||
      conv.lastMessage?.text?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="svmessenger-conversation-list">
      {/* Header */}
      <div className="svmessenger-conversation-header">
        <h3>Съобщения</h3>
        <div className="svmessenger-conversation-actions">
          <button 
            className="svmessenger-search-btn"
            onClick={onSearchClick}
            title="Нов разговор"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </button>
          <button 
            className="svmessenger-close-btn"
            onClick={onClose}
            title="Затвори"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="svmessenger-search-input">
        <input
          type="text"
          placeholder="Търси в съществуващите разговори..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Conversations List */}
      <div className="svmessenger-conversations">
        {isLoadingConversations ? (
          <div className="svmessenger-loading">
            <div className="svmessenger-spinner"></div>
            <span>Зареждане...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="svmessenger-empty">
            {searchQuery ? (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <p>Няма намерени разговори</p>
              </>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <p>Няма съществуващи разговори</p>
                <small>Кликнете + за да започнете нов разговор</small>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <SVConversationItem
              key={conversation.id}
              conversation={conversation}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SVConversationList;

import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import ConversationItem from './ConversationItem';
import './ConversationList.css';

/**
 * Списък с разговори
 */
function ConversationList() {
  const {
    conversations,
    activeConversationId,
    openConversation,
    currentUser
  } = useSVMessenger();
  
  if (!conversations || conversations.length === 0) {
    return (
      <div className="conversation-list">
        <div className="conversation-list-header">
          <h3>Разговори</h3>
        </div>
        <div className="conversation-list-empty">
          <p>Няма разговори</p>
          <small>Започнете нов разговор от менюто</small>
        </div>
      </div>
    );
  }
  
  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h3>Разговори</h3>
        <button className="new-conversation-btn" title="Нов разговор">
          +
        </button>
      </div>
      
      <div className="conversation-list-items">
        {conversations.map(conversation => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onClick={() => openConversation(conversation.id)}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}

export default ConversationList;

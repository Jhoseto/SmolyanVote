import React, { useEffect, useRef } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import './ChatWindow.css';

/**
 * Чат прозорец за активен разговор
 */
function ChatWindow() {
  const {
    activeConversationId,
    conversations,
    messages,
    loadMessages,
    currentUser
  } = useSVMessenger();
  
  const chatWindowRef = useRef(null);
  
  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, activeConversationId]);
  
  if (!activeConversationId) {
    return (
      <div className="chat-window">
        <div className="chat-window-empty">
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Изберете разговор</h3>
            <p>Започнете разговор от списъка отляво</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Find active conversation
  const activeConversation = conversations.find(conv => conv.id === activeConversationId);
  const conversationMessages = messages[activeConversationId] || [];
  
  if (!activeConversation) {
    return (
      <div className="chat-window">
        <div className="chat-window-error">
          <p>Разговорът не е намерен</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chat-window">
      <ChatHeader conversation={activeConversation} />
      
      <div className="chat-messages" ref={chatWindowRef}>
        <MessageList 
          messages={conversationMessages}
          currentUser={currentUser}
        />
      </div>
      
      <MessageInput 
        conversationId={activeConversationId}
        onMessageSent={() => {
          // Auto-scroll will be handled by useEffect
        }}
      />
    </div>
  );
}

export default ChatWindow;

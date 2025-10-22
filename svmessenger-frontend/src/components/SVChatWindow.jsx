import React, { useEffect, useRef } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVChatHeader from './SVChatHeader';
import SVMessageThread from './SVMessageThread';
import SVMessageInput from './SVMessageInput';

/**
 * Chat Window компонент
 * Показва отворен разговор с header, messages и input
 */
const SVChatWindow = ({ conversation }) => {
  const { closeChat, minimizeChat } = useSVMessenger();
  const chatWindowRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.focus();
    }
  }, []);

  const handleClose = () => {
    closeChat(conversation.id);
  };

  const handleMinimize = () => {
    minimizeChat(conversation.id);
  };

  return (
    <div 
      ref={chatWindowRef}
      className={`svmessenger-chat-window ${conversation.isMinimized ? 'minimized' : ''}`}
      tabIndex={0}
    >
      {/* Header */}
      <SVChatHeader
        conversation={conversation}
        onClose={handleClose}
        onMinimize={handleMinimize}
      />

      {/* Messages Thread */}
      {!conversation.isMinimized && (
        <SVMessageThread conversationId={conversation.id} />
      )}

      {/* Message Input */}
      {!conversation.isMinimized && (
        <SVMessageInput conversationId={conversation.id} />
      )}
    </div>
  );
};

export default SVChatWindow;

import React, { useEffect, useRef } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVMessageItem from './SVMessageItem';
import SVTypingIndicator from './SVTypingIndicator';
import { useSVInfiniteScroll } from '../hooks/useSVInfiniteScroll';
import { scrollToBottom, isScrolledToBottom } from '../utils/svHelpers';

/**
 * Message Thread компонент
 * Показва списък с съобщения и поддържа infinite scroll
 */
const SVMessageThread = ({ conversationId }) => {
  const {
    messagesByConversation,
    loadingMessages,
    typingUsers,
    loadMessages
  } = useSVMessenger();

  const messages = Array.isArray(messagesByConversation[conversationId]) 
    ? messagesByConversation[conversationId] 
    : [];
  const isLoading = loadingMessages[conversationId] || false;
  const isTyping = typingUsers[conversationId];
  const messagesEndRef = useRef(null);
  const threadRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  // Infinite scroll hook - disabled for now to prevent infinite loading
  // const { lastMessageRef } = useSVInfiniteScroll(
  //   conversationId,
  //   loadMessages,
  //   false, // hasMore - disabled
  //   isLoading
  // );
  const lastMessageRef = null;

  // Auto-scroll to bottom on new messages (only when new messages arrive)
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && messagesEndRef.current) {
      scrollToBottom(threadRef.current);
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length]);

  // Scroll to bottom on mount and reset message count
  useEffect(() => {
    if (threadRef.current) {
      scrollToBottom(threadRef.current, false);
    }
    lastMessageCountRef.current = 0; // Reset message count for new conversation
  }, [conversationId]);

  return (
    <div className="svmessenger-message-thread" ref={threadRef}>
      {/* Loading indicator at top */}
      {isLoading && (
        <div className="svmessenger-loading-messages">
          <div className="svmessenger-spinner"></div>
        </div>
      )}

      {/* Messages */}
      <div className="svmessenger-messages">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          return (
            <div
              key={message.id}
              ref={isLast ? lastMessageRef : null}
            >
              <SVMessageItem message={message} />
            </div>
          );
        })}
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <SVTypingIndicator conversationId={conversationId} />
      )}

      {/* Scroll to bottom button */}
      {messages.length > 0 && !isScrolledToBottom(threadRef.current) && (
        <button
          className="svmessenger-scroll-to-bottom"
          onClick={() => scrollToBottom(threadRef.current)}
          title="Scroll to bottom"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      )}

      {/* Bottom anchor for auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default SVMessageThread;

import React, { useEffect, useRef } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVMessageItem from './SVMessageItem';
import SVTypingIndicator from './SVTypingIndicator';
import { useSVInfiniteScroll } from '../hooks/useSVInfiniteScroll';
import { scrollToBottom, isScrolledToBottom } from '../utils/svHelpers';
import { groupMessagesByDate } from '../utils/svDateFormatter';

/**
 * Message Thread компонент
 * Показва списък с съобщения и поддържа infinite scroll
 */
const SVMessageThread = ({ conversationId, searchQuery = '' }) => {
  const {
    messagesByConversation,
    loadingMessages,
    typingUsers,
    loadMessages
  } = useSVMessenger();

  const allMessages = Array.isArray(messagesByConversation[conversationId])
    ? messagesByConversation[conversationId]
    : [];

  // Filter messages based on search query
  const messages = searchQuery.trim()
    ? allMessages.filter(message =>
        message.text && message.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMessages;
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

  // FIX 3A: Auto-scroll to bottom on new messages с delay за animations
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && messagesEndRef.current) {
      const wasAtBottom = isScrolledToBottom(threadRef.current);
      if (wasAtBottom) {
        // Изчакай animations да завършат
        setTimeout(() => {
          scrollToBottom(threadRef.current);
        }, 300); // 300ms = stagger animations time
      }
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

  // FIX 3B: Директен scroll при първо отваряне (след load)
  useEffect(() => {
    if (messages.length > 0) {
      // Immediate scroll при първо зареждане
      setTimeout(() => {
        if (threadRef.current) {
          threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
      }, 400); // Малко повече за да catch stagger
    }
  }, [conversationId]); // Само при смяна на conversation

  // Group messages by date
  const groupedItems = groupMessagesByDate(messages);

  return (
    <div className="svmessenger-message-thread" ref={threadRef}>
      {/* Loading indicator at top */}
      {isLoading && (
        <div className="svmessenger-loading-messages">
          <div className="svmessenger-spinner"></div>
        </div>
      )}

      {/* Messages with date separators */}
      <div className="svmessenger-messages">
          {groupedItems.map((item, index) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${item.dateKey}`} className="svmessenger-date-separator">
                <span className="svmessenger-date-separator-text">
                  {item.formattedDate}
                </span>
              </div>
            );
          } else {
            const isLast = index === groupedItems.length - 1;
            return (
              <div key={item.message.id} ref={isLast ? lastMessageRef : null}>
                <SVMessageItem message={item.message} searchQuery={searchQuery} />
              </div>
            );
          }
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

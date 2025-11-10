import React, { useEffect, useRef, useLayoutEffect } from 'react';
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

  // Infinite scroll hook - disabled for now to prevent infinite loading
  // const { lastMessageRef } = useSVInfiniteScroll(
  //   conversationId,
  //   loadMessages,
  //   false, // hasMore - disabled
  //   isLoading
  // );
  const lastMessageRef = null;

  // СКРОЛВАЙ ДО ДОЛУ КОГАТО ИМА СЪОБЩЕНИЯ ИЛИ ПРОМЯНА
  useLayoutEffect(() => {
    if (threadRef.current && (messages.length > 0 || isLoading)) {
      // Скролвай до долу при всяка възможност
      const scrollToBottom = () => {
        if (threadRef.current) {
          threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
      };

      // Скролвай веднага
      scrollToBottom();

      // И след малко пак (за всеки случай)
      setTimeout(scrollToBottom, 10);
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, isLoading]);

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

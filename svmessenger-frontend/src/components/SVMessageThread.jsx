import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVMessageItem from './SVMessageItem';
import SVCallHistoryItem from './SVCallHistoryItem';
import SVTypingIndicator from './SVTypingIndicator';
import { useSVInfiniteScroll } from '../hooks/useSVInfiniteScroll';
import { scrollToBottom, isScrolledToBottom } from '../utils/svHelpers';
import { groupMessagesByDate } from '../utils/svDateFormatter';

/**
 * Message Thread компонент
 * Показва списък с съобщения и call history, поддържа infinite scroll
 */
const SVMessageThread = ({ conversationId, searchQuery = '' }) => {
  const {
    messagesByConversation,
    callHistoryByConversation,
    loadingMessages,
    loadingCallHistory,
    typingUsers,
    loadMessages,
    loadCallHistory,
    currentUser
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
  
  // Get call history for this conversation
  const callHistory = Array.isArray(callHistoryByConversation[conversationId])
    ? callHistoryByConversation[conversationId]
    : [];
  
  const isLoading = loadingMessages[conversationId] || false;
  const isLoadingCallHistory = loadingCallHistory[conversationId] || false;
  const isTyping = typingUsers[conversationId];
  const messagesEndRef = useRef(null);
  const threadRef = useRef(null);
  
  // Load call history when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadCallHistory(conversationId);
    }
  }, [conversationId, loadCallHistory]);

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

  // Group messages and call history by date
  console.log(`📞 [SVMessageThread] Processing: ${messages.length} messages, ${callHistory.length} call history entries`);
  const groupedItems = groupMessagesByDate(messages, callHistory);
  console.log(`📞 [SVMessageThread] Grouped items: ${groupedItems.length} total items (including date separators)`);
  
  // Log call history items
  const callHistoryItems = groupedItems.filter(item => item.type === 'callHistory');
  console.log(`📞 [SVMessageThread] Call history items in grouped: ${callHistoryItems.length}`);

  return (
    <div className="svmessenger-message-thread" ref={threadRef}>
      {/* Loading indicator at top */}
      {(isLoading || isLoadingCallHistory) && (
        <div className="svmessenger-loading-messages">
          <div className="svmessenger-spinner"></div>
        </div>
      )}

      {/* Messages and call history with date separators */}
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
          } else if (item.type === 'message' && item.message && item.message.id) {
            const isLast = index === groupedItems.length - 1;
            return (
              <div key={`message-${item.message.id}`} ref={isLast ? lastMessageRef : null}>
                <SVMessageItem message={item.message} searchQuery={searchQuery} />
              </div>
            );
          } else if (item.type === 'callHistory' && item.callHistory && item.callHistory.id) {
            return (
              <div key={`call-${item.callHistory.id}`}>
                <SVCallHistoryItem callHistory={item.callHistory} currentUserId={currentUser?.id} />
              </div>
            );
          }
          return null;
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

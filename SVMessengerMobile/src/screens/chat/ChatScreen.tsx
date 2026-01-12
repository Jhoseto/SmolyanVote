/**
 * Chat Screen
 * Екран за чат с конкретен потребител
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { ConversationsStackParamList } from '../../types/navigation';
import { useMessages } from '../../hooks/useMessages';
import { useCallHistory } from '../../hooks/useCallHistory';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { CallHistoryBubble } from '../../components/chat/CallHistoryBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageSearchBar } from '../../components/chat/MessageSearchBar';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { Loading } from '../../components/common';
import { Colors, Spacing, Typography } from '../../theme';
import { useConversationsStore } from '../../store/conversationsStore';
import { useAuthStore } from '../../store/authStore';
import { useCallsStore } from '../../store/callsStore';
import { CallState } from '../../types/call';
import { Message } from '../../types/message';
import { CallHistory } from '../../types/callHistory';
import { TelephoneIcon } from '../../components/common/Icons';

type ChatScreenRouteProp = RouteProp<ConversationsStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { conversationId, participantName } = route.params;
  const { conversations } = useConversationsStore();
  
  const conversation = conversations.find((c) => c.id === conversationId);
  const participant = conversation?.participant;
  const missedCalls = conversation?.missedCalls || 0;
  const { user } = useAuthStore();
  const { clearMissedCalls } = useConversationsStore();

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    handleTyping,
    loadMoreMessages,
    hasMore,
    isLoadingMore,
  } = useMessages(conversationId);

  const { callHistory, refreshCallHistory } = useCallHistory(conversationId);
  const { callState, currentCall } = useCallsStore();
  
  // CRITICAL FIX: Store conversationId in ref when call is active
  // This ensures we can check if call was for this conversation even after currentCall is cleared
  const activeCallConversationIdRef = useRef<number | null>(null);
  
  // Update ref when call becomes active
  useEffect(() => {
    if (currentCall?.conversationId && 
        (callState === CallState.INCOMING || 
         callState === CallState.OUTGOING || 
         callState === CallState.CONNECTING || 
         callState === CallState.CONNECTED)) {
      activeCallConversationIdRef.current = currentCall.conversationId;
    }
  }, [callState, currentCall?.conversationId]);
  
  // CRITICAL FIX: Refresh call history when call ends to show new call in chat
  // This ensures call history is updated immediately after a call completes
  const prevCallStateRef = useRef(callState);
  useEffect(() => {
    // Refresh call history when call transitions from active (CONNECTED, CONNECTING, OUTGOING, INCOMING) to IDLE/DISCONNECTED
    const wasActive = prevCallStateRef.current !== CallState.IDLE && prevCallStateRef.current !== CallState.DISCONNECTED;
    const isNowIdle = callState === CallState.IDLE || callState === CallState.DISCONNECTED;
    
    // CRITICAL FIX: Use ref to check conversationId instead of currentCall
    // currentCall is cleared by clearCall() after 1 second, so it may be null when this effect runs
    // The ref preserves the conversationId from when the call was active
    const isCallForThisConversation = activeCallConversationIdRef.current === conversationId;
    
    if (wasActive && isNowIdle && isCallForThisConversation) {
      // Small delay to ensure backend has processed the call end
      setTimeout(() => {
        refreshCallHistory();
        // Clear ref after refresh
        activeCallConversationIdRef.current = null;
      }, 1000);
    }
    
    prevCallStateRef.current = callState;
  }, [callState, conversationId, refreshCallHistory]);

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<{ id: number; text: string; senderName: string } | null>(null);
  const flatListRef = useRef<FlatList<Message | CallHistory>>(null);
  const scrollOffsetRef = useRef(0);
  const hasScrolledRef = useRef(false);

  // Combine messages and call history, sorted by time
  type ChatItem = { type: 'message'; data: Message } | { type: 'callHistory'; data: CallHistory };
  const chatItems: ChatItem[] = React.useMemo(() => {
    const items: ChatItem[] = [];
    
    // Add messages
    messages.forEach(msg => {
      items.push({ type: 'message', data: msg });
    });
    
    // Add call history
    // CRITICAL FIX: Ensure call history is properly added to chat items
    if (callHistory && Array.isArray(callHistory) && callHistory.length > 0) {
      callHistory.forEach(call => {
        if (call && call.id && call.startTime) {
          items.push({ type: 'callHistory', data: call });
        }
      });
    }
    
    // CRITICAL FIX: Sort by time ascending (oldest first, newest last)
    // FlatList is inverted={false}, so newest messages should be at the bottom
    items.sort((a, b) => {
      const timeA = a.type === 'message' 
        ? new Date(a.data.createdAt).getTime()
        : new Date(a.data.startTime).getTime();
      const timeB = b.type === 'message'
        ? new Date(b.data.createdAt).getTime()
        : new Date(b.data.startTime).getTime();
      return timeA - timeB; // Ascending order (oldest first, newest last)
    });
    
    return items;
  }, [messages, callHistory]);

  // Track last message ID to detect new messages
  const lastMessageIdRef = useRef<number | null>(null);
  const lastMessageCountRef = useRef(0);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id || null;
    const messageCount = messages.length;

    // Only scroll if we have new messages (count changed or last message ID changed)
    if (messages.length > 0 && flatListRef.current && 
        (messageCount !== lastMessageCountRef.current || lastMessageId !== lastMessageIdRef.current)) {
      lastMessageIdRef.current = lastMessageId;
      lastMessageCountRef.current = messageCount;
      
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    }
  }, [messages.length, messages[messages.length - 1]?.id]);

  // CRITICAL FIX Bug 3: Reset scroll flag immediately when conversation changes
  // This ensures auto-scroll handlers work correctly even when switching conversations during loading
  useEffect(() => {
    hasScrolledRef.current = false; // Reset scroll flag when conversation changes
  }, [conversationId]);

  // Scroll to bottom when component mounts with messages or when messages finish loading
  // CRITICAL FIX Bug 2 & 3: Set hasScrolledRef to true after initial scroll to prevent aggressive auto-scrolling
  // CRITICAL FIX Bug 2: Add cleanup function to cancel timeout when dependencies change
  // CRITICAL FIX Bug 1: Check hasScrolledRef before scrolling to prevent redundant scrolls
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && !isLoading) {
      // Wait for layout to complete before scrolling
      const timeoutId = setTimeout(() => {
        // CRITICAL FIX Bug 1: Check if already scrolled by onLayout/onContentSizeChange handlers
        // This prevents redundant scroll operations if handlers already scrolled
        if (!hasScrolledRef.current && flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: false });
          // CRITICAL FIX: Mark as scrolled after initial scroll completes
          // This prevents onContentSizeChange and onLayout from triggering more scrolls
          hasScrolledRef.current = true;
        }
      }, 500); // Increased timeout to ensure messages are rendered
      
      // CRITICAL FIX Bug 2: Cleanup timeout when conversation changes or component unmounts
      // This prevents pending timeouts from previous conversations from scrolling in new conversation
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [conversationId, isLoading, messages.length]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    handleTyping(text);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    const parentMessageId = replyToMessage?.id;
    setInputText('');
    setReplyToMessage(null);

    // Send message - it will arrive via WebSocket
    await sendMessage(text, parentMessageId);
    
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handleReply = (message: Message) => {
    const senderName = message.senderId === user?.id
      ? 'Вие'
      : participantName || 'Потребител';
    setReplyToMessage({
      id: message.id,
      text: message.text,
      senderName,
    });
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // Search functionality - CRITICAL FIX: Search in chatItems instead of messages
  // use refs to track changes and avoid infinite loops
  const prevSearchQueryRef = useRef<string>('');
  const prevChatItemsCountRef = useRef(0);
  const prevLastMessageIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    const searchQueryTrimmed = searchQuery.trim();
    const chatItemsCount = chatItems.length;
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id || null;
    
    // Only recalculate if search query changed or chatItems actually changed
    const searchChanged = searchQueryTrimmed !== prevSearchQueryRef.current;
    const chatItemsChanged = chatItemsCount !== prevChatItemsCountRef.current || lastMessageId !== prevLastMessageIdRef.current;
    
    if (searchChanged || chatItemsChanged) {
      prevSearchQueryRef.current = searchQueryTrimmed;
      prevChatItemsCountRef.current = chatItemsCount;
      prevLastMessageIdRef.current = lastMessageId;
      
      if (searchQueryTrimmed.length > 0) {
        // CRITICAL FIX: Search in chatItems and find indices in chatItems array
        // Only search in messages (not call history)
        const results = chatItems
          .map((item, index) => {
            // Only search in messages, skip call history items
            if (item.type === 'message' && item.data.text.toLowerCase().includes(searchQueryTrimmed.toLowerCase())) {
              return index;
            }
            return -1;
          })
          .filter((index) => index !== -1);
        setSearchResults(results);
        setCurrentSearchIndex(0);
      } else {
        setSearchResults([]);
        setCurrentSearchIndex(0);
      }
    }
  }, [searchQuery, chatItems, messages.length, messages[messages.length - 1]?.id]);

  const handleSearchNext = () => {
    if (currentSearchIndex < searchResults.length - 1) {
      setCurrentSearchIndex(currentSearchIndex + 1);
      scrollToMessage(searchResults[currentSearchIndex + 1]);
    }
  };

  const handleSearchPrevious = () => {
    if (currentSearchIndex > 0) {
      setCurrentSearchIndex(currentSearchIndex - 1);
      scrollToMessage(searchResults[currentSearchIndex - 1]);
    }
  };

  const scrollToMessage = (index: number) => {
    // CRITICAL FIX: index is now in chatItems array, not messages array
    if (flatListRef.current && chatItems[index] && chatItems[index].type === 'message') {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (error) {
        // Fallback: scroll to offset if scrollToIndex fails (e.g., item not rendered yet)
        logger.error('Error scrolling to search result:', error);
        // Try to estimate scroll position based on item height
        const estimatedOffset = index * 80; // Approximate height per item
        flatListRef.current.scrollToOffset({
          offset: estimatedOffset,
          animated: true,
        });
      }
    }
  };

  if (isLoading && messages.length === 0) {
    return <Loading message="Зареждане на съобщения..." />;
  }

  return (
    <View style={styles.wrapper}>
      {/* Custom Header */}
      <ChatHeader
        participantName={participantName}
        participantImageUrl={participant?.imageUrl}
        participantId={participant?.id || 0}
        conversationId={conversationId}
        isOnline={participant?.isOnline || false}
        onBack={() => navigation.goBack()}
        onSearchPress={() => setShowSearch(!showSearch)}
      />

      {/* Message Search Bar */}
      <MessageSearchBar
        visible={showSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClose={() => {
          setShowSearch(false);
          setSearchQuery('');
        }}
        resultCount={searchResults.length}
        currentIndex={currentSearchIndex}
        onNext={handleSearchNext}
        onPrevious={handleSearchPrevious}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={Platform.OS === 'ios'}
      >
        <FlatList
        ref={flatListRef}
        data={chatItems}
        keyExtractor={(item, index) => {
          if (item.type === 'message') {
            return `message-${item.data.id}`;
          } else {
            return `call-${item.data.id}`;
          }
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
              renderItem={({ item }) => {
                if (item.type === 'message') {
                  return (
                    <MessageBubble
                      message={item.data}
                      participantImageUrl={participant?.imageUrl}
                      participantName={participant?.fullName || participantName}
                      onReply={handleReply}
                    />
                  );
                } else {
                  return <CallHistoryBubble callHistory={item.data} />;
                }
              }}
        contentContainerStyle={[
          styles.messagesContainer,
          chatItems.length === 0 && styles.emptyContainer,
        ]}
        inverted={false}
        ListHeaderComponent={
          missedCalls > 0 ? (
            <View style={styles.missedCallsContainer}>
              <TelephoneIcon size={18} color={Colors.red[500]} />
              <Text style={styles.missedCallsText}>
                {missedCalls === 1 
                  ? 'Пропуснато обаждане' 
                  : `${missedCalls} пропуснати обаждания`}
              </Text>
              <TouchableOpacity
                onPress={() => clearMissedCalls(conversationId)}
                style={styles.clearMissedCallsButton}
              >
                <Text style={styles.clearMissedCallsText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : isLoadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={Colors.green[500]} />
              <Text style={styles.loadingMoreText}>Зареждане на по-стари съобщения...</Text>
            </View>
          ) : null
        }
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          scrollOffsetRef.current = offsetY;
          
          // Mark that user has scrolled
          if (offsetY > 50) {
            hasScrolledRef.current = true;
          }
          
          // Load more messages when scrolling near the top (offsetY < 200)
          // Only load if: user has scrolled, we have more messages, not currently loading, and messages are already loaded
          if (hasScrolledRef.current && offsetY < 200 && hasMore && !isLoadingMore && !isLoading && chatItems.length > 0) {
            loadMoreMessages();
          }
        }}
        scrollEventThrottle={400}
        onContentSizeChange={() => {
          // CRITICAL FIX Bug 2 & 3: Only auto-scroll on initial load, not on every content change
          // hasScrolledRef is set to true after initial scroll, preventing aggressive auto-scrolling
          // This allows users to scroll up and read older messages without being forced back to bottom
          if (chatItems.length > 0 && !isLoadingMore && !isLoading && !hasScrolledRef.current) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
              // Mark as scrolled after initial scroll
              hasScrolledRef.current = true;
            }, 100);
          }
        }}
        onLayout={() => {
          // CRITICAL FIX Bug 2 & 3: Only auto-scroll on initial load, not on every layout change
          // hasScrolledRef is set to true after initial scroll, preventing aggressive auto-scrolling
          if (chatItems.length > 0 && !isLoadingMore && !isLoading && !hasScrolledRef.current) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
              // Mark as scrolled after initial scroll
              hasScrolledRef.current = true;
            }, 150);
          }
        }}
      />
            {isTyping && <TypingIndicator name={participantName} />}
            <MessageInput
              value={inputText}
              onChangeText={handleInputChange}
              onSend={handleSend}
              replyPreview={replyToMessage ? {
                messageId: replyToMessage.id,
                text: replyToMessage.text,
                senderName: replyToMessage.senderName,
              } : null}
              onCancelReply={handleCancelReply}
            />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  messagesContainer: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  loadingMoreText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  missedCallsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.red[50],
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.red[500],
  },
  missedCallsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.red[700],
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  clearMissedCallsButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  clearMissedCallsText: {
    fontSize: 20,
    color: Colors.red[500],
    fontWeight: Typography.fontWeight.bold,
  },
});


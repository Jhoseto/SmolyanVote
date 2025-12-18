/**
 * Chat Screen
 * Екран за чат с конкретен потребител
 */

import React, { useEffect, useState, useRef } from 'react';
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
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageSearchBar } from '../../components/chat/MessageSearchBar';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { Loading } from '../../components/common';
import { Colors, Spacing, Typography } from '../../theme';
import { useConversationsStore } from '../../store/conversationsStore';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../types/message';
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

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<{ id: number; text: string; senderName: string } | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const scrollOffsetRef = useRef(0);
  const hasScrolledRef = useRef(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    }
  }, [messages.length, messages.map(m => m.id).join(',')]); // Track message IDs for better change detection

  // Scroll to bottom when component mounts with messages
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      hasScrolledRef.current = false; // Reset scroll flag when conversation changes
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
    }
  }, [conversationId]);

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

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results = messages
        .map((msg, index) => (msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ? index : -1))
        .filter((index) => index !== -1);
      setSearchResults(results);
      setCurrentSearchIndex(0);
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchQuery, messages]);

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
    if (flatListRef.current && messages[index]) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item?.id?.toString() || `message-${index}`}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  participantImageUrl={participant?.imageUrl}
                  participantName={participant?.fullName || participantName}
                  onReply={handleReply}
                />
              )}
        contentContainerStyle={[
          styles.messagesContainer,
          messages.length === 0 && styles.emptyContainer,
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
          if (hasScrolledRef.current && offsetY < 200 && hasMore && !isLoadingMore && !isLoading && messages.length > 0) {
            loadMoreMessages();
          }
        }}
        scrollEventThrottle={400}
        onContentSizeChange={() => {
          // Auto-scroll to bottom when content size changes (only if not loading more)
          if (messages.length > 0 && !isLoadingMore) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 50);
          }
        }}
        onLayout={() => {
          // Scroll to bottom on layout (only if not loading more)
          if (messages.length > 0 && !isLoadingMore) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
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


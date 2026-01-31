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
  Vibration,
  Animated,
  Modal,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { Swipeable } from 'react-native-gesture-handler';
import { ArrowUturnLeftIcon } from 'react-native-heroicons/solid';
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
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { Colors, Spacing, Typography } from '../../theme';
import { useConversationsStore } from '../../store/conversationsStore';
import { useAuthStore } from '../../store/authStore';
import { useCallsStore } from '../../store/callsStore';
import { Message } from '../../types/message';
import { CallHistory } from '../../types/callHistory';
import { TelephoneIcon } from '../../components/common/Icons';
import { translateText } from '../../services/api/translationService';
import { logger } from '../../utils/logger';


// Swipeable Wrapper Component
const SwipeableMessageWrapper = ({ children, onReply }: { children: React.ReactNode, onReply: () => void }) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderLeftActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [0, 50],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ justifyContent: 'center', paddingLeft: 20, width: 80 }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={{
            backgroundColor: Colors.background.secondary,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5
          }}>
            <ArrowUturnLeftIcon size={20} color={Colors.primary} />
          </View>
        </Animated.View>
      </View>
    );
  };

  const handleSwipeOpen = () => {
    Vibration.vibrate(15);
    onReply();
    swipeableRef.current?.close();
  };

  // Only allow swiping for reply (left to right)
  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={handleSwipeOpen}
      friction={2}
      overshootLeft={false}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
};


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

  // Translation State
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('bg');
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<number, string>>({});

  const LANGUAGES = [
    { code: 'bg', name: 'Български' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'el', name: 'Ελληνικά' },
    { code: 'tr', name: 'Türkçe' },
  ];

  // Load Settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(`translation_settings_${conversationId}`);
        if (savedSettings) {
          const { enabled, language } = JSON.parse(savedSettings);
          setIsTranslationEnabled(enabled);
          if (language) setTargetLanguage(language);
        }
      } catch (error) {
        logger.error('Failed to load translation settings', error);
      }
    };
    loadSettings();
  }, [conversationId]);

  // Save Settings
  const saveSettings = async (enabled: boolean, language: string) => {
    try {
      await AsyncStorage.setItem(`translation_settings_${conversationId}`, JSON.stringify({
        enabled,
        language
      }));
    } catch (error) {
      logger.error('Failed to save translation settings', error);
    }
  };

  const handleToggleTranslation = (value: boolean) => {
    setIsTranslationEnabled(value);
    saveSettings(value, targetLanguage);
  };

  const handleLanguageChange = (lang: string) => {
    setTargetLanguage(lang);
    saveSettings(isTranslationEnabled, lang);
  };

  // Translation Effect
  useEffect(() => {
    const performTranslation = async () => {
      if (!isTranslationEnabled) return;

      const messagesToTranslate = messages.filter(msg =>
        msg.senderId !== user?.id &&
        msg.text &&
        !translatedMessages[`${msg.id}_${targetLanguage}`]
      );

      for (const msg of messagesToTranslate) {
        try {
          const cacheKey = `${msg.id}_${targetLanguage}`;
          // Double check inside loop
          if (translatedMessages[cacheKey]) continue;

          const translated = await translateText(msg.text, targetLanguage);
          if (translated) {
            setTranslatedMessages(prev => ({
              ...prev,
              [cacheKey]: translated,
              [msg.id]: translated // Access by ID for current language
            }));
          }
        } catch (e) {
          logger.error("Translation error", e);
        }
      }
    };

    // Simple debounce
    const timeout = setTimeout(performTranslation, 500);
    return () => clearTimeout(timeout);
  }, [messages, isTranslationEnabled, targetLanguage, user?.id]);

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
  const { currentCall, isRinging, isDialing, isConnected } = useCallsStore();
  const isCallActive = isRinging || isDialing || isConnected;

  // CRITICAL FIX: Store conversationId in ref when call is active
  // This ensures we can check if call was for this conversation even after currentCall is cleared
  const activeCallConversationIdRef = useRef<number | null>(null);

  // Update ref when call becomes active
  useEffect(() => {
    if (currentCall?.conversationId && isCallActive) {
      activeCallConversationIdRef.current = currentCall.conversationId;
    }
  }, [isCallActive, currentCall?.conversationId]);

  // CRITICAL FIX: Refresh call history when call ends to show new call in chat
  // This ensures call history is updated immediately after a call completes
  const prevIsCallActiveRef = useRef(isCallActive);
  useEffect(() => {
    // Refresh call history when call transitions from active to idle
    const wasActive = prevIsCallActiveRef.current;
    const isNowIdle = !isCallActive;

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

    prevIsCallActiveRef.current = isCallActive;
  }, [isCallActive, conversationId, refreshCallHistory]);

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
      callHistory.forEach((call, index) => {
        // CRITICAL FIX: Check if call has required fields - id and startTime are required
        // startTime can be string (ISO format) or Date object
        if (call &&
          typeof call === 'object' &&
          call.id != null &&
          call.startTime != null &&
          typeof call.startTime === 'string') {
          items.push({ type: 'callHistory', data: call });
        }
      });
    }

    // CRITICAL FIX: Safe date parser that handles various formats (ISO, SQL, arrays)
    // Returns timestamp in milliseconds, or 0 if invalid
    const parseSortableTimestamp = (dateInput: string | number | number[] | Date | undefined): number => {
      if (!dateInput) return 0;

      try {
        // If it's already a number (timestamp), return it
        if (typeof dateInput === 'number') {
          return dateInput;
        }

        // If it's a Date object
        if (dateInput instanceof Date) {
          return dateInput.getTime();
        }

        // If it's a string
        if (typeof dateInput === 'string') {
          // Handle SQL-like format (replace space with T)
          const isoString = dateInput.replace(' ', 'T');
          const time = new Date(isoString).getTime();
          return isNaN(time) ? 0 : time;
        }

        // If it's an array (local date time), create date from parts
        if (Array.isArray(dateInput)) {
          // [year, month, day, hour, minute, second, nano]
          // Note: Month in JS Date is 0-indexed, but usually 1-indexed in arrays from backend
          const year = dateInput[0] || 0;
          const month = (dateInput[1] || 1) - 1; // 1-indexed -> 0-indexed
          const day = dateInput[2] || 1;
          const hour = dateInput[3] || 0;
          const minute = dateInput[4] || 0;
          const second = dateInput[5] || 0;
          return new Date(year, month, day, hour, minute, second).getTime();
        }

        return 0;
      } catch (e) {
        logger.error('Error parsing date for sorting:', e);
        return 0;
      }
    };

    // Sort ASCENDING (oldest first, newest last)
    // FlatList will show with newest messages at bottom
    items.sort((a, b) => {
      const timeA = parseSortableTimestamp(
        a.type === 'message' ? a.data.createdAt : a.data.startTime
      );
      const timeB = parseSortableTimestamp(
        b.type === 'message' ? b.data.createdAt : b.data.startTime
      );
      return timeA - timeB; // ASCENDING (oldest first, newest last)
    });

    return items;
  }, [messages, callHistory]);

  // Track last message ID to detect new messages
  const lastMessageIdRef = useRef<number | null>(null);
  const lastMessageCountRef = useRef(0);
  const previousConversationIdRef = useRef<number | null>(null);

  // CRITICAL FIX: Reset all scroll refs when conversation changes
  // This ensures auto-scroll works correctly when opening a new chat
  useEffect(() => {
    if (previousConversationIdRef.current !== conversationId) {
      // Conversation changed - reset all scroll tracking
      hasScrolledRef.current = false;
      lastMessageIdRef.current = null;
      lastMessageCountRef.current = 0;
      previousConversationIdRef.current = conversationId;
    }
  }, [conversationId]);


  // REMOVED: Auto-scroll logic no longer needed with inverted FlatList
  // Inverted list naturally shows newest messages at bottom


  // REMOVED: New message auto-scroll logic no longer needed
  // Inverted FlatList handles new messages automatically

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
    Vibration.vibrate(10);
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
    return (
      <ScreenBackground>
        <Loading message="Зареждане на съобщения..." />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.wrapper}>
        {/* Custom Header */}
        <ChatHeader
          participantName={participantName}
          participantImageUrl={participant?.imageUrl}
          participantId={participant?.id || 0}
          conversationId={conversationId}
          isOnline={participant?.isOnline || false}
          /*  const handleCall = () => {
    if (participant) {
      // CRITICAL FIX: Pass existing conversationId to startCall to bypass backend check
      // This prevents "500 Internal Server Error" if the backend endpoint is unstable
      startCall(
        participant.id,
        participantName || participant.fullName || participant.username,
        participant.imageUrl,
        false, // isVideo
        conversationId // existingConversationId
      );
    }
  };

  const handleVideoCall = () => {
    if (participant) {
      // CRITICAL FIX: Pass existing conversationId for video calls too
      startCall(
        participant.id,
        participantName || participant.fullName || participant.username,
        participant.imageUrl,
        true, // isVideo
        conversationId // existingConversationId
      );
    }
  };  */onBack={() => navigation.goBack()}
          onSearchPress={() => setShowSearch(!showSearch)}
          onTranslatePress={() => setShowTranslationSettings(true)}
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
                const id = item.data?.id != null ? String(item.data.id) : `msg-${index}`;
                return `message-${id}`;
              } else {
                const id = item.data?.id != null ? String(item.data.id) : `call-${index}`;
                return `call-${id}`;
              }
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            renderItem={({ item }) => {
              if (item.type === 'message') {
                return (
                  <SwipeableMessageWrapper onReply={() => handleReply(item.data)}>
                    <MessageBubble
                      message={item.data}
                      participantImageUrl={participant?.imageUrl}
                      participantName={participant?.fullName || participantName}
                      onReply={handleReply}
                      translatedText={isTranslationEnabled ? translatedMessages[item.data.id] : undefined}
                    />
                  </SwipeableMessageWrapper>
                );
              } else if (item.type === 'callHistory') {
                // CRITICAL: Ensure callHistory data is valid before rendering
                if (!item.data || typeof item.data !== 'object') {
                  return null;
                }
                return <CallHistoryBubble callHistory={item.data} />;
              }
              return null;
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
            onContentSizeChange={() => {
              // Auto-scroll to bottom only when content changes and we're near bottom
              // This keeps chat at bottom when sending messages but allows reading history
              if (chatItems.length > 0 && flatListRef.current) {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }
            }}
            onEndReached={() => {
              // Load more messages when scrolling to TOP (older messages)
              if (hasMore && !isLoadingMore && !isLoading && chatItems.length > 0) {
                loadMoreMessages();
              }
            }}
            onEndReachedThreshold={0.1}
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

      {/* Translation Settings Modal */}
      <Modal
        visible={showTranslationSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTranslationSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Настройки за превод</Text>
              <TouchableOpacity
                onPress={() => setShowTranslationSettings(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Автоматичен превод</Text>
              <Switch
                value={isTranslationEnabled}
                onValueChange={handleToggleTranslation}
                trackColor={{ false: '#767577', true: Colors.primary }}
                thumbColor={isTranslationEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            {isTranslationEnabled && (
              <>
                <Text style={styles.sectionTitle}>Език на превода:</Text>
                <View style={styles.languagesList}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        targetLanguage === lang.code && styles.selectedLanguage
                      ]}
                      onPress={() => handleLanguageChange(lang.code)}
                    >
                      <Text style={[
                        styles.languageText,
                        targetLanguage === lang.code && styles.selectedLanguageText
                      ]}>
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl + 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text.secondary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  switchLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  languagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  languageOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  selectedLanguage: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  languageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  selectedLanguageText: {
    color: '#fff',
    fontWeight: Typography.fontWeight.medium,
  },
  wrapper: {
    flex: 1,
    // Background handled by ScreenBackground
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 60, // Space for bottom tab navigation
  },
  messagesContainer: {
    padding: Spacing.md,
    flexGrow: 1,
    paddingBottom: 76, // Extra space for bottom tab navigation (60px tabs + 16px spacing)
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


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
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { ConversationsStackParamList } from '../../types/navigation';
import { useMessages } from '../../hooks/useMessages';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { Loading } from '../../components/common';
import { Colors, Spacing, Typography } from '../../theme';
import { useConversationsStore } from '../../store/conversationsStore';

type ChatScreenRouteProp = RouteProp<ConversationsStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { conversationId, participantName } = route.params;
  const { conversations } = useConversationsStore();
  
  const conversation = conversations.find((c) => c.id === conversationId);
  const participant = conversation?.participant;

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    handleTyping,
  } = useMessages(conversationId);

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

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
    setInputText('');

    // Send message - it will arrive via WebSocket
    await sendMessage(text);
    
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
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
          />
        )}
        contentContainerStyle={[
          styles.messagesContainer,
          messages.length === 0 && styles.emptyContainer,
        ]}
        inverted={false}
        onContentSizeChange={() => {
          // Auto-scroll to bottom when content size changes
          if (messages.length > 0) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 50);
          }
        }}
        onLayout={() => {
          // Scroll to bottom on layout
          if (messages.length > 0) {
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
});


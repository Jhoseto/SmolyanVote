/**
 * Conversations List Screen
 * Показва списък с всички разговори
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useConversations } from '../../hooks/useConversations';
import { ConversationItem } from '../../components/conversations/ConversationItem';
import { ConversationSearchBar } from '../../components/conversations/ConversationSearchBar';
import { Loading } from '../../components/common';
import { Colors, Spacing } from '../../theme';
import { Conversation } from '../../types/conversation';
import { ConversationsStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<ConversationsStackParamList>;

export const ConversationsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    conversations,
    isLoading,
    error,
    fetchConversations,
    selectConversation,
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState('');

  // Защита срещу undefined conversations
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return safeConversations;
    }

    const query = searchQuery.toLowerCase().trim();
    return safeConversations.filter((conv) => {
      if (!conv || !conv.participant) return false;
      
      const participantName = (conv.participant.fullName || '').toLowerCase();
      const participantUsername = (conv.participant.username || '').toLowerCase();
      const lastMessageText = (conv.lastMessage?.text || '').toLowerCase();
      
      return (
        participantName.includes(query) ||
        participantUsername.includes(query) ||
        lastMessageText.includes(query)
      );
    });
  }, [safeConversations, searchQuery]);

  const handleRefresh = () => {
    fetchConversations();
  };

  const handleConversationPress = (conversation: Conversation) => {
    selectConversation(conversation.id);
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      participantName: conversation.participant.fullName,
    });
  };

  if (isLoading && safeConversations.length === 0) {
    return <Loading message="Зареждане на разговори..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConversationSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
      />
      <FlatList
        data={filteredConversations.filter((item) => item != null && item.id != null)}
        keyExtractor={(item) => item?.id?.toString() || `temp-${Math.random()}`}
        renderItem={({ item }) => (
          item ? (
            <ConversationItem
              conversation={item}
              onPress={() => handleConversationPress(item)}
            />
          ) : null
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.green[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? 'Няма резултати' : 'Няма разговори'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
});


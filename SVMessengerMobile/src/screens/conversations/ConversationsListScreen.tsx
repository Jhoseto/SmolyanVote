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
import { GlassHeader } from '../../components/common/GlassHeader';
import { SearchIcon } from '../../components/common/Icons';

import { Colors, Spacing } from '../../theme';
import { Conversation } from '../../types/conversation';
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { useTranslation } from '../../hooks/useTranslation';

export const ConversationsListScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { conversations, isLoading, fetchConversations, selectConversation } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return conversations.filter((c: Conversation) => {
      const name = c.participant?.fullName || c.participant?.username || '';
      return name.toLowerCase().includes(lowerQuery);
    });
  }, [conversations, searchQuery]);

  const handleConversationPress = (conversation: Conversation) => {
    selectConversation(conversation.id);
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      participantId: conversation.participant.id,
      participantName: conversation.participant.fullName || conversation.participant.username,
      participantImageUrl: conversation.participant.imageUrl,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <GlassHeader
          title={t('conversations.title')}
          rightIcon={<SearchIcon size={24} color={Colors.text.inverse} />}
          onRightPress={toggleSearch}
        />

        {isSearchVisible && (
          <ConversationSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        )}
        <FlatList
          data={filteredConversations.filter((item) => item != null && item.id != null)}
          keyExtractor={(item) => item?.id?.toString() || `temp-${Math.random()}`}
          renderItem={({ item, index }) => (
            item ? (
              <ConversationItem
                conversation={item}
                onPress={() => handleConversationPress(item)}
                index={index}
              />
            ) : null
          )}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={Colors.gold[400]} // Gold spinner
              colors={[Colors.gold[400]]} // Android
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? t('conversations.noResults') : t('conversations.noConversations')}
              </Text>
            </View>
          }
        />
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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


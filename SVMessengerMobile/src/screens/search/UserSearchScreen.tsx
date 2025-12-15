/**
 * User Search Screen
 * Търсене на потребители и започване на нови разговори
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, Loading } from '../../components/common';
import { Colors, Typography, Spacing } from '../../theme';
import apiClient from '../../services/api/client';
import { API_CONFIG } from '../../config/api';
import { UserSearchResult } from '../../types/user';
import { useConversationsStore } from '../../store/conversationsStore';
import { debounce } from '../../utils/constants';

export const UserSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchConversations } = useConversationsStore();

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.MESSENGER.SEARCH_USERS, {
          params: { query: query.trim(), page: 0, size: 20 },
        });

        setSearchResults(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Грешка при търсене');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, APP_CONSTANTS.SEARCH_DEBOUNCE),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    performSearch(text);
  };

  const handleUserSelect = async (user: UserSearchResult) => {
    try {
      // Start conversation (backend ще създаде или върне съществуващ)
      const response = await apiClient.post('/api/svmessenger/conversations/start', {
        otherUserId: user.id,
      });

      const conversation = response.data;

      // Refresh conversations list
      await fetchConversations();

      // Navigate to chat
      navigation.navigate('Chat' as any, {
        conversationId: conversation.id,
        participantName: user.fullName,
      });
    } catch (error: any) {
      console.error('Error starting conversation:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Търси потребители..."
          placeholderTextColor={Colors.text.tertiary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isSearching && (
        <View style={styles.loadingContainer}>
          <Loading size="small" />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleUserSelect(item)}
            activeOpacity={0.7}
          >
            <Avatar
              imageUrl={item.imageUrl}
              name={item.fullName}
              size={50}
              isOnline={item.isOnline}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.fullName}</Text>
              <Text style={styles.userUsername}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          searchQuery.length >= 2 && !isSearching ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Няма резултати</Text>
            </View>
          ) : null
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
  searchContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  errorContainer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: Typography.fontSize.sm,
  },
  userItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  userUsername: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.base,
  },
});


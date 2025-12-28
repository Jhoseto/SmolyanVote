/**
 * User Search Screen
 * Търсене на потребители и започване на нови разговори
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, ConversationsStackParamList } from '../../types/navigation';
import { Avatar, Loading } from '../../components/common';
import { Colors, Typography, Spacing, Shadows } from '../../theme';
import apiClient from '../../services/api/client';
import { API_CONFIG } from '../../config/api';
import { UserSearchResult } from '../../types/user';
import { useConversationsStore } from '../../store/conversationsStore';
import { useAuthStore } from '../../store/authStore';
import { debounce, APP_CONSTANTS } from '../../utils/constants';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Search'>,
  NativeStackNavigationProp<ConversationsStackParamList>
>;

export const UserSearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [followingUsers, setFollowingUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchConversations } = useConversationsStore();
  const { user } = useAuthStore();

  // Load following users on mount
  useEffect(() => {
    if (user) {
      loadFollowingUsers();
    }
  }, [user]);

  // Load following users
  const loadFollowingUsers = async () => {
    setIsLoadingFollowing(true);
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.MESSENGER.SEARCH_FOLLOWING, {
        params: { query: '' }, // Empty query to get all following users
      });
      setFollowingUsers(response.data || []);
    } catch (err: any) {
      console.error('Error loading following users:', err);
      setFollowingUsers([]);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

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
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.MESSENGER.START_CONVERSATION, {
        otherUserId: user.id,
      });

      const conversation = response.data;

      // Refresh conversations list
      await fetchConversations();

      // Navigate to chat - navigate to Conversations tab first, then to Chat screen
      navigation.navigate('Conversations', {
        screen: 'Chat',
        params: {
          conversationId: conversation.id,
          participantName: user.fullName,
        },
      });
    } catch (error: any) {
      console.error('Error starting conversation:', error);
    }
  };

  const hasSearchQuery = searchQuery.trim().length >= 2;
  const showFollowingUsers = !hasSearchQuery && !isSearching;

  return (
    <SafeAreaView style={styles.container}>
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

      {showFollowingUsers ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent}>
          {isLoadingFollowing ? (
            <View style={styles.loadingContainer}>
              <Loading size="small" />
            </View>
          ) : followingUsers.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Следвани потребители</Text>
              </View>
              {followingUsers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.userItem}
                  onPress={() => handleUserSelect(item)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    imageUrl={item.imageUrl}
                    name={item.fullName}
                    size={56}
                    isOnline={item.isOnline}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.fullName}</Text>
                    <Text style={styles.userUsername}>@{item.username}</Text>
                  </View>
                  {item.isOnline && (
                    <View style={styles.onlineIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Няма следвани потребители</Text>
              <Text style={styles.emptySubtext}>Започни да следваш потребители за да ги видиш тук</Text>
            </View>
          )}
        </ScrollView>
      ) : (
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
                size={56}
                isOnline={item.isOnline}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName}</Text>
                <Text style={styles.userUsername}>@{item.username}</Text>
              </View>
              {item.isOnline && (
                <View style={styles.onlineIndicator} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            hasSearchQuery && !isSearching ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Няма резултати</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary, // SmolyanVote style - light gray background
  },
  searchContainer: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background.primary,
    ...Shadows.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 24, // More rounded like web version
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    ...Shadows.sm,
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.semantic.error + '15', // Light red background
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    borderBottomWidth: 0,
    alignItems: 'center',
    ...Shadows.sm,
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2,
  },
  userUsername: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.green[500],
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  emptyContainer: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.base,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});


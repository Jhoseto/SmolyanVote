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
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { GlassHeader } from '../../components/common/GlassHeader';
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

  const handleUserSelect = async (selectedUser: UserSearchResult) => {
    try {
      // Start conversation (backend ще създаде или върне съществуващ)
      let conversationId: number | null = null;
      let usedFallback = false;

      try {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.MESSENGER.START_CONVERSATION, {
          otherUserId: selectedUser.id,
        });
        conversationId = response.data.id;
      } catch (error: any) {
        // Fallback strategy for 500 errors
        if (error.response?.status === 500 || error.message.includes('500')) {
          console.warn('⚠️ Backend 500 error on start. Trying fallback via conversation list.');
          try {
            // Fetch all conversations
            const listResponse = await apiClient.get(API_CONFIG.ENDPOINTS.MESSENGER.CONVERSATIONS);
            const conversations = listResponse.data || [];

            const found = conversations.find((c: any) =>
              (c.participantId === selectedUser.id) ||
              (c.participant && c.participant.id === selectedUser.id) ||
              (c.user1Id === selectedUser.id) ||
              (c.user2Id === selectedUser.id && c.user1Id === user?.id) ||
              (c.user1Id === user?.id && c.user2Id === selectedUser.id)
            );

            if (found && found.id) {
              conversationId = found.id;
              usedFallback = true;
              console.log('✅ Fallback successful in UserSearch!');
            }
          } catch (fbError) {
            console.error('Fallback failed:', fbError);
          }
        }

        if (!conversationId && !usedFallback) {
          throw error; // Re-throw if fallback didn't work
        }
      }

      if (conversationId) {
        // Refresh conversations list
        // Don't await if fallback was used (list already fetched)
        if (!usedFallback) {
          await fetchConversations();
        } else {
          fetchConversations(); // background refresh
        }

        // Navigate to chat
        navigation.navigate('Conversations', {
          screen: 'Chat',
          params: {
            conversationId: conversationId,
            participantName: selectedUser.fullName,
          },
        });
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      setError('Неуспешна връзка с този потребител');
    }
  };

  const hasSearchQuery = searchQuery.trim().length >= 2;
  const showFollowingUsers = !hasSearchQuery && !isSearching;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <GlassHeader title="Търсене" />

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Търси потребители..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
                      size={50}
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
                  size={50}
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
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: 'transparent',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#fca5a5',
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
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gold[400], // Gold title
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Glassy list item
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#ffffff', // White name
    marginBottom: 2,
  },
  userUsername: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)', // Muted white
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.green[500],
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    shadowColor: Colors.green[500],
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  emptyContainer: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: Typography.fontSize.base,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});


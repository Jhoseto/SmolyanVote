/**
 * Main Navigator
 * Navigation за основното приложение (след login)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, ConversationsStackParamList, ProfileStackParamList } from '../types/navigation';
import { ConversationsListScreen } from '../screens/conversations/ConversationsListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { UserSearchScreen } from '../screens/search/UserSearchScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { Colors } from '../theme';
import { ChatIcon, SearchIcon, PersonIcon, ChatIconSolid, SearchIconSolid, PersonIconSolid } from '../components/common/Icons';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ConversationsStack = createNativeStackNavigator<ConversationsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Conversations Stack Navigator
const ConversationsNavigator: React.FC = () => {
  return (
    <ConversationsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.green[500],
        },
        headerTintColor: Colors.text.inverse,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <ConversationsStack.Screen
        name="ConversationsList"
        component={ConversationsListScreen}
        options={{ title: 'Разговори' }}
      />
      <ConversationsStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false, // Use custom header instead
        }}
      />
    </ConversationsStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.green[500],
        },
        headerTintColor: Colors.text.inverse,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Профил' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Настройки' }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Редактирай профил' }}
      />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator
export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.green[500],
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: {
          backgroundColor: Colors.background.primary,
          borderTopColor: Colors.border.light,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Conversations"
        component={ConversationsNavigator}
        options={{
          tabBarLabel: 'Разговори',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <ChatIconSolid size={24} color={color} />
            ) : (
              <ChatIcon size={24} color={Colors.text.secondary} />
            ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={UserSearchScreen}
        options={{
          tabBarLabel: 'Търсене',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <SearchIconSolid size={24} color={color} />
            ) : (
              <SearchIcon size={24} color={Colors.text.secondary} />
            ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Профил',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <PersonIconSolid size={24} color={color} />
            ) : (
              <PersonIcon size={24} color={Colors.text.secondary} />
            ),
        }}
      />
    </Tab.Navigator>
  );
};


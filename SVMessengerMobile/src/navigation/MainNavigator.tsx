/**
 * Main Navigator
 * Navigation за основното приложение (след login)
 */

import React, { useState, useEffect } from 'react';
import { Keyboard } from 'react-native';
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
import { ErrorBoundary } from '../components/common/ErrorBoundary';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ConversationsStack = createNativeStackNavigator<ConversationsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Conversations Stack Navigator
const ConversationsNavigator: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConversationsStack.Navigator
        screenOptions={{
          headerShown: false,
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
    </ErrorBoundary>
  );
};

// Profile Stack Navigator
const ProfileNavigator: React.FC = () => {
  return (
    <ErrorBoundary>
      <ProfileStack.Navigator
        screenOptions={{
          headerShown: false,
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
    </ErrorBoundary>
  );
};

// Main Tab Navigator
export const MainNavigator: React.FC = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardWillHide = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.gold[400], // Gold active
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white inactive
        tabBarStyle: {
          backgroundColor: 'rgba(2, 44, 34, 0.95)', // Deep Emerald Glass
          borderTopColor: Colors.gold[400], // Gold Border
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0, // Remove shadow to let glass effect shine
          position: 'absolute', // Optional: for true glass over content
          bottom: 0,
          left: 0,
          right: 0,
          display: isKeyboardVisible ? 'none' : 'flex',
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


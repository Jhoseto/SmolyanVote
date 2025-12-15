/**
 * Main Navigator
 * Navigation за основното приложение (след login)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, ConversationsStackParamList } from '../types/navigation';
import { ConversationsListScreen } from '../screens/conversations/ConversationsListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { UserSearchScreen } from '../screens/search/UserSearchScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ConversationsStack = createNativeStackNavigator<ConversationsStackParamList>();

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
        options={({ route }) => ({
          title: route.params.participantName,
          headerBackTitle: 'Назад',
        })}
      />
    </ConversationsStack.Navigator>
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
        },
      }}
    >
      <Tab.Screen
        name="Conversations"
        component={ConversationsNavigator}
        options={{
          tabBarLabel: 'Разговори',
          // TODO: Add tabBarIcon
        }}
      />
      <Tab.Screen
        name="Search"
        component={UserSearchScreen}
        options={{
          tabBarLabel: 'Търсене',
          // TODO: Add tabBarIcon
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профил',
          // TODO: Add tabBarIcon
        }}
      />
    </Tab.Navigator>
  );
};


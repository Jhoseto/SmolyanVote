/**
 * Navigation Types
 */

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Conversations: undefined;
  Chat: { conversationId: number; participantName: string };
  Search: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  EditProfile: undefined;
};

export type ConversationsStackParamList = {
  ConversationsList: undefined;
  Chat: { conversationId: number; participantName: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}


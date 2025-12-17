/**
 * Heroicons Component
 * Модерни икони от Heroicons за мобилното приложение
 */

import React from 'react';
import {
  ChatBubbleLeftRightIcon as HeroChatBubbleLeftRightIcon,
  MagnifyingGlassIcon as HeroMagnifyingGlassIcon,
  UserIcon as HeroUserIcon,
  ArrowLeftIcon as HeroArrowLeftIcon,
  PhoneIcon as HeroPhoneIcon,
  VideoCameraIcon as HeroVideoCameraIcon,
  PaperAirplaneIcon as HeroPaperAirplaneIcon,
} from 'react-native-heroicons/outline';
import {
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  UserIcon as UserIconSolid,
} from 'react-native-heroicons/solid';

interface IconProps {
  size?: number;
  color?: string;
}

// Outline икони (по подразбиране)
export const ChatIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroChatBubbleLeftRightIcon size={size} color={color} />
);

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroMagnifyingGlassIcon size={size} color={color} />
);

export const PersonIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroUserIcon size={size} color={color} />
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <HeroArrowLeftIcon size={size} color={color} />
);

export const TelephoneIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <HeroPhoneIcon size={size} color={color} />
);

export const CameraVideoIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <HeroVideoCameraIcon size={size} color={color} />
);

export const SendIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <HeroPaperAirplaneIcon size={size} color={color} />
);

// Solid версии за активни табове
export const ChatIconSolid: React.FC<IconProps> = ({ size = 24, color = '#22c55e' }) => (
  <ChatBubbleLeftRightIconSolid size={size} color={color} />
);

export const SearchIconSolid: React.FC<IconProps> = ({ size = 24, color = '#22c55e' }) => (
  <MagnifyingGlassIconSolid size={size} color={color} />
);

export const PersonIconSolid: React.FC<IconProps> = ({ size = 24, color = '#22c55e' }) => (
  <UserIconSolid size={size} color={color} />
);

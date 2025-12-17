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
  XMarkIcon as HeroXMarkIcon,
  FaceSmileIcon as HeroFaceSmileIcon,
  PaperClipIcon as HeroPaperClipIcon,
  TrashIcon as HeroTrashIcon,
  EyeSlashIcon as HeroEyeSlashIcon,
  ChevronRightIcon as HeroChevronRightIcon,
  BellIcon as HeroBellIcon,
  ShieldCheckIcon as HeroShieldCheckIcon,
  SpeakerWaveIcon as HeroSpeakerWaveIcon,
  InformationCircleIcon as HeroInformationCircleIcon,
  CameraIcon as HeroCameraIcon,
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

export const XMarkIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroXMarkIcon size={size} color={color} />
);

export const FaceSmileIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroFaceSmileIcon size={size} color={color} />
);

export const PaperClipIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroPaperClipIcon size={size} color={color} />
);

export const TrashIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroTrashIcon size={size} color={color} />
);

export const EyeSlashIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroEyeSlashIcon size={size} color={color} />
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroChevronRightIcon size={size} color={color} />
);

export const BellIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroBellIcon size={size} color={color} />
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroShieldCheckIcon size={size} color={color} />
);

export const SpeakerWaveIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroSpeakerWaveIcon size={size} color={color} />
);

export const InformationCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroInformationCircleIcon size={size} color={color} />
);

export const ChatBubbleLeftRightIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroChatBubbleLeftRightIcon size={size} color={color} />
);

export const CameraIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280' }) => (
  <HeroCameraIcon size={size} color={color} />
);

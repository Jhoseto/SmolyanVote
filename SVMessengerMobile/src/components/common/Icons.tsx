/**
 * Heroicons Component
 * Модерни икони от Heroicons за мобилното приложение
 * Подобрена версия с правилно рендиране и стилизиране
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
  MicrophoneIcon as HeroMicrophoneIcon,
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
  style?: any;
}

// Outline икони (по подразбиране) - подобрени с strokeWidth за по-добра видимост
export const ChatIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroChatBubbleLeftRightIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroMagnifyingGlassIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const PersonIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroUserIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <HeroArrowLeftIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const TelephoneIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <HeroPhoneIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const CameraVideoIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <HeroVideoCameraIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const SendIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style }) => (
  <HeroPaperAirplaneIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

// Solid версии за активни табове
export const ChatIconSolid: React.FC<IconProps> = ({ size = 24, color = '#22c55e', style }) => (
  <ChatBubbleLeftRightIconSolid size={size} color={color} style={style} />
);

export const SearchIconSolid: React.FC<IconProps> = ({ size = 24, color = '#22c55e', style }) => (
  <MagnifyingGlassIconSolid size={size} color={color} style={style} />
);

export const PersonIconSolid: React.FC<IconProps> = ({ size = 24, color = '#22c55e', style }) => (
  <UserIconSolid size={size} color={color} style={style} />
);

export const XMarkIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroXMarkIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const FaceSmileIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroFaceSmileIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const PaperClipIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroPaperClipIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const TrashIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroTrashIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const EyeSlashIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroEyeSlashIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroChevronRightIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const BellIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroBellIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroShieldCheckIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const SpeakerWaveIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroSpeakerWaveIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const MicrophoneIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroMicrophoneIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const InformationCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroInformationCircleIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const ChatBubbleLeftRightIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroChatBubbleLeftRightIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

export const CameraIcon: React.FC<IconProps> = ({ size = 24, color = '#6b7280', style }) => (
  <HeroCameraIcon size={size} color={color} strokeWidth={2.5} style={style} />
);

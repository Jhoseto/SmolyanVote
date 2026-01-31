/**
 * Settings Screen
 * Пълен Settings screen с всички настройки
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useConversationsStore } from '../../store/conversationsStore';
import { useMessagesStore } from '../../store/messagesStore';
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { GlassHeader } from '../../components/common/GlassHeader';
import {
  ChevronRightIcon,
  BellIcon,
  ShieldCheckIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  InformationCircleIcon,
} from '../../components/common/Icons';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

interface SettingsItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  showArrow = true,
}) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
  >
    {icon && <View style={styles.iconContainer}>{icon}</View>}
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent && <View style={styles.rightComponent}>{rightComponent}</View>}
    {showArrow && onPress && (
      <ChevronRightIcon size={20} color={Colors.gold[400]} />
    )}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { language, setLanguage } = useUIStore();
  const { t } = useTranslation();

  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageSounds, setMessageSounds] = useState(true);
  const [callSounds, setCallSounds] = useState(true);
  const [notificationPreview, setNotificationPreview] = useState(true);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  // Privacy settings
  const [onlineStatusVisible, setOnlineStatusVisible] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeenVisible, setLastSeenVisible] = useState(true);

  // Chat settings
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const languages = [
    { code: 'bg', flag: '🇧🇬' },
    { code: 'en', flag: '🇬🇧' },
    { code: 'el', flag: '🇬🇷' },
    { code: 'tr', flag: '🇹🇷' },
    { code: 'ru', flag: '🇷🇺' },
    { code: 'de', flag: '🇩🇪' },
    { code: 'fr', flag: '🇫🇷' },
    { code: 'es', flag: '🇪🇸' },
    { code: 'iw', flag: '🇮🇱' },
    { code: 'zh-CN', flag: '🇨🇳' },
  ];

  const handleClearCache = async () => {
    Alert.alert(
      t('settings.items.clearCache'),
      t('settings.items.clearCacheSubtitle') + '?',
      [
        { text: t('settings.actions.cancel'), style: 'cancel' },
        {
          text: t('settings.actions.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage cache (excluding auth tokens)
              const keys = await AsyncStorage.getAllKeys();
              const keysToRemove = keys.filter(key =>
                !key.includes('token') &&
                !key.includes('auth') &&
                !key.includes('fcm')
              );
              await AsyncStorage.multiRemove(keysToRemove);
              Alert.alert(t('settings.actions.success'), t('settings.items.clearCache'));
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert(t('settings.actions.error'), t('settings.actions.error'));
            }
          },
        },
      ]
    );
  };

  const handleClearConversations = () => {
    Alert.alert(
      t('settings.items.clearConversations'),
      t('settings.items.clearConversationsSubtitle') + '? ' + t('common.info'),
      [
        { text: t('settings.actions.cancel'), style: 'cancel' },
        {
          text: t('settings.actions.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear conversations and messages from stores
              const { clearConversations } = useConversationsStore.getState();
              const { clearAllMessages } = useMessagesStore.getState();

              clearConversations();
              clearAllMessages();

              Alert.alert(t('settings.actions.success'), t('settings.items.clearConversations'));
            } catch (error) {
              console.error('Error clearing conversations:', error);
              Alert.alert(t('settings.actions.error'), t('settings.actions.error'));
            }
          },
        },
      ]
    );
  };

  const handleFontSizePress = () => {
    Alert.alert(
      t('settings.items.fontSize'),
      t('settings.items.fontSize'),
      [
        { text: t('settings.values.small'), onPress: () => setFontSize('small') },
        { text: t('settings.values.medium'), onPress: () => setFontSize('medium') },
        { text: t('settings.values.large'), onPress: () => setFontSize('large') },
        { text: t('settings.actions.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleThemePress = () => {
    Alert.alert(
      t('settings.items.theme'),
      t('settings.items.theme'),
      [
        { text: t('settings.values.light'), onPress: () => setTheme('light') },
        { text: t('settings.values.dark'), onPress: () => setTheme('dark') },
        { text: t('settings.values.system'), onPress: () => setTheme('system') },
        { text: t('settings.actions.cancel'), style: 'cancel' },
      ]
    );
  };

  return (
    <ScreenBackground>
      <GlassHeader title={t('settings.title')} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Language Selection Section */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>{t('settings.sections.language')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageList}
          >
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageButton,
                  language === lang.code && styles.languageButtonActive
                ]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flagEmoji}>{lang.flag}</Text>
                {language === lang.code && <View style={styles.activeDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notifications Section */}
        <SettingsSection title={t('settings.sections.notifications')}>
          <SettingsItem
            icon={<BellIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.pushNotifications')}
            rightComponent={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(250, 204, 21, 0.4)' }}
                thumbColor={pushNotifications ? Colors.gold[400] : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon={<SpeakerWaveIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.messageSounds')}
            rightComponent={
              <Switch
                value={messageSounds}
                onValueChange={setMessageSounds}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(250, 204, 21, 0.4)' }}
                thumbColor={messageSounds ? Colors.gold[400] : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon={<SpeakerWaveIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.callSounds')}
            rightComponent={
              <Switch
                value={callSounds}
                onValueChange={setCallSounds}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(250, 204, 21, 0.4)' }}
                thumbColor={callSounds ? Colors.gold[400] : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon={<BellIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.notificationPreview')}
            subtitle={t('settings.items.notificationPreviewSubtitle')}
            rightComponent={
              <Switch
                value={notificationPreview}
                onValueChange={setNotificationPreview}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(250, 204, 21, 0.4)' }}
                thumbColor={notificationPreview ? Colors.gold[400] : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon={<BellIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.doNotDisturb')}
            subtitle={t('settings.items.doNotDisturbSubtitle')}
            rightComponent={
              <Switch
                value={doNotDisturb}
                onValueChange={setDoNotDisturb}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(250, 204, 21, 0.4)' }}
                thumbColor={doNotDisturb ? Colors.gold[400] : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection title={t('settings.sections.privacy')}>
          <SettingsItem
            icon={<ShieldCheckIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.onlineStatus')}
            rightComponent={
              <Switch
                value={onlineStatusVisible}
                onValueChange={setOnlineStatusVisible}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(250, 204, 21, 0.4)' }}
                thumbColor={onlineStatusVisible ? Colors.gold[400] : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon={<ShieldCheckIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.readReceipts')}
            rightComponent={
              <Switch
                value={readReceipts}
                onValueChange={setReadReceipts}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(250, 204, 21, 0.4)' }}
                thumbColor={readReceipts ? Colors.gold[400] : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon={<ShieldCheckIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.lastSeen')}
            rightComponent={
              <Switch
                value={lastSeenVisible}
                onValueChange={setLastSeenVisible}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(250, 204, 21, 0.4)' }}
                thumbColor={lastSeenVisible ? Colors.gold[400] : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon={<ShieldCheckIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.blockedUsers')}
            onPress={() => {
              Alert.alert(t('common.info'), t('common.soon'));
            }}
          />
        </SettingsSection>

        {/* Chat Section */}
        <SettingsSection title={t('settings.sections.chat')}>
          <SettingsItem
            icon={<ChatBubbleLeftRightIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.fontSize')}
            subtitle={t(`settings.values.${fontSize}`)}
            onPress={handleFontSizePress}
          />
          <SettingsItem
            icon={<ChatBubbleLeftRightIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.theme')}
            subtitle={t(`settings.values.${theme}`)}
            onPress={handleThemePress}
          />
        </SettingsSection>

        {/* Accessibility Section */}
        <SettingsSection title={t('settings.sections.accessibility')}>
          <SettingsItem
            icon={<ShieldCheckIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.permissions')}
            subtitle={t('settings.items.permissionsSubtitle')}
            onPress={() => navigation.navigate('PermissionsSettings' as any)}
          />
        </SettingsSection>

        {/* Storage Section */}
        <SettingsSection title={t('settings.sections.storage')}>
          <SettingsItem
            icon={<TrashIcon size={22} color={Colors.semantic.error} />}
            title={t('settings.items.clearCache')}
            subtitle={t('settings.items.clearCacheSubtitle')}
            onPress={handleClearCache}
          />
          <SettingsItem
            icon={<TrashIcon size={22} color={Colors.semantic.error} />}
            title={t('settings.items.clearConversations')}
            subtitle={t('settings.items.clearConversationsSubtitle')}
            onPress={handleClearConversations}
          />
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title={t('settings.sections.about')}>
          <SettingsItem
            icon={<InformationCircleIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.version')}
            subtitle="1.0.0"
            showArrow={false}
          />
          <SettingsItem
            icon={<InformationCircleIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.terms')}
            onPress={() => {
              Alert.alert(t('common.info'), t('common.soon'));
            }}
          />
          <SettingsItem
            icon={<InformationCircleIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.privacyPolicy')}
            onPress={() => {
              Alert.alert(t('common.info'), t('common.soon'));
            }}
          />
          <SettingsItem
            icon={<InformationCircleIcon size={22} color={Colors.gold[400]} />}
            title={t('settings.items.support')}
            onPress={() => {
              Alert.alert(t('common.info'), t('common.soon'));
            }}
          />
        </SettingsSection>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gold[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sectionContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: '#ffffff',
  },
  itemSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  rightComponent: {
    marginRight: Spacing.sm,
  },
  languageSection: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  languageList: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  languageButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageButtonActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: Colors.gold[400],
  },
  flagEmoji: {
    fontSize: 28,
  },
  activeDot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold[400],
  },
});


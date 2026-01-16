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
  const [language, setLanguage] = useState('bg');

  const handleClearCache = async () => {
    Alert.alert(
      'Изчистване на кеша',
      'Сигурен ли си, че искаш да изчистиш кеша?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изчисти',
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
              Alert.alert('Успех', 'Кешът е изчистен');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Грешка', 'Неуспешно изчистване на кеша');
            }
          },
        },
      ]
    );
  };

  const handleClearConversations = () => {
    Alert.alert(
      'Изчистване на разговорите',
      'Сигурен ли си, че искаш да изчистиш всички разговори? Това действие не може да бъде отменено.',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изчисти',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear conversations and messages from stores
              const { clearConversations } = useConversationsStore.getState();
              const { clearAllMessages } = useMessagesStore.getState();

              clearConversations();
              clearAllMessages();

              Alert.alert('Успех', 'Разговорите са изчистени');
            } catch (error) {
              console.error('Error clearing conversations:', error);
              Alert.alert('Грешка', 'Неуспешно изчистване на разговорите');
            }
          },
        },
      ]
    );
  };

  const handleFontSizePress = () => {
    Alert.alert(
      'Размер на шрифта',
      'Избери размер на шрифта',
      [
        { text: 'Малък', onPress: () => setFontSize('small') },
        { text: 'Среден', onPress: () => setFontSize('medium') },
        { text: 'Голям', onPress: () => setFontSize('large') },
        { text: 'Отказ', style: 'cancel' },
      ]
    );
  };

  const handleThemePress = () => {
    Alert.alert(
      'Тема',
      'Избери тема',
      [
        { text: 'Светла', onPress: () => setTheme('light') },
        { text: 'Тъмна', onPress: () => setTheme('dark') },
        { text: 'Системна', onPress: () => setTheme('system') },
        { text: 'Отказ', style: 'cancel' },
      ]
    );
  };

  return (
    <ScreenBackground>
      <GlassHeader title="Настройки" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Notifications Section */}
        <SettingsSection title="Известия">
          <SettingsItem
            icon={<BellIcon size={22} color={Colors.gold[400]} />}
            title="Push известия"
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
            title="Звуци за съобщения"
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
            title="Звуци за обаждания"
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
            title="Преглед на известия"
            subtitle="Показвай съдържанието на съобщенията в известията"
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
            title="Не безпокой"
            subtitle="Спиране на всички известия"
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
        <SettingsSection title="Поверителност">
          <SettingsItem
            icon={<ShieldCheckIcon size={22} color={Colors.gold[400]} />}
            title="Видимост на онлайн статус"
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
            title="Потвърждения за прочитане"
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
            title="Видимост на последно активен"
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
            title="Блокирани потребители"
            onPress={() => {
              Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
            }}
          />
        </SettingsSection>

        {/* Chat Section */}
        <SettingsSection title="Чат">
          <SettingsItem
            icon={<ChatBubbleLeftRightIcon size={22} color={Colors.gold[400]} />}
            title="Размер на шрифта"
            subtitle={fontSize === 'small' ? 'Малък' : fontSize === 'medium' ? 'Среден' : 'Голям'}
            onPress={handleFontSizePress}
          />
          <SettingsItem
            icon={<ChatBubbleLeftRightIcon size={22} color={Colors.gold[400]} />}
            title="Тема"
            subtitle={theme === 'light' ? 'Светла' : theme === 'dark' ? 'Тъмна' : 'Системна'}
            onPress={handleThemePress}
          />
          <SettingsItem
            icon={<ChatBubbleLeftRightIcon size={22} color={Colors.gold[400]} />}
            title="Език"
            subtitle="Български"
            onPress={() => {
              Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
            }}
          />
        </SettingsSection>

        {/* Accessibility Section */}
        <SettingsSection title="Достъпност">
          <SettingsItem
            icon={<ShieldCheckIcon size={22} color={Colors.gold[400]} />}
            title="Настройки на разрешенията"
            subtitle="Управление на системни разрешения за обаждания"
            onPress={() => navigation.navigate('PermissionsSettings' as any)}
          />
        </SettingsSection>

        {/* Storage Section */}
        <SettingsSection title="Хранилище">
          <SettingsItem
            icon={<TrashIcon size={22} color={Colors.semantic.error} />}
            title="Изчисти кеша"
            subtitle="Освободи място на устройството"
            onPress={handleClearCache}
          />
          <SettingsItem
            icon={<TrashIcon size={22} color={Colors.semantic.error} />}
            title="Изчисти разговори"
            subtitle="Изтрий всички локални разговори"
            onPress={handleClearConversations}
          />
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title="За приложението">
          <SettingsItem
            icon={<InformationCircleIcon size={22} color={Colors.gold[400]} />}
            title="Версия"
            subtitle="1.0.0"
            showArrow={false}
          />
          <SettingsItem
            icon={<InformationCircleIcon size={22} color={Colors.gold[400]} />}
            title="Условия за ползване"
            onPress={() => {
              Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
            }}
          />
          <SettingsItem
            icon={<InformationCircleIcon size={22} color={Colors.gold[400]} />}
            title="Политика за поверителност"
            onPress={() => {
              Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
            }}
          />
          <SettingsItem
            icon={<InformationCircleIcon size={22} color={Colors.gold[400]} />}
            title="Свържи се с поддръжката"
            onPress={() => {
              Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
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
});


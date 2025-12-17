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
import { Colors, Spacing, Typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
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
    {children}
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
      <ChevronRightIcon size={20} color={Colors.text.tertiary} />
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

  const handleClearCache = () => {
    Alert.alert(
      'Изчистване на кеша',
      'Сигурен ли си, че искаш да изчистиш кеша?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изчисти',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear cache
            Alert.alert('Успех', 'Кешът е изчистен');
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
          onPress: () => {
            // TODO: Implement clear conversations
            Alert.alert('Успех', 'Разговорите са изчистени');
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notifications Section */}
      <SettingsSection title="Известия">
        <SettingsItem
          icon={<BellIcon size={22} color={Colors.green[500]} />}
          title="Push известия"
          rightComponent={
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: Colors.gray[300], true: Colors.green[400] }}
              thumbColor={pushNotifications ? Colors.green[500] : Colors.gray[500]}
            />
          }
          showArrow={false}
        />
        <SettingsItem
          icon={<SpeakerWaveIcon size={22} color={Colors.green[500]} />}
          title="Звуци за съобщения"
          rightComponent={
            <Switch
              value={messageSounds}
              onValueChange={setMessageSounds}
              trackColor={{ false: Colors.gray[300], true: Colors.green[400] }}
              thumbColor={messageSounds ? Colors.green[500] : Colors.gray[500]}
            />
          }
          showArrow={false}
        />
        <SettingsItem
          icon={<SpeakerWaveIcon size={22} color={Colors.green[500]} />}
          title="Звуци за обаждания"
          rightComponent={
            <Switch
              value={callSounds}
              onValueChange={setCallSounds}
              trackColor={{ false: Colors.gray[300], true: Colors.green[400] }}
              thumbColor={callSounds ? Colors.green[500] : Colors.gray[500]}
            />
          }
          showArrow={false}
        />
        <SettingsItem
          icon={<BellIcon size={22} color={Colors.green[500]} />}
          title="Преглед на известия"
          subtitle="Показвай съдържанието на съобщенията в известията"
          rightComponent={
            <Switch
              value={notificationPreview}
              onValueChange={setNotificationPreview}
              trackColor={{ false: Colors.gray[300], true: Colors.green[400] }}
              thumbColor={notificationPreview ? Colors.green[500] : Colors.gray[500]}
            />
          }
          showArrow={false}
        />
        <SettingsItem
          icon={<BellIcon size={22} color={Colors.green[500]} />}
          title="Не безпокой"
          subtitle="Спиране на всички известия"
          rightComponent={
            <Switch
              value={doNotDisturb}
              onValueChange={setDoNotDisturb}
              trackColor={{ false: Colors.gray[300], true: Colors.green[400] }}
              thumbColor={doNotDisturb ? Colors.green[500] : Colors.gray[500]}
            />
          }
          showArrow={false}
        />
      </SettingsSection>

      {/* Privacy Section */}
      <SettingsSection title="Поверителност">
        <SettingsItem
          icon={<ShieldCheckIcon size={22} color={Colors.green[500]} />}
          title="Видимост на онлайн статус"
          rightComponent={
            <Switch
              value={onlineStatusVisible}
              onValueChange={setOnlineStatusVisible}
              trackColor={{ false: Colors.gray[300], true: Colors.green[400] }}
              thumbColor={onlineStatusVisible ? Colors.green[500] : Colors.gray[500]}
            />
          }
          showArrow={false}
        />
        <SettingsItem
          icon={<ShieldCheckIcon size={22} color={Colors.green[500]} />}
          title="Потвърждения за прочитане"
          rightComponent={
            <Switch
              value={readReceipts}
              onValueChange={setReadReceipts}
              trackColor={{ false: Colors.gray[300], true: Colors.green[400] }}
              thumbColor={readReceipts ? Colors.green[500] : Colors.gray[500]}
            />
          }
          showArrow={false}
        />
        <SettingsItem
          icon={<ShieldCheckIcon size={22} color={Colors.green[500]} />}
          title="Видимост на последно активен"
          rightComponent={
            <Switch
              value={lastSeenVisible}
              onValueChange={setLastSeenVisible}
              trackColor={{ false: Colors.gray[300], true: Colors.green[400] }}
              thumbColor={lastSeenVisible ? Colors.green[500] : Colors.gray[500]}
            />
          }
          showArrow={false}
        />
        <SettingsItem
          icon={<ShieldCheckIcon size={22} color={Colors.green[500]} />}
          title="Блокирани потребители"
          onPress={() => {
            // TODO: Navigate to blocked users screen
            Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
          }}
        />
      </SettingsSection>

      {/* Chat Section */}
      <SettingsSection title="Чат">
        <SettingsItem
          icon={<ChatBubbleLeftRightIcon size={22} color={Colors.green[500]} />}
          title="Размер на шрифта"
          subtitle={fontSize === 'small' ? 'Малък' : fontSize === 'medium' ? 'Среден' : 'Голям'}
          onPress={handleFontSizePress}
        />
        <SettingsItem
          icon={<ChatBubbleLeftRightIcon size={22} color={Colors.green[500]} />}
          title="Тема"
          subtitle={theme === 'light' ? 'Светла' : theme === 'dark' ? 'Тъмна' : 'Системна'}
          onPress={handleThemePress}
        />
        <SettingsItem
          icon={<ChatBubbleLeftRightIcon size={22} color={Colors.green[500]} />}
          title="Език"
          subtitle="Български"
          onPress={() => {
            // TODO: Language selection
            Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
          }}
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
          icon={<InformationCircleIcon size={22} color={Colors.green[500]} />}
          title="Версия"
          subtitle="1.0.0"
          showArrow={false}
        />
        <SettingsItem
          icon={<InformationCircleIcon size={22} color={Colors.green[500]} />}
          title="Условия за ползване"
          onPress={() => {
            // TODO: Navigate to terms screen
            Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
          }}
        />
        <SettingsItem
          icon={<InformationCircleIcon size={22} color={Colors.green[500]} />}
          title="Политика за поверителност"
          onPress={() => {
            // TODO: Navigate to privacy policy screen
            Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
          }}
        />
        <SettingsItem
          icon={<InformationCircleIcon size={22} color={Colors.green[500]} />}
          title="Свържи се с поддръжката"
          onPress={() => {
            // TODO: Navigate to support screen
            Alert.alert('Информация', 'Функционалността ще бъде добавена скоро');
          }}
        />
      </SettingsSection>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    color: Colors.text.primary,
  },
  itemSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  rightComponent: {
    marginRight: Spacing.sm,
  },
});


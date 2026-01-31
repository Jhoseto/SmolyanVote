/**
 * Profile Screen
 * Показва user profile и настройки
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types/navigation';
import { Avatar, Button } from '../../components/common';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { GlassHeader } from '../../components/common/GlassHeader';
import { useUIStore } from '../../store/uiStore';
import { useTranslation } from '../../hooks/useTranslation';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { setLoading } = useUIStore();
  const { t, language } = useTranslation();

  const handleLogout = async () => {
    Alert.alert(
      t('common.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true, t('common.loading'));
            try {
              await logout();
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <ScreenBackground>
        <View style={styles.container}>
          <Text style={styles.errorText}>{t('profile.errorNoUser')}</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <GlassHeader title={t('profile.title')} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <Avatar
            imageUrl={user.imageUrl}
            name={user.fullName}
            size={100}
            isOnline={user.isOnline}
          />
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.lastSeen && (
            <Text style={styles.lastSeen}>
              {t('profile.lastSeen')}: {new Date(user.lastSeen).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US')}
            </Text>
          )}
        </View>

        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate('EditProfile');
            }}
          >
            <Text style={styles.settingLabel}>{t('profile.editProfile')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate('Settings' as any);
            }}
          >
            <Text style={styles.settingLabel}>{t('settings.title')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <Text style={styles.settingLabel}>{t('profile.help')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <Text style={styles.settingLabel}>{t('profile.about')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <Button
            title={t('profile.logout')}
            onPress={handleLogout}
            variant="outline"
            size="large"
            style={{ borderColor: Colors.gold[400], borderWidth: 1 }}
            textStyle={{ color: Colors.gold[400] }}
            fullWidth
          />
        </View>
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
    padding: Spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.xl,
  },
  name: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: '#ffffff',
    marginTop: Spacing.md,
  },
  username: {
    fontSize: Typography.fontSize.base,
    color: Colors.gold[400],
    marginTop: Spacing.xs,
  },
  lastSeen: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: Spacing.sm,
  },
  settingsSection: {
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Slight dark backing
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'transparent',
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    color: '#ffffff',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: Typography.fontSize.xl,
    color: Colors.gold[400],
  },
  logoutSection: {
    marginTop: Spacing.md,
  },
  errorText: {
    color: Colors.semantic.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});


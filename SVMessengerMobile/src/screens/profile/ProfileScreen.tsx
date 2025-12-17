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
import { useUIStore } from '../../store/uiStore';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { setLoading } = useUIStore();

  const handleLogout = async () => {
    Alert.alert(
      'Излизане',
      'Сигурен ли си, че искаш да излезеш?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Излез',
          style: 'destructive',
          onPress: async () => {
            setLoading(true, 'Излизане...');
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
      <View style={styles.container}>
        <Text style={styles.errorText}>Няма данни за потребителя</Text>
      </View>
    );
  }

  return (
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
            Последно активен: {new Date(user.lastSeen).toLocaleDateString('bg-BG')}
          </Text>
        )}
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity 
          style={styles.settingItem} 
          activeOpacity={0.7}
          onPress={() => {
            // TODO: Navigate to EditProfileScreen
            navigation.navigate('EditProfile');
          }}
        >
          <Text style={styles.settingLabel}>Редактирай профил</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem} 
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('Settings');
          }}
        >
          <Text style={styles.settingLabel}>Настройки</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
          <Text style={styles.settingLabel}>Помощ и поддръжка</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
          <Text style={styles.settingLabel}>За приложението</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoutSection}>
        <Button
          title="Излез"
          onPress={handleLogout}
          variant="outline"
          size="large"
          fullWidth
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    marginBottom: Spacing.xl,
  },
  name: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  username: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  lastSeen: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  settingsSection: {
    marginBottom: Spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  settingArrow: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.text.tertiary,
  },
  logoutSection: {
    marginTop: Spacing.xl,
  },
  errorText: {
    color: Colors.semantic.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});


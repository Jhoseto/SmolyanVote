/**
 * Register Screen
 * Екран за регистрация на нови потребители
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Button, Input } from '../../components/common';
import { Colors, Typography, Spacing } from '../../theme';
import { isValidEmail, isValidPassword } from '../../utils/validation';
import apiClient from '../../services/api/client';
import { API_CONFIG } from '../../config/api';
import { useUIStore } from '../../store/uiStore';

export const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { setLoading } = useUIStore();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email е задължителен';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Невалиден email формат';
    }

    if (!username.trim()) {
      newErrors.username = 'Username е задължителен';
    } else if (username.length < 3) {
      newErrors.username = 'Username трябва да е поне 3 символа';
    }

    if (!password.trim()) {
      newErrors.password = 'Паролата е задължителна';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Паролата трябва да е поне 6 символа';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Паролите не съвпадат';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true, 'Регистрация...');
    try {
      // TODO: Използвай правилния registration endpoint
      const response = await apiClient.post('/api/user/registration', {
        email: email.toLowerCase().trim(),
        username: username.trim(),
        password,
        realName: realName.trim() || username.trim(),
      });

      Alert.alert(
        'Успешна регистрация',
        'Моля, провери имейла си за активационен линк.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to login
              // Navigation ще се направи от navigator
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Грешка при регистрация. Моля, опитайте отново.';
      Alert.alert('Грешка', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Регистрация</Text>
          <Text style={styles.subtitle}>Създай нов акаунт</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Username"
              placeholder="username"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Име"
              placeholder="Твоето име (опционално)"
              value={realName}
              onChangeText={setRealName}
              error={errors.realName}
            />

            <Input
              label="Парола"
              placeholder="Минимум 6 символа"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
            />

            <Input
              label="Потвърди парола"
              placeholder="Повтори паролата"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title="Регистрирай се"
              onPress={handleRegister}
              variant="primary"
              size="large"
              fullWidth
              style={styles.registerButton}
            />

            <Text style={styles.termsText}>
              С регистрацията си приемаш{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://smolyanvote.com/terms-and-conditions')}
              >
                Условията за ползване
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.green[500],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  form: {
    marginTop: Spacing.xl,
  },
  registerButton: {
    marginTop: Spacing.md,
  },
  termsText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  link: {
    color: Colors.green[500],
    textDecorationLine: 'underline',
  },
});


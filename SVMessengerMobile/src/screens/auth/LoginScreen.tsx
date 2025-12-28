/**
 * Login Screen
 * Екран за вход в приложението
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
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Input } from '../../components/common';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { login } = useAuthStore();
  const { setLoading } = useUIStore();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validation
    let isValid = true;

    if (!email.trim()) {
      setEmailError('Email е задължителен');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Невалиден email формат');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Паролата е задължителна');
      isValid = false;
    }

    if (!isValid) return;

    // Login
    setLoading(true, 'Влизане...');
    try {
      await login(email.toLowerCase().trim(), password);
      // Navigation ще се направи автоматично от AppNavigator
    } catch (error: any) {
      Alert.alert('Грешка', error.message || 'Неуспешен вход. Моля, опитайте отново.');
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
          <Text style={styles.title}>SVMessenger</Text>
          <Text style={styles.subtitle}>Влез в профила си</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Парола"
              placeholder="Въведи парола"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title="Влез"
              onPress={handleLogin}
              variant="primary"
              size="large"
              fullWidth
              style={styles.loginButton}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword' as any)}
              style={styles.forgotPasswordButton}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Забравена парола?</Text>
            </TouchableOpacity>

            {/* OAuth Buttons */}
            <OAuthButtons
              onSuccess={() => {
                // Navigation ще се направи автоматично от AppNavigator
              }}
              onError={(error) => {
                console.error('OAuth error:', error);
              }}
            />

            <View style={styles.registerSection}>
              <Text style={styles.registerText}>Нямаш акаунт? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>Регистрирай се</Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 36,
    fontWeight: '700',
    color: Colors.green[500],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  form: {
    marginTop: Spacing.xl,
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.green[500],
    fontWeight: Typography.fontWeight.medium,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  registerText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  registerLink: {
    fontSize: Typography.fontSize.base,
    color: Colors.green[500],
    fontWeight: Typography.fontWeight.semibold,
  },
});


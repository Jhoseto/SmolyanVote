/**
 * Forgot Password Screen
 * Екран за забравена парола
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeftIcon, EnvelopeIcon } from '../../components/common/Icons';
import { Colors, Typography, Spacing } from '../../theme';
import apiClient from '../../services/api/client';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Грешка', 'Моля въведи email адрес');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Грешка', 'Моля въведи валиден email адрес');
      return;
    }

    setLoading(true);

    try {
      // Call backend API for password reset
      await apiClient.post('/api/user/forgot-password', { email });
      
      setEmailSent(true);
      Alert.alert(
        'Email изпратен',
        'Провери пощата си за инструкции за възстановяване на паролата',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Грешка',
        error.response?.data?.message || 'Неуспешно изпращане на email за възстановяване'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Забравена парола</Text>
            <Text style={styles.subtitle}>
              Въведи email адреса си и ще ти изпратим инструкции за възстановяване на паролата
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <EnvelopeIcon size={20} color={Colors.text.secondary} />
              </View>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email адрес"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading && !emailSent}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading || emailSent}
              activeOpacity={0.8}
              style={styles.submitButtonWrapper}
            >
              <LinearGradient
                colors={[Colors.green[500], Colors.green[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.submitButton, (loading || emailSent) && styles.submitButtonDisabled]}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Изпращане...' : emailSent ? 'Email изпратен' : 'Изпрати'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backToLoginButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backToLoginText}>Назад към вход</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  form: {
    marginTop: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  submitButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  submitButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
  backToLoginButton: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: Typography.fontSize.base,
    color: Colors.green[500],
    fontWeight: Typography.fontWeight.medium,
  },
});


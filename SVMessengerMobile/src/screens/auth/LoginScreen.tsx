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
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Button, Input, FadeInView } from '../../components/common';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

const { width } = Dimensions.get('window');

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
    setEmailError('');
    setPasswordError('');

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

    setLoading(true, 'Влизане...');
    try {
      await login(email.toLowerCase().trim(), password);
    } catch (error: any) {
      Alert.alert('Грешка', error.message || 'Неуспешен вход. Моля, опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#022c22', '#064e3b', '#022c22']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <FadeInView delay={100} startY={-20}>
              <View style={styles.headerSection}>
                <Text style={styles.title}>SVMessenger</Text>
                <View style={styles.titleUnderline} />
                <Text style={styles.subtitle}>Влез в премиум света на общуването</Text>
              </View>
            </FadeInView>

            <FadeInView delay={300} startY={30}>
              <View style={styles.glassCard}>
                <View style={styles.form}>
                  <Input
                    label="Email адрес"
                    labelStyle={styles.inputLabel}
                    placeholder="email@example.com"
                    value={email}
                    onChangeText={setEmail}
                    error={emailError}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  />

                  <Input
                    label="Парола"
                    labelStyle={styles.inputLabel}
                    placeholder="Въведи парола"
                    value={password}
                    onChangeText={setPassword}
                    error={passwordError}
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  />

                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword' as any)}
                    style={styles.forgotPasswordButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>Забравена парола?</Text>
                  </TouchableOpacity>

                  <Button
                    title="Влез в профила"
                    onPress={handleLogin}
                    variant="secondary"
                    size="large"
                    fullWidth
                    style={styles.loginButton}
                    textStyle={styles.loginButtonText}
                  />

                  <OAuthButtons
                    onSuccess={() => { }}
                    onError={(error) => console.error('OAuth error:', error)}
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
            </FadeInView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  content: {
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 1.5,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.text.inverse,
    textAlign: 'center',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: Colors.gold[500], // Premium gold underline
    borderRadius: 2,
    marginTop: -4,
    marginBottom: Spacing.sm,
    shadowColor: Colors.gold[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: width * 0.7,
    lineHeight: 22,
  },
  glassCard: {
    width: width - Spacing.lg * 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 32,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    color: Colors.text.inverse,
    height: 56,
  },
  loginButton: {
    backgroundColor: Colors.gold[500],
    borderRadius: 16,
    height: 58,
    marginTop: Spacing.md,
    borderWidth: 0,
    shadowColor: Colors.gold[700],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  loginButtonText: {
    color: '#000000', // Maximum contrast black text on gold
    fontSize: 18,
    fontWeight: '900', // Maximum weight
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.gold[400],
    fontWeight: '600',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  registerText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  registerLink: {
    fontSize: 15,
    color: Colors.gold[400],
    fontWeight: '700',
  },
});


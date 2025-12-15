/**
 * OAuth Buttons Component
 * Google и Facebook login бутони
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import { oauthService, OAuthTokenResponse } from '../../services/auth/oauthService';
import { useAuthStore } from '../../store/authStore';

interface OAuthButtonsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onSuccess, onError }) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const { setUser } = useAuthStore();

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const response: OAuthTokenResponse = await oauthService.signInWithGoogle();
      
      // Обновяване на auth store с user данните
      // Конвертиране на OAuthTokenResponse user към User type
      setUser({
        id: response.user.id,
        username: response.user.username,
        fullName: response.user.fullName,
        imageUrl: response.user.imageUrl,
        isOnline: response.user.isOnline,
      });
      
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Грешка при вход с Google';
      Alert.alert('Грешка', errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoadingFacebook(true);
    try {
      const response: OAuthTokenResponse = await oauthService.signInWithFacebook();
      
      // Обновяване на auth store с user данните
      setUser({
        id: response.user.id,
        username: response.user.username,
        fullName: response.user.fullName,
        imageUrl: response.user.imageUrl,
        isOnline: response.user.isOnline,
      });
      
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Грешка при вход с Facebook';
      Alert.alert('Грешка', errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoadingFacebook(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>или</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* OAuth Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Google Button */}
        <TouchableOpacity
          style={[styles.oauthButton, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loadingGoogle || loadingFacebook}
          activeOpacity={0.7}
        >
          {loadingGoogle ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <GoogleIcon />
              <Text style={styles.googleButtonText}>Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Facebook Button */}
        <TouchableOpacity
          style={[styles.oauthButton, styles.facebookButton]}
          onPress={handleFacebookLogin}
          disabled={loadingGoogle || loadingFacebook}
          activeOpacity={0.7}
        >
          {loadingFacebook ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <FacebookIcon />
              <Text style={styles.facebookButtonText}>Facebook</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Google Icon SVG Component
const GoogleIcon: React.FC = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.googleIconText}>G</Text>
  </View>
);

// Facebook Icon SVG Component
const FacebookIcon: React.FC = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.facebookIconText}>f</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    minHeight: 48,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  googleButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  facebookButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: '#fff',
    marginLeft: Spacing.sm,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  facebookIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});


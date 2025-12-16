/**
 * OAuth Buttons Component
 * Google и Facebook login бутони
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
      console.error('Google login error:', errorMessage);
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
      console.error('Facebook login error:', errorMessage);
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
          activeOpacity={0.8}
        >
          {loadingGoogle ? (
            <ActivityIndicator color="#3c4043" size="small" />
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
          activeOpacity={0.8}
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

// Google Icon SVG Component - точно като в web версията
const GoogleIcon: React.FC = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.iconContainer}>
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </Svg>
);

// Facebook Icon SVG Component - точно като в web версията
const FacebookIcon: React.FC = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#1877F2" style={styles.iconContainer}>
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 40,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderWidth: 1,
    borderColor: '#1877F2',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3c4043',
  },
  facebookButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  iconContainer: {
    width: 16,
    height: 16,
  },
});


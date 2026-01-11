/**
 * Permissions Request Screen
 * Показва се при първо стартиране за да се поискат всички permissions наведнъж
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { appPermissionsService, AppPermissionsStatus } from '../../services/permissions/appPermissionsService';
import { nativePermissionsService } from '../../services/permissions/nativePermissionsService';
import { Colors, Typography, Spacing } from '../../theme';
import { logger } from '../../utils/logger';

interface PermissionsRequestScreenProps {
  onComplete: (allGranted: boolean) => void;
}

const PermissionsRequestScreen: React.FC<PermissionsRequestScreenProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [permissionsStatus, setPermissionsStatus] = useState<AppPermissionsStatus | null>(null);
  const [batteryOptimized, setBatteryOptimized] = useState<boolean | null>(null);

  // Create styles lazily to ensure theme is loaded
  const styles = useMemo(() => StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      padding: Spacing.lg,
      backgroundColor: Colors.background.primary,
    },
    header: {
      marginBottom: Spacing.xl,
      marginTop: Spacing.xl,
    },
    title: {
      fontSize: 24, // Typography.fontSize['2xl']
      fontWeight: Typography.fontWeight.bold,
      color: Colors.text.primary,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fontSize.base,
      color: Colors.text.secondary,
      lineHeight: 22,
    },
    permissionsList: {
      flex: 1,
      marginBottom: Spacing.lg,
    },
    permissionItem: {
      backgroundColor: Colors.background.secondary,
      borderRadius: 12,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    permissionInfo: {
      flex: 1,
    },
    permissionName: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.semibold,
      color: Colors.text.primary,
      marginBottom: Spacing.xs,
    },
    permissionDescription: {
      fontSize: Typography.fontSize.sm,
      color: Colors.text.secondary,
      lineHeight: 18,
    },
    grantedBadge: {
      fontSize: Typography.fontSize.sm,
      color: Colors.green[500],
      fontWeight: Typography.fontWeight.medium,
      marginLeft: Spacing.sm,
    },
    infoBox: {
      backgroundColor: Colors.blue[50],
      borderRadius: 12,
      padding: Spacing.md,
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.blue[200],
    },
    infoTitle: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      color: Colors.blue[700],
      marginBottom: Spacing.xs,
    },
    infoText: {
      fontSize: Typography.fontSize.sm,
      color: Colors.blue[700],
      lineHeight: 18,
      marginBottom: Spacing.sm,
    },
    infoButton: {
      alignSelf: 'flex-start',
    },
    infoButtonText: {
      fontSize: Typography.fontSize.sm,
      color: Colors.blue[600],
      fontWeight: Typography.fontWeight.medium,
      textDecorationLine: 'underline',
    },
    warningBox: {
      backgroundColor: Colors.orange[50],
      borderRadius: 12,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      borderWidth: 2,
      borderColor: Colors.orange[300],
    },
    warningTitle: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.bold,
      color: Colors.orange[800],
      marginBottom: Spacing.xs,
    },
    warningText: {
      fontSize: Typography.fontSize.sm,
      color: Colors.orange[900],
      lineHeight: 20,
      marginBottom: Spacing.xs,
    },
    warningBold: {
      fontWeight: Typography.fontWeight.bold,
      color: Colors.orange[900],
    },
    warningSubtext: {
      fontSize: Typography.fontSize.sm,
      color: Colors.orange[800],
      lineHeight: 18,
      fontStyle: 'italic',
    },
    actions: {
      // gap is not fully supported in all React Native versions, use marginBottom instead
    },
    secondaryButtonMargin: {
      marginTop: Spacing.md,
    },
    button: {
      borderRadius: 12,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
    },
    primaryButton: {
      backgroundColor: Colors.green[500],
    },
    secondaryButton: {
      backgroundColor: Colors.background.secondary,
      borderWidth: 1,
      borderColor: Colors.border.medium,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      color: Colors.background.primary,
    },
    secondaryButtonText: {
      color: Colors.text.primary,
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: Typography.fontSize.base,
      color: Colors.text.secondary,
    },
  }), []);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await appPermissionsService.checkAllPermissions();
      setPermissionsStatus(status);
      
      // Check battery optimization
      const batteryStatus = await nativePermissionsService.checkBatteryOptimization();
      setBatteryOptimized(batteryStatus.isIgnoring);
      
      setLoading(false);

      // If all critical permissions are granted, complete immediately
      const allGranted = await appPermissionsService.areAllCriticalPermissionsGranted();
      if (allGranted && batteryStatus.isIgnoring) {
        // Small delay to show the screen briefly
        setTimeout(() => {
          onComplete(true);
        }, 500);
      }
    } catch (error) {
      logger.error('Error checking permissions:', error);
      setLoading(false);
    }
  };

  const handleRequestPermissions = async () => {
    setRequesting(true);
    try {
      // Request runtime permissions
      const status = await appPermissionsService.requestAllPermissions();
      setPermissionsStatus(status);

      // Request battery optimization exemption
      const batteryStatus = await nativePermissionsService.checkBatteryOptimization();
      if (!batteryStatus.isIgnoring && batteryStatus.canRequest) {
        await nativePermissionsService.requestIgnoreBatteryOptimization();
        // Re-check after request
        const newBatteryStatus = await nativePermissionsService.checkBatteryOptimization();
        setBatteryOptimized(newBatteryStatus.isIgnoring);
      }

      // Check for blocked permissions
      const blockedPermissions: string[] = [];
      if (status.notifications.blocked) blockedPermissions.push('Нотификации');
      if (status.microphone.blocked) blockedPermissions.push('Микрофон');
      if (status.camera.blocked) blockedPermissions.push('Камера');

      if (blockedPermissions.length > 0) {
        appPermissionsService.showBlockedPermissionsAlert(blockedPermissions);
      }

      // Complete regardless of result - user can enable later in settings
      const allGranted = await appPermissionsService.areAllCriticalPermissionsGranted();
      const batteryOk = batteryStatus.isIgnoring;
      onComplete(allGranted && batteryOk);
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      onComplete(false);
    } finally {
      setRequesting(false);
    }
  };

  const handleSkip = async () => {
    // CRITICAL FIX: Mark permissions as requested even when user skips
    // This prevents the permissions screen from showing repeatedly on every app launch
    // User can still grant permissions later in Settings if needed
    try {
      await appPermissionsService.markPermissionsRequested();
    } catch (error) {
      logger.error('Error marking permissions as requested:', error);
    }
    // Allow user to skip - permissions can be requested later
    onComplete(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.green[500]} />
        <Text style={styles.loadingText}>Проверка на разрешения...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Разрешения</Text>
          <Text style={styles.subtitle}>
            SVMessenger се нуждае от следните разрешения за да работи правилно:
          </Text>
        </View>

        <View style={styles.permissionsList}>
          {/* Notifications */}
          {Platform.Version >= 33 && (
            <View style={styles.permissionItem}>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionName}>🔔 Нотификации</Text>
                <Text style={styles.permissionDescription}>
                  За получаване на нотификации за нови съобщения и входящи обаждания
                </Text>
              </View>
              {permissionsStatus?.notifications.granted && (
                <Text style={styles.grantedBadge}>✓ Разрешено</Text>
              )}
            </View>
          )}

          {/* Microphone */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>🎤 Микрофон</Text>
              <Text style={styles.permissionDescription}>
                За аудио разговори и гласови съобщения
              </Text>
            </View>
            {permissionsStatus?.microphone.granted && (
              <Text style={styles.grantedBadge}>✓ Разрешено</Text>
            )}
          </View>

          {/* Camera */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>📷 Камера</Text>
              <Text style={styles.permissionDescription}>
                За видео разговори и снимки
              </Text>
            </View>
            {permissionsStatus?.camera.granted && (
              <Text style={styles.grantedBadge}>✓ Разрешено</Text>
            )}
          </View>

          {/* Battery Optimization */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>🔋 Оптимизация на батерията</Text>
              <Text style={styles.permissionDescription}>
                За да работи приложението правилно в background и да показва нотификации
              </Text>
            </View>
            {batteryOptimized && (
              <Text style={styles.grantedBadge}>✓ Разрешено</Text>
            )}
          </View>

          {/* Full Screen Intent Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Важно</Text>
            <Text style={styles.infoText}>
              За да се показва екранът за входящи обаждания когато приложението е затворено, моля разрешете "Показване над други приложения" в настройките на устройството.
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => appPermissionsService.showFullScreenIntentInfo()}
            >
              <Text style={styles.infoButtonText}>Как да разреша?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning Box - Critical */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ ВАЖНО</Text>
          <Text style={styles.warningText}>
            Без тези разрешения приложението <Text style={styles.warningBold}>НЯМА ДА РАБОТИ ПРАВИЛНО</Text>. Може да не получавате нотификации, да не можете да правите обаждания или да не виждате входящи обаждания когато приложението е затворено.
          </Text>
          <Text style={styles.warningSubtext}>
            Моля, разрешете всички разрешения за оптимална работа на приложението.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, requesting && styles.buttonDisabled]}
            onPress={handleRequestPermissions}
            disabled={requesting}
          >
            {requesting ? (
              <ActivityIndicator size="small" color={Colors.background.primary} />
            ) : (
              <Text style={styles.buttonText}>Разреши всички</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, styles.secondaryButtonMargin]}
            onPress={handleSkip}
            disabled={requesting}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>По-късно</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default PermissionsRequestScreen;

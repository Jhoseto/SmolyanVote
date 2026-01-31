/**
 * Permissions Settings Screen
 * Управление на системни разрешения от Settings
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    NativeModules,
    AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { GlassHeader } from '../../components/common/GlassHeader';
import { useTranslation } from '../../hooks/useTranslation';

const { PermissionsModule } = NativeModules;

export const PermissionsSettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [overlayPermission, setOverlayPermission] = useState(false);
    const [batteryOptimization, setBatteryOptimization] = useState(true);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkPermissions();
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);

    const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'active') {
            checkPermissions();
        }
    };

    const checkPermissions = async () => {
        setIsChecking(true);
        try {
            const canDraw = await PermissionsModule.checkFullScreenIntentPermission();
            setOverlayPermission(canDraw?.granted || false);

            const batteryOpt = await PermissionsModule.checkBatteryOptimization();
            setBatteryOptimization(batteryOpt?.isIgnoring || false);
        } catch (error) {
            console.error('Error checking permissions:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const requestOverlayPermission = async () => {
        try {
            await PermissionsModule.openFullScreenIntentSettings();
        } catch (error) {
            console.error('Error opening overlay settings:', error);
        }
    };

    const requestBatteryOptimization = async () => {
        try {
            await PermissionsModule.requestIgnoreBatteryOptimization();
        } catch (error) {
            console.error('Error requesting battery optimization:', error);
        }
    };

    return (
        <ScreenBackground>
            <GlassHeader
                title={t('permissions.title')}
                showBackButton
                onBackPress={() => navigation.goBack()}
            />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>{t('permissions.infoTitle')}</Text>
                    <Text style={styles.infoText}>
                        {t('permissions.infoText')}
                    </Text>
                </View>

                {/* Permissions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('permissions.sectionTitle')}</Text>
                    <View style={styles.sectionContent}>
                        {/* Overlay Permission */}
                        <View style={styles.permissionItem}>
                            <View style={styles.permissionHeader}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        overlayPermission ? styles.statusSuccess : styles.statusError,
                                    ]}>
                                    <Text style={styles.statusIcon}>
                                        {overlayPermission ? '✓' : '!'}
                                    </Text>
                                </View>
                                <View style={styles.permissionInfo}>
                                    <Text style={styles.permissionName}>
                                        {t('permissions.overlayName')}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.permissionStatus,
                                            overlayPermission ? styles.statusTextSuccess : styles.statusTextError,
                                        ]}>
                                        {overlayPermission ? t('permissions.overlayAllowed') : t('permissions.overlayNotAllowed')}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.permissionDescription}>
                                {overlayPermission
                                    ? t('permissions.overlayDescriptionAllowed')
                                    : t('permissions.overlayDescriptionNotAllowed')}
                            </Text>

                            {!overlayPermission && (
                                <View style={styles.warningBox}>
                                    <Text style={styles.warningText}>
                                        {t('permissions.overlayWarning')}
                                    </Text>
                                </View>
                            )}

                            {!overlayPermission && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={requestOverlayPermission}
                                    activeOpacity={0.8}>
                                    <Text style={styles.actionButtonText}>{t('permissions.openSettings')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Battery Optimization */}
                        <View style={[styles.permissionItem, styles.permissionItemLast]}>
                            <View style={styles.permissionHeader}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        batteryOptimization ? styles.statusSuccess : styles.statusWarning,
                                    ]}>
                                    <Text style={styles.statusIcon}>
                                        {batteryOptimization ? '✓' : 'i'}
                                    </Text>
                                </View>
                                <View style={styles.permissionInfo}>
                                    <Text style={styles.permissionName}>
                                        {t('permissions.batteryName')}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.permissionStatus,
                                            batteryOptimization
                                                ? styles.statusTextSuccess
                                                : styles.statusTextWarning,
                                        ]}>
                                        {batteryOptimization ? t('permissions.batteryAllowed') : t('permissions.batteryRecommended')}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.permissionDescription}>
                                {batteryOptimization
                                    ? t('permissions.batteryDescriptionAllowed')
                                    : t('permissions.batteryDescriptionRecommended')}
                            </Text>

                            {!batteryOptimization && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.actionButtonSecondary]}
                                    onPress={requestBatteryOptimization}
                                    activeOpacity={0.8}>
                                    <Text style={styles.actionButtonSecondaryText}>
                                        {t('permissions.openSettings')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* Help Section */}
                <View style={styles.helpBox}>
                    <Text style={styles.helpTitle}>{t('permissions.helpTitle')}</Text>
                    <Text style={styles.helpText}>
                        {t('permissions.helpText')}
                    </Text>
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
        padding: Spacing.md,
    },
    infoBox: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    infoTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.gold[400],
        marginBottom: Spacing.xs,
    },
    infoText: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 20,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.gold[400],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    sectionContent: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    permissionItem: {
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    permissionItemLast: {
        borderBottomWidth: 0,
    },
    permissionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    statusDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    statusSuccess: {
        backgroundColor: Colors.green[500],
    },
    statusError: {
        backgroundColor: Colors.red[500],
    },
    statusWarning: {
        backgroundColor: Colors.orange[500],
    },
    statusIcon: {
        color: Colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
    permissionInfo: {
        flex: 1,
    },
    permissionName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        color: '#ffffff',
        marginBottom: 4,
    },
    permissionStatus: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    statusTextSuccess: {
        color: Colors.green[400],
    },
    statusTextError: {
        color: Colors.red[400],
    },
    statusTextWarning: {
        color: Colors.orange[400],
    },
    permissionDescription: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 20,
        marginBottom: Spacing.sm,
    },
    warningBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    warningText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.red[400],
        fontWeight: Typography.fontWeight.medium,
    },
    actionButton: {
        backgroundColor: Colors.gold[400],
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: 10,
        alignItems: 'center',
    },
    actionButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.gold[400],
    },
    actionButtonText: {
        color: Colors.gray[900],
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    actionButtonSecondaryText: {
        color: Colors.gold[400],
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    helpBox: {
        backgroundColor: 'rgba(250, 204, 21, 0.05)',
        borderRadius: 12,
        padding: Spacing.md,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.1)',
    },
    helpTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.gold[400],
        marginBottom: Spacing.xs,
    },
    helpText: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 20,
    },
});

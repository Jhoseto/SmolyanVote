import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    AppState,
    NativeModules,
    StatusBar,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';

const { PermissionsModule } = NativeModules;
const PERMISSIONS_ONBOARDING_KEY = '@permissions_onboarding_completed';

export default function PermissionsOnboardingScreen({ navigation }) {
    const [overlayPermission, setOverlayPermission] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkPermissions();
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);

    const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
            checkPermissions();
        }
    };

    const checkPermissions = async () => {
        setIsChecking(true);
        try {
            const canDraw = await PermissionsModule.checkFullScreenIntentPermission();
            setOverlayPermission(canDraw?.granted || false);

            // Auto-continue if permission granted
            if (canDraw?.granted) {
                setTimeout(() => handleContinue(), 500);
            }
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

    const handleContinue = async () => {
        if (overlayPermission) {
            await AsyncStorage.setItem(PERMISSIONS_ONBOARDING_KEY, 'true');
            navigation.replace('MainTabs');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>

                {/* Header with Icon */}
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>📞</Text>
                    </View>
                    <Text style={styles.title}>Разрешение за Обаждания</Text>
                </View>

                {/* Critical Warning Box */}
                <View style={styles.warningBox}>
                    <View style={styles.warningHeader}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <Text style={styles.warningTitle}>Важно!</Text>
                    </View>
                    <Text style={styles.warningText}>
                        <Text style={styles.warningBold}>БЕЗ</Text> това разрешение:{'\n'}
                        • Няма да виждате входящи обаждания{'\n'}
                        • Няма да можете да приемате повиквания{'\n'}
                        • Приложението няма да работи правилно
                    </Text>
                </View>

                {/* Permission Card */}
                <View style={[
                    styles.permissionCard,
                    !overlayPermission && styles.permissionCardActive
                ]}>
                    <View style={styles.permissionRow}>
                        <View style={[
                            styles.statusDot,
                            overlayPermission ? styles.statusSuccess : styles.statusError
                        ]}>
                            <Text style={styles.statusText}>
                                {overlayPermission ? '✓' : '1'}
                            </Text>
                        </View>
                        <View style={styles.permissionContent}>
                            <Text style={styles.permissionTitle}>
                                Показване върху други приложения
                            </Text>
                            <Text style={styles.permissionSubtitle}>
                                {overlayPermission
                                    ? '✓ Разрешено'
                                    : 'Задължително за входящи обаждания'}
                            </Text>
                        </View>
                    </View>

                    {!overlayPermission && (
                        <>
                            {/* Instructions */}
                            <View style={styles.instructionsBox}>
                                <Text style={styles.instructionsTitle}>Следвайте стъпките:</Text>
                                <Text style={styles.instructionStep}>1. Натиснете бутона по-долу</Text>
                                <Text style={styles.instructionStep}>2. Намерете "SVMessenger" в списъка</Text>
                                <Text style={styles.instructionStep}>3. Включете бутона</Text>
                                <Text style={styles.instructionStep}>4. Върнете се тук автоматично</Text>
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={requestOverlayPermission}
                                activeOpacity={0.8}>
                                <Text style={styles.actionButtonText}>
                                    Отвори Настройки и Разреши
                                </Text>
                                <Text style={styles.actionButtonArrow}>→</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {overlayPermission && (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✓ Готово! Сега можете да използвате приложението
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info Note */}
                {!overlayPermission && (
                    <View style={styles.infoNote}>
                        <Text style={styles.infoNoteText}>
                            Това разрешение е необходимо само веднъж.{'\n'}
                            Android изисква ръчно потвърждение за сигурност.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !overlayPermission && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!overlayPermission}
                    activeOpacity={0.8}>
                    <Text style={[
                        styles.continueButtonText,
                        !overlayPermission && styles.continueButtonTextDisabled,
                    ]}>
                        {overlayPermission
                            ? 'Продължи към Приложението'
                            : 'Разрешете достъпа за да продължите'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.green[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconText: {
        fontSize: 36,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    warningBox: {
        backgroundColor: Colors.red[50],
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: Colors.red[200],
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    warningIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    warningTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.red[900],
    },
    warningText: {
        fontSize: 15,
        color: Colors.red[900],
        lineHeight: 22,
    },
    warningBold: {
        fontWeight: '700',
        fontSize: 16,
    },
    permissionCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    permissionCardActive: {
        borderColor: Colors.green[300],
        borderWidth: 2,
        backgroundColor: Colors.green[50],
    },
    permissionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statusDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statusSuccess: {
        backgroundColor: Colors.green[500],
    },
    statusError: {
        backgroundColor: Colors.red[500],
    },
    statusText: {
        color: Colors.text.inverse,
        fontSize: 18,
        fontWeight: '700',
    },
    permissionContent: {
        flex: 1,
    },
    permissionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    permissionSubtitle: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    instructionsBox: {
        backgroundColor: Colors.blue[50],
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.blue[900],
        marginBottom: 8,
    },
    instructionStep: {
        fontSize: 13,
        color: Colors.blue[900],
        lineHeight: 20,
        marginBottom: 2,
    },
    actionButton: {
        backgroundColor: Colors.green[500],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: Colors.green[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: Colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    actionButtonArrow: {
        color: Colors.text.inverse,
        fontSize: 20,
        fontWeight: '700',
    },
    successBox: {
        backgroundColor: Colors.green[100],
        borderRadius: 10,
        padding: 12,
    },
    successText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.green[900],
        textAlign: 'center',
    },
    infoNote: {
        marginTop: 20,
        paddingHorizontal: 4,
    },
    infoNoteText: {
        fontSize: 13,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 19,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.background.primary,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    continueButton: {
        backgroundColor: Colors.green[500],
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: Colors.gray[300],
    },
    continueButtonText: {
        color: Colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
    continueButtonTextDisabled: {
        color: Colors.gray[500],
    },
});

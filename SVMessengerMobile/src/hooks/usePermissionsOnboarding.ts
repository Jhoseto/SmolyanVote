/**
 * Hook to check if permissions onboarding should be shown
 * Returns true if this is first launch or permissions not granted
 */
import { useState, useEffect } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { PermissionsModule } = NativeModules;
const PERMISSIONS_ONBOARDING_KEY = '@permissions_onboarding_completed';

export function usePermissionsOnboarding() {
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState(null); // null = loading
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkIfShouldShowOnboarding();
    }, []);

    const checkIfShouldShowOnboarding = async () => {
        try {
            // Check if onboarding was already completed
            const onboardingCompleted = await AsyncStorage.getItem(
                PERMISSIONS_ONBOARDING_KEY,
            );

            if (onboardingCompleted) {
                // User already completed onboarding before
                // But still check permissions - they might have revoked them
                const permissions = await PermissionsModule.checkFullScreenIntentPermission();
                const hasPermissions = permissions?.granted || false;

                if (!hasPermissions) {
                    // Permissions revoked - show onboarding again
                    setShouldShowOnboarding(true);
                } else {
                    setShouldShowOnboarding(false);
                }
            } else {
                // First launch - show onboarding
                setShouldShowOnboarding(true);
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // On error, don't block user - skip onboarding
            setShouldShowOnboarding(false);
        } finally {
            setIsChecking(false);
        }
    };

    return {
        shouldShowOnboarding,
        isChecking,
        recheckOnboarding: checkIfShouldShowOnboarding,
    };
}

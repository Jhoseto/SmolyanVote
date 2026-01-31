import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { ArrowLeftIcon } from './Icons';
import { ScaleButton } from './ScaleButton';

interface GlassHeaderProps {
    title: string;
    onRightPress?: () => void;
    rightIcon?: React.ReactNode;
    showBackButton?: boolean;
    onBackPress?: () => void;
    style?: ViewStyle;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
    title,
    onRightPress,
    rightIcon,
    showBackButton,
    onBackPress,
    style
}) => {
    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={[styles.container, style]}>
                <View style={styles.leftContainer}>
                    {showBackButton && onBackPress && (
                        <TouchableOpacity
                            onPress={onBackPress}
                            style={styles.backButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeftIcon size={24} color={Colors.text.inverse} />
                        </TouchableOpacity>
                    )}
                    {/* Title */}
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                {/* Right Action */}
                {rightIcon && onRightPress && (
                    <ScaleButton
                        onPress={onRightPress}
                        style={styles.rightButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {rightIcon}
                    </ScaleButton>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: 'rgba(2, 44, 34, 0.85)', // Dark Emerald Glass
        zIndex: 10,
    },
    container: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: Colors.gold[400], // Gold Border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: Spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.inverse, // White text
        flex: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    rightButton: {
        padding: Spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

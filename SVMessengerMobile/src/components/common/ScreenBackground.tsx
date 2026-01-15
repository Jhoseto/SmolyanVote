
import React from 'react';
import { StyleSheet, View, ViewStyle, ImageBackground, StatusBar, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';

interface ScreenBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

const { width, height } = Dimensions.get('window');

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ children, style }) => {
    return (
        <View style={[styles.container, style]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Main Deep Emerald Gradient */}
            <LinearGradient
                colors={[
                    '#022c22', // Almost Black Green (Top)
                    '#064e3b', // Deep Emerald
                    '#065f46', // Lighter Emerald
                    '#022c22', // Back to Dark (Bottom)
                ]}
                locations={[0, 0.4, 0.7, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Glassy Background Bubbles */}
                <View style={[styles.bubble, styles.bubble1]} />
                <View style={[styles.bubble, styles.bubble2]} />
                <View style={[styles.bubble, styles.bubble3]} />

                {children}
            </LinearGradient>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        width: width,
        height: height,
    },
    bubble: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.03)', // Very subtle
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    bubble1: {
        width: 300,
        height: 300,
        top: -50,
        right: -100,
    },
    bubble2: {
        width: 200,
        height: 200,
        bottom: 100,
        left: -50,
    },
    bubble3: {
        width: 100,
        height: 100,
        top: '40%',
        left: '20%',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    }
});

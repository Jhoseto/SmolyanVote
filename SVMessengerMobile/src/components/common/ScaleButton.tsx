import React, { useRef } from 'react';
import {
    Animated,
    TouchableOpacity,
    TouchableOpacityProps,
    GestureResponderEvent,
} from 'react-native';

interface ScaleButtonProps extends TouchableOpacityProps {
    scaleTo?: number; // Scale factor when pressed (default 0.92)
    duration?: number; // Animation duration (default 100ms)
    children?: React.ReactNode;
}

export const ScaleButton: React.FC<ScaleButtonProps> = ({
    scaleTo = 0.92,
    duration = 100,
    style,
    onPressIn,
    onPressOut,
    children,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (event: GestureResponderEvent) => {
        Animated.timing(scaleAnim, {
            toValue: scaleTo,
            duration: duration,
            useNativeDriver: true,
        }).start();

        if (onPressIn) onPressIn(event);
    };

    const handlePressOut = (event: GestureResponderEvent) => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
        }).start();

        if (onPressOut) onPressOut(event);
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9} // Slight opacity change is still nice
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                style,
                {
                    transform: [{ scale: scaleAnim }],
                } as any, // Cast to any to avoid type complexity with Animated styles
            ]}
            {...props}
        >
            {children}
        </TouchableOpacity>
    );
};

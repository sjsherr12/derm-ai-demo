import colors from 'config/colors';
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GradientProgressBar = ({
    progress = 0.5,              // between 0 and 1
    height = 12,
    borderRadius = 8,
    backgroundColor = colors.background.light,
    colorA = colors.background.primary,
    colorB = colors.background.secondary,
    style
}) => {
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animation, {
            toValue: progress,
            duration: 100,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const animatedWidth = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View
            style={[
                styles.container,
                {
                    maxHeight: height,
                    borderRadius,
                    backgroundColor,
                },
                style
            ]}
        >
            <Animated.View style={{ width: animatedWidth, height: '100%' }}>
                <LinearGradient
                    colors={[colorA, colorB]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        height: '100%',
                        borderRadius,
                    }}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow:1,
        overflow: 'hidden',
    },
});

export default GradientProgressBar;

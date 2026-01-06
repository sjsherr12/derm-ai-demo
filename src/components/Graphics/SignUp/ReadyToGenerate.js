import colors from 'config/colors';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { darken } from 'utils/darken';
import opaque from 'utils/opaque';

const ReadyToGenerateAnimation = () => {
    const scale = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0)).current;
    const particleOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate the pop-in and settle
        Animated.sequence([
            Animated.timing(scale, {
                toValue: 1.2,
                duration: 200,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 150,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();

        // Ring expands and fades
        Animated.timing(ringScale, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();

        // Sparkle opacity in
        Animated.timing(particleOpacity, {
            toValue: 1,
            duration: 300,
            delay: 150,
            useNativeDriver: true,
        }).start();
    }, []);

    const sparklePositions = [
        { top: -20, left: 0 },
        { top: -10, right: -10 },
        { bottom: -20, left: 10 },
        { bottom: -5, right: -15 },
    ];

    return (
        <View style={styles.wrapper}>
            <Animated.View
                style={[
                    styles.ring,
                    {
                        transform: [{ scale: ringScale }],
                    },
                ]}
            />
            <Animated.View
                style={{
                    transform: [{ scale }],
                }}
            >
                <Svg width={120} height={120} viewBox="0 0 120 120">
                    <Circle cx="60" cy="60" r="60" fill={colors.background.primary} />
                    <Path
                        d="M35 60 L52 75 L85 40"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </Svg>
            </Animated.View>
            {sparklePositions.map((pos, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.sparkle,
                        pos,
                        {
                            opacity: particleOpacity,
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ring: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 4,
        borderColor: opaque(colors.background.primary, .5), // semi-transparent green
        backgroundColor: 'transparent',
    },
    sparkle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
        shadowColor: '#fff',
        shadowOpacity: 0.8,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
    },
});

export default ReadyToGenerateAnimation;

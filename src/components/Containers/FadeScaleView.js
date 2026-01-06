import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';

const FadeScaleView = ({ ref, children, style, delay = 0 }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 500,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 5,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [opacity, scale, delay]);

    return (
        <Animated.View
            ref={ref}
            style={[style, {
                opacity,
                transform: [{ scale }],
            }]}
        >
            {children}
        </Animated.View>
    );
};

export default FadeScaleView;
import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Dimensions, StyleSheet, InteractionManager } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SplashTransition = ({ onComplete }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Use InteractionManager to ensure animation has high priority
        const interactionHandle = InteractionManager.createInteractionHandle();

        // Scale from 0.3 to 1 and fade in from 0 to 1
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: .3,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Pause for 1000ms, then scale up and fade out
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 5,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    // Clear interaction handle after animation completes
                    InteractionManager.clearInteractionHandle(interactionHandle);
                    // Ensure onComplete is called after all interactions are done
                    InteractionManager.runAfterInteractions(() => {
                        onComplete();
                    });
                });
            }, 750);
        });

        return () => {
            InteractionManager.clearInteractionHandle(interactionHandle);
        };
    }, []);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={require('../../assets/logos/splash-icon.png')}
                style={[
                    styles.splashIcon,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    },
                ]}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    splashIcon: {
        width: '100%',
        height: '100%',
    },
});

export default SplashTransition;
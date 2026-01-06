import { Animated, StyleSheet, View } from "react-native";
import colors from "../../config/colors";
import DefaultText from "../Text/DefaultText";
import Svg, { Circle } from "react-native-svg";
import { useEffect, useRef } from "react";
import DefaultStyles from "../../config/styles";

const ProgressSpinner = ({ progress, size = 100 }) => {
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProgress = useRef(new Animated.Value(0)).current;
    const AnimatedCircle = useRef(Animated.createAnimatedComponent(Circle)).current;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progress,
            duration: 200, // Reduced to 200ms for quicker response to updates
            useNativeDriver: true,
        }).start();
    }, [progress, animatedProgress]);

    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                <Circle
                    stroke={colors.accents.stroke}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <AnimatedCircle
                    stroke={colors.background.primary}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    originX={size / 2}
                    originY={size / 2}
                />
            </Svg>
            <View style={styles.labelContainer}>
                <DefaultText style={[styles.label, { color: colors.text.secondary }]}>
                    {Math.round(progress)}%
                </DefaultText>
            </View>
        </View>
    );
};

export default ProgressSpinner;

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    },
    labelContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    label: {
        fontSize: DefaultStyles.text.caption.xlarge,
        fontWeight: "600",
    },
});
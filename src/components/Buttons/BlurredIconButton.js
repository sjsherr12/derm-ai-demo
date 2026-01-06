import * as Haptics from 'expo-haptics'
const {Ionicons} = require('@expo/vector-icons')
const { default: colors } = require("config/colors");
const { BlurView } = require("expo-blur");
const { default: useScalePressAnimation } = require("hooks/useScalePressAnimation");
const { Pressable, Animated, StyleSheet } = require("react-native");

const BlurredIconButton = ({
    onPress,
    icon = 'arrow-back',
    size = 24,
    color = colors.text.primary,
    hapticType,
    tint = 'systemThinMaterialDark',
    intensity = 25,
    style,
    disabled = false
}) => {

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.9,
        maxScale:1,
        duration:150,
    })

    const handlePress = (e) => {
        if (disabled) return;
        if (hapticType) {
            Haptics.impactAsync(hapticType)
        }
        if (onPress) {
            onPress(e);
        }
    }

    return (
        <Pressable
            onPressIn={disabled ? undefined : handlePressIn}
            onPressOut={disabled ? undefined : handlePressOut}
            onPress={disabled ? undefined : handlePress}
            disabled={disabled}
            style={style?.outer}
        >
            <Animated.View
                style={{
                    transform:[{scale}]
                }}
            >
                <BlurView
                    intensity={intensity}
                    tint={tint}
                    style={[
                        styles.button,
                        style?.button,
                    ]}
                >
                    <Ionicons
                        name={icon}
                        size={size}
                        color={color}
                    />
                </BlurView>
            </Animated.View>
        </Pressable>
    )
}

export default BlurredIconButton;

const styles = StyleSheet.create({
    button: {
        width:48,
        height:48,
        justifyContent:'center',
        alignItems:'center',
        borderRadius:64,
        overflow:'hidden',
    }
})
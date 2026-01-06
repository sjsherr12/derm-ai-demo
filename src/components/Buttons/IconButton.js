import { Animated, Pressable, StyleSheet } from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'
import colors from 'config/colors';
import useScalePressAnimation from 'hooks/useScalePressAnimation';

const IconButton = ({
    onPress,
    icon = 'arrow-back', // fallback icon name for Ionicons
    iconComponent, // optional: custom icon component (e.g., <FontAwesome5 name="bell" />)
    size = 22,
    color = colors.text.secondary,
    hapticType,
    style,
    noScale,
    disabled = false
}) => {
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.9,
        maxScale:1,
        duration:150,
    })
    
    const handlePress = async (e) => {
        if (disabled) return;
        if (onPress) {
            await onPress(e)
        }
        if (hapticType) {
            await Haptics.impactAsync(hapticType)
        }
    }

    // Use custom icon component if provided, otherwise fall back to Ionicons
    const renderIcon = () => {
        if (iconComponent) {
            return iconComponent;
        }
        return <Ionicons name={icon} size={size} color={color} />;
    };

    return (
        <Animated.View
            style={[
                styles.button,
                style,
                {transform:[{scale}]}
            ]}
        >
            <Pressable
                onPressIn={disabled || noScale ? undefined : handlePressIn}
                onPressOut={disabled || noScale ? undefined : handlePressOut}
                onPress={disabled ? undefined : handlePress}
                disabled={disabled}
                style={{
                    width:'100%',
                    height:'100%',
                    justifyContent:'center',
                    alignItems:'center',
                }}
            >
                {renderIcon()}
            </Pressable>
        </Animated.View>
    )
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default IconButton;
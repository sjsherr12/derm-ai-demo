import { Animated, Pressable, StyleSheet, Text, View } from "react-native"
import colors from "../../config/colors"
import { merge } from "lodash"
import { useRef } from "react";
import { darken } from "../../utils/darken";
import DefaultText from "components/Text/DefaultText";

const DefaultPill = ({
    text,
    isActive,
    disabled,
    onPress,
    startAdornment,
    endAdornment,
    style,
}) => {
    if (disabled) isActive = false;
    
    const animation = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        Animated.timing(animation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
        }).start();
    };

    const handlePressOut = () => {
        Animated.timing(animation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: false,
        }).start();
    };

    const mainBackgroundColor = disabled ? darken(colors.background.screen, .075) : isActive ? style?.backgroundColor ?? colors.background.primary : colors.background.screen;
    const pressedBackgroundColor = darken(mainBackgroundColor, .1)

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [mainBackgroundColor, pressedBackgroundColor],
    });

    const scale = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.96],
    });

    const mergedStyles = merge({}, styles, style);
    const componentStylesMerged = merge({}, mergedStyles, {
        container: {
            borderColor:isActive?colors.background.screen:colors.accents.stroke,
        },
        text: {
            color:isActive?colors.text.primary:colors.text.darker,
        }
    })
    return (
        <Animated.View style={[ componentStylesMerged.container, {backgroundColor, transform:[{scale}]}]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                style={{
                    flexDirection:'row',
                    alignItems:'center',
                    gap:8,
                }}
            >
                {startAdornment}
                <DefaultText style={componentStylesMerged.text}>{text}</DefaultText>
                {endAdornment}
            </Pressable>
        </Animated.View>
    )
}

export default DefaultPill;

const styles = StyleSheet.create({
    container: {
        borderRadius:8,
        padding:10,
        borderWidth:1,
        boxShadow:'0px 2px 14px rgba(0,0,0,.03)',
    },
    text: {
        color:'#333',
        fontSize:16,
        fontWeight:'600',
    }
})
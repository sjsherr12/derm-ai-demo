import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import DefaultText from 'components/Text/DefaultText';
import colors from '../../config/colors';
import { darken } from '../../utils/darken';
import { merge } from 'lodash';
import * as Haptics from 'expo-haptics'
import DefaultStyles from 'config/styles';
import useScalePressAnimation from '../../hooks/useScalePressAnimation';

const DefaultButton = ({
    title,
    isActive,
    disabled,
    description,
    startAdornment,
    endAdornment,
    hapticType,
    onPress,
    style,
    extraStyles,
}) => {
    if (disabled) isActive = false;
    const animation = useRef(new Animated.Value(0)).current;
    const { scale: scaleAnimation, handlePressIn, handlePressOut } = useScalePressAnimation({
        minScale: 0.975,
        maxScale: 1,
    });

    const mainBackgroundColor = style?.backgroundColor ? style.backgroundColor : disabled ? darken(colors.background.screen, .075) : isActive ? colors.background.primary : colors.background.light;
    const mainTextColor = style?.color ? style.color : disabled ? colors.background.screen : isActive ? colors.text.primary : colors.text.secondary;
    const pressedBackgroundColor = darken(mainBackgroundColor, .1)

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [mainBackgroundColor, pressedBackgroundColor],
    });


    // note: this is ONLY for normal styles that need variable control for description or something, no user added styles.
    const dynamicStyles = merge({}, styles, {
        button: {
            paddingVertical:description?8:0,
            paddingLeft:description?4:0,
            height:description?70:60,
            borderRadius:12,
            alignItems:description?'left':'center',
        },
        text: {
            width:description?'150%':'100%',
            textAlign:description?'left':'center',
        },
        description: {
            width:description?'150%':'100%',
            textAlign:description?'left':'center',
        }
    })

    // the main purpose of this has become to merge user styles. just trust how it works, its very dynamic.
    const componentStylesMerged = merge({}, dynamicStyles, {
        button: {
            ...style,
        },
        text: {
            ...extraStyles?.text
        },
        description:{
            ...extraStyles?.description,
        },
    })

    return (
        <Animated.View style={[ componentStylesMerged.button, {backgroundColor, transform:[{scale: scaleAnimation}]}]}>
            <Pressable
                disabled={disabled}
                style={[dynamicStyles.button, extraStyles?.button, StyleSheet.absoluteFill]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => {
                    if (hapticType) {
                        Haptics.impactAsync(hapticType)
                    }
                    if (onPress) onPress()
                }}
            >
                {(startAdornment || endAdornment) &&
                    <View style={componentStylesMerged.adornment}>{startAdornment}</View>
                }

                <View style={styles.textContainer}>
                    <DefaultText style={[componentStylesMerged.text, {color: mainTextColor}]}>{title}</DefaultText>
                    {description && <DefaultText style={[componentStylesMerged.description, {color: mainTextColor}]}>{description}</DefaultText>}
                </View>

                {(startAdornment || endAdornment) &&
                    <View style={componentStylesMerged.adornment}>{endAdornment}</View>
                }
            </Pressable>
        </Animated.View>
    );
};

export default DefaultButton;

const styles = StyleSheet.create({
    button: {
        gap:4,
        borderRadius: 32,
        width: '100%',
        justifyContent: 'space-between',
        flexDirection:'row',
    },
    text: {
        textAlign:'center',
        fontSize: 18,
        fontWeight: '500',
    },
    description: {
        fontSize:DefaultStyles.text.caption.xsmall,
        fontWeight:'400',
    },
    textContainer: {
        flex:1,
        display:'flex',
        justifyContent:'center',
        gap:6,
        flexDirection:'column',
    },
    adornment: {
        width:48,
        justifyContent:'center',
        alignItems:'center',
        marginHorizontal: 8,
    },
});
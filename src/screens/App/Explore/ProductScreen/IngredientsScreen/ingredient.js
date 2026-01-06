import DefaultText from "components/Text/DefaultText"
import colors from "config/colors"
import DefaultStyles from "config/styles"
import { getIngredientSafetyRating } from "utils/ingredients"
import {Ionicons} from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useNavigation } from "@react-navigation/native"
import useScalePressAnimation from "hooks/useScalePressAnimation"
const { useState, useRef } = require("react")
const { View, StyleSheet, Animated, Pressable } = require("react-native")

const IngredientsScreenIngredientItem = ({
    ingredient,
    value,
    onChange,
    noBottomBorder,
}) => {
    const safetyInfo = getIngredientSafetyRating(ingredient)

    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
    })

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
        if (onChange) {
            if (value === ingredient?.id) {
                onChange(null)
            }
            else {
                onChange(ingredient?.id);
            }
        }
    }
    
    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={!noBottomBorder && {
                borderBottomWidth:1.5,
                borderBottomColor:colors.accents.stroke,
            }}
        >
            <Animated.View
                style={[
                    {
                        paddingTop:DefaultStyles.container.paddingBottom,
                        paddingBottom:!noBottomBorder && DefaultStyles.container.paddingBottom,
                    },
                    styles.flexContainer,
                    {transform:[{scale}]}
                ]}
            >
                <View
                    style={{
                        flex:1,
                        gap:6
                    }}
                >
                    <DefaultText
                        numberOfLines={1}
                        style={styles.name}
                    >
                        {ingredient?.name ?? 'Ingredient'}
                    </DefaultText>

                    <View
                        style={styles.flexContainer}
                    >
                        <View
                            style={[
                                styles.indicator,
                                {borderColor:safetyInfo?.color}
                            ]}
                        />
                        <DefaultText
                            style={[
                                styles.rating,
                                {color:safetyInfo?.color}
                            ]}
                        >
                            {safetyInfo?.name}
                        </DefaultText>
                    </View>
                </View>

                <Ionicons
                    name='information-circle-outline'
                    color={colors.background.primary}
                    size={28}
                    style={{marginLeft:'auto'}}
                />
            </Animated.View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    flexContainer: {
        gap:6,
        flexDirection:'row',
        alignItems:'center',
    },
    name: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
    },
    rating: {
        fontSize:DefaultStyles.text.caption.xsmall,
        fontWeight:'600',
    },
    indicator: {
        borderWidth:3,
        padding:3,
        borderRadius:64,
    }
})

export default IngredientsScreenIngredientItem;
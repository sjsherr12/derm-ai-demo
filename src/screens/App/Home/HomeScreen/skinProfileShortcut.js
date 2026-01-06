const { default: DefaultText } = require("components/Text/DefaultText")
const { default: colors } = require("config/colors")
const { default: DefaultStyles } = require("config/styles")
const { View, StyleSheet, Animated, Pressable } = require("react-native")
import {Ionicons} from '@expo/vector-icons'
import useScalePressAnimation from 'hooks/useScalePressAnimation'
import { useRef } from 'react'

const HomeScreenUpdateSkinProfileShortcut = ({

}) => {

    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
    })

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.container,
                    {transform:[{scale}]}
                ]}
            >
                <View
                    style={styles.infoContainer}
                >
                    <DefaultText
                        style={styles.title}
                    >
                        Update your skin profile
                    </DefaultText>
                    <DefaultText
                        style={styles.caption}
                    >
                        Complete your profile to improve skincare recommendations.
                    </DefaultText>
                </View>
                <Ionicons
                    name='chevron-forward'
                    size={24}
                    color={colors.text.secondary}
                />
            </Animated.View>
        </Pressable>
    )
}

export default HomeScreenUpdateSkinProfileShortcut;

const styles = StyleSheet.create({
    container: {
        gap:16,
        borderRadius:12,
        padding:DefaultStyles.container.paddingHorizontal,
        flexDirection:'row',
        alignItems:'center',
        backgroundColor:colors.background.light
    },
    infoContainer: {
        gap:12,
        flex:1,
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        color:colors.text.secondary,
        fontWeight:'600',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
    }
})
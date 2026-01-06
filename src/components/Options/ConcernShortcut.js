import { Animated, Dimensions, Pressable, StyleSheet, View } from "react-native";
import useScalePressAnimation from "../../hooks/useScalePressAnimation";
import DefaultText from "../Text/DefaultText";
import colors from "../../config/colors";
import DefaultStyles from "../../config/styles";
import GradientProgressBar from "../Graphics/SignUp/GradientProgressBar";
import {Ionicons, Entypo} from '@expo/vector-icons'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SkinConcernShortcut = ({
    severity,
    concernName,
    severityInfo,
    onPress,
    customWidth
}) => {

    const onPressExists = !!onPress;
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.9,
        maxScale:1,
        duration:150,
    })

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
        >
            <Animated.View
                style={[
                    styles.container,
                    onPressExists && {
                        transform:[{scale}],
                    },
                    customWidth && {
                        width:customWidth,
                    }
                ]}
            >
                <View
                    style={styles.flexContainer}
                >
                    <DefaultText
                        style={styles.caption}
                    >
                        {concernName}
                    </DefaultText>

                    {onPressExists &&
                        <Entypo
                            name='chevron-right'
                            color={colors.text.darker}
                            size={16}
                            style={{
                                marginLeft:'auto'
                            }}
                        />
                    }
                </View>

                <DefaultText
                    style={styles.title}
                >
                    {severity}
                </DefaultText>

                <GradientProgressBar
                    colorA={severityInfo.color}
                    colorB={severityInfo.color}
                    height={5}
                    progress={severity / 100}
                    backgroundColor='#ddd'
                />
            </Animated.View>
        </Pressable>
    )
}

export default SkinConcernShortcut;

const styles = StyleSheet.create({
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    container: {
        gap:8,
        borderRadius:12,
        backgroundColor:colors.background.light,
        padding:12,
        width:(SCREEN_WIDTH-(DefaultStyles.container.paddingHorizontal*2)-(16))/2,
    },
    caption: {
        fontWeight:'500',
        color:colors.text.darker,
        fontSize:14,
    },
    title: {
        fontWeight:'800',
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.title.medium,
    }
})

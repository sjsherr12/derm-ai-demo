const { default: DefaultText } = require("components/Text/DefaultText");
const { IngredientFunctions } = require("constants/ingredients");
const { useState, useRef } = require("react");
const { Animated, Pressable, View, StyleSheet } = require("react-native");
import {Ionicons} from '@expo/vector-icons'
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import * as Haptics from 'expo-haptics'
import useScalePressAnimation from 'hooks/useScalePressAnimation';

const IngredientScreenIngredientFunctionItem = ({
    functionType
}) => {
    const functionInfo = IngredientFunctions.find((igfnc => igfnc.value === functionType));
    const [textLines, setTextLines] = useState(null)
    const [expanded, setExpanded] = useState(false)
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
    })

    const handlePress = () => {
        if (textLines <= 1) return
        setExpanded(prev => !prev)
    }

    return (
        <Pressable
            onPressIn={textLines > 1 ? handlePressIn : undefined}
            onPressOut={textLines > 1 ? handlePressOut : undefined}
            onPress={handlePress}
            disabled={textLines <= 1}
        >
            <Animated.View
                style={[
                    styles.flexContainer,
                    {transform:[{scale}]}
                ]}
            >
                <View
                    style={{
                        gap:4,
                        flex:1,
                    }}
                >
                    <DefaultText
                        style={styles.smallTitle}
                    >
                        {functionInfo?.title}
                    </DefaultText>

                    <DefaultText
                        style={styles.text}
                        onTextLayout={(e) => {
                            if (textLines === null) {
                                setTextLines(e?.nativeEvent?.lines?.length ?? 1)
                            }
                        }}
                        numberOfLines={textLines === null ? null : (expanded ? null : 1)}
                        ellipsizeMode="tail"
                    >
                        {functionInfo?.description}
                    </DefaultText>
                </View>

                {textLines > 1 && (
                    <Ionicons
                        name={expanded ? 'chevron-down-outline' : 'chevron-forward-outline'}
                        color={colors.text.lighter}
                        size={18}
                    />
                )}
            </Animated.View>
        </Pressable>
    )
}

export default IngredientScreenIngredientFunctionItem;

const styles = StyleSheet.create({
    smallTitle: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        fontWeight:'500'
    },
    flexContainer: {
        gap:12,
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
    },
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
    },
})
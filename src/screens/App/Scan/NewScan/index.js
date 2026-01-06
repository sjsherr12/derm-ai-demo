import { BlurView } from "expo-blur"
import { SafeAreaView, StyleSheet, View, Animated, TouchableWithoutFeedback, Pressable } from "react-native"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import DefaultStyles from "../../../../config/styles"
import DefaultText from "../../../../components/Text/DefaultText"
import IconButton from "../../../../components/Buttons/IconButton"
import colors from "../../../../config/colors"
import { useNavigation } from "@react-navigation/native"
import {Entypo, MaterialCommunityIcons} from '@expo/vector-icons'
import { useEffect, useRef } from "react"
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation"

const options = [
    {
        name: 'Face Scan',
        caption: 'Add a new facial analysis scan',
        to: 'FaceScan',
        icon: <MaterialCommunityIcons
            name='face-recognition'
            color={colors.background.primary}
            size={56}
        />
    },
    {
        name: 'Product Scan',
        caption: 'Get info on any skincare product',
        to: 'ProductScan',
        icon: <MaterialCommunityIcons
            name='cube-scan'
            color={colors.background.primary}
            size={64}
        />
    }
]

const ClickableOption = ({
    option,
    animatedScale
}) => {

    const navigation = useNavigation();

    return (
        <AnimatedPressable
            style={[styles.optionContainer, {
                transform: [{ scale: animatedScale }]
            }]}
            onPress={() => {
                navigation.goBack();
                navigation.navigate(option.to)
            }}
        >
            <View
                style={{
                    width:64,
                    height:64,
                    alignItems:'center',
                    justifyContent:'center'
                }}
            >
                {option.icon}
            </View>

            <DefaultText
                style={styles.caption}
            >
                {option.name}
            </DefaultText>

            <DefaultText
                style={styles.text}
            >
                {option.caption}
            </DefaultText>
        </AnimatedPressable>
    )
}

const NewScanScreen = () => {

    const navigation = useNavigation();

    const scaleAnim1 = useRef(new Animated.Value(0)).current;
    const scaleAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(100),
            Animated.parallel([
                Animated.timing(scaleAnim1, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim2, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ])
        ]).start();
    }, []);

    return (
        <BlurView
            style={{
                flex:1,
            }}
            intensity={25}
            tint='dark'
        >
            <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
                <SafeAreaView
                    style={{
                        flex:1,
                    }}
                >
                    <View
                        style={styles.container}
                    >
                        <View
                            style={styles.flexContainer}
                        >
                            {options.map((option, idx) => (
                                <ClickableOption
                                    key={idx}
                                    option={option}
                                    animatedScale={idx === 0 ? scaleAnim1 : scaleAnim2}
                                />
                            ))}
                        </View>
                    </View>

                    <View
                        style={styles.bottomContainer}
                    >
                        <IconButton
                            onPress={() => navigation.goBack()}
                            color={colors.text.secondary}
                            icon='close'
                            size={32}
                            style={{
                                width:64,
                                height:64,
                                backgroundColor:colors.background.screen,
                                borderRadius:64,
                                boxShadow:'0px 6px 24px rgba(255,255,255,.5)'
                            }}
                        />
                    </View>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </BlurView>
    )
}

export default NewScanScreen;

const styles = StyleSheet.create({
    container: {
        justifyContent:'flex-end',
        gap:16,
        flex:1,
    },
    flexContainer: {
        width:'100%',
        flexDirection:'row',
        gap:16,
        alignItems:'center',
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    bottomContainer: {
        width:'100%',
        alignItems:'center',
        paddingTop:DefaultStyles.container.paddingTop,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'700',
        color:colors.text.secondary,
        textAlign:'center',
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        fontWeight:'500',
        textAlign:'center',
    },
    optionContainer: {
        gap:16,
        flex:1,
        height:'100%',
        paddingHorizontal:8,
        paddingVertical:DefaultStyles.container.paddingHorizontal,
        borderRadius:24,
        boxShadow:'0px 6px 12px rgba(0,0,0,.025)',
        alignItems:'center',
        backgroundColor:colors.background.screen,
        borderWidth:4,
        borderColor:colors.background.primary,
    }
})
import DefaultButton from "components/Buttons/DefaultButton";
import IconButton from "components/Buttons/IconButton";
import FadeScaleView from "components/Containers/FadeScaleView";
import ReadyToGenerateAnimation from "components/Graphics/SignUp/ReadyToGenerate";
import colors from "config/colors";
import SignUpQuestions from "data/SignUpQuestions";
import { Ionicons } from '@expo/vector-icons'
import DefaultText from "components/Text/DefaultText";
import { useAuth } from "context/global/AuthContext";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import { useSignUpFlow } from "../../context/SignUpFlowContext";
import * as Haptics from 'expo-haptics'
import { useNavigation } from "@react-navigation/native";

const { View, StyleSheet, ActivityIndicator, Text } = require("react-native")
const { default: DefaultStyles } = require("../../config/styles")
const { useState, useEffect } = require("react")

const ReadyToGenerateScreen = ({
}) => {
    const navigation = useNavigation();
    const safeAreaStyles = useSafeAreaStyles();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeoutId = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timeoutId);
    }, []);

    if (loading) {
        return (
            <View style={[DefaultStyles.container, styles.loadingContainer]}>
                <ActivityIndicator size='large' />
            </View>
        )
    }
    
    return (
        <View style={[DefaultStyles.outer, safeAreaStyles.safeAreaAll]}>
            <FadeScaleView style={styles.container}>
                <View
                    style={styles.topContainer}
                >
                    <IconButton
                        style={styles.backIconButton}
                        onPress={() => navigation.goBack()}
                    />
                </View>
                <View style={styles.completeAnimation}>
                    <ReadyToGenerateAnimation />
                </View>

                <View style={styles.textContainer}>

                    <DefaultText
                        style={styles.caption}    
                    >
                        All done 👍
                    </DefaultText>

                    <DefaultText
                        style={styles.title}    
                    >
                        Let’s create your skincare plan!
                    </DefaultText>
                </View>

                <View style={styles.bottomContainer}>
                    <DefaultButton
                        isActive
                        onPress={() => navigation.replace('GeneratePlan')}
                        title='Continue'
                        style={{
                            borderRadius:64,
                        }}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    />
                </View>
            </FadeScaleView>
        </View>
    )
}

export default ReadyToGenerateScreen;

const styles = StyleSheet.create({
    container: {
        flex:1,
        paddingTop:DefaultStyles.container.paddingTop,
        backgroundColor:colors.background.screen
    },
    topContainer: {
        paddingHorizontal:24,
    },
    loadingContainer: {
        alignItems:'center',
        justifyContent:'center',
    },
    textContainer: {
        gap:30,
        flex:1,
        paddingHorizontal:24,
    },
    backIconButton: {
        width:44,
        height:44,
        backgroundColor:colors.background.light,
    },
    completeAnimation: {
        marginTop:94,
        marginBottom:32,
        alignItems:'center',
        justifyContent:'center',
    },
    title: {
        fontSize: DefaultStyles.text.title.large,
        color:colors.text.secondary,
        textAlign:'center',
        fontWeight:600,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.large,
        color:colors.text.darker,
        textAlign:'center',
        fontWeight:500,
    },
    bottomContainer: {
        padding:DefaultStyles.container.paddingHorizontal,
        boxShadow:'0px -75px 60px rgba(0,0,0,.01)',
        borderTopWidth: 1.5,
        borderTopColor:colors.background.light,
    },
})
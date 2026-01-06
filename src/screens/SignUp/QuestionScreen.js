import { StyleSheet, View, Text, Animated, ScrollView, Button, Alert } from "react-native";
import DefaultButton from "../../components/Buttons/DefaultButton";
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import DefaultStyles from "../../config/styles";
import { useSignUpFlow } from "../../context/SignUpFlowContext";
import IconButton from "../../components/Buttons/IconButton";
import colors from "../../config/colors";
import { useRoute } from "@react-navigation/native";
import SignUpQuestions from "../../data/SignUpQuestions";
import { useEffect, useRef, memo } from "react";
import * as Haptics from 'expo-haptics'
import ConditionalScrollView from "../../components/Containers/ConditionalScrollView";
import FadeScaleView from "components/Containers/FadeScaleView";
import DefaultText from "components/Text/DefaultText";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";

const QuestionScreen = ({
    navigation
}) => {

    const route = useRoute();
    const safeAreaStyles = useSafeAreaStyles();

    const {
        answers,
        progress,
        diagnosis,
        setCurrentQuestionIndex,
    } = useSignUpFlow();

    const totalQuestions = SignUpQuestions.length;
    const currentQuestionIndex = SignUpQuestions.findIndex((question => question.id === route?.name));
    const currentQuestion = currentQuestionIndex !== -1 ? SignUpQuestions[currentQuestionIndex] : SignUpQuestions[0];
    const previousQuestionID = currentQuestionIndex > 0 ? SignUpQuestions[currentQuestionIndex-1].id : 'Introduction';
    const nextQuestionID = currentQuestionIndex < totalQuestions - 1 ? SignUpQuestions[currentQuestionIndex+1].id : diagnosis ? 'GeneratedPlan' : 'ReadyToGenerate'

    const animatedWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    useEffect(() => {
        setCurrentQuestionIndex(currentQuestionIndex);
    }, [route])

    return (
        <View style={[DefaultStyles.outer, safeAreaStyles.safeAreaAll]}>
            <View style={styles.container}>
                <View style={styles.topContainer}>
                    <IconButton 
                        onPress={() => navigation.replace(previousQuestionID)}
                        style={styles.iconButton}
                        iconComponent={<FontAwesome6 name="arrow-left" size={18} color="black" />}
                    />
                    <View
                        style={styles.progressBar}
                    >
                        <Animated.View style={[styles.progressBarFill, { width: animatedWidth }]} />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <DefaultText style={styles.title}>{currentQuestion.title}</DefaultText>
                    <DefaultText style={styles.description}>{currentQuestion.description}</DefaultText>
                </View>

                <View style={{flex:1}}>
                    <ConditionalScrollView
                        contentContainerStyle={styles.scrollViewContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.optionsContainer}>
                            <currentQuestion.Type question={currentQuestion} />
                        </View>
                    </ConditionalScrollView>

                    {currentQuestion?.Bottom ?
                        <currentQuestion.Bottom />
                        :
                        <View style={styles.bottomContainer}>
                            <DefaultButton
                                isActive
                                disabled={
                                    !currentQuestion?.notRequired &&
                                    (
                                        answers[currentQuestion.id] == null ||
                                        (Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].length === 0)
                                    )
                                }
                                title='Continue'
                                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                onPress={() => {
                                    navigation.replace(nextQuestionID)
                                }}
                                style={{
                                    borderRadius:64,
                                }}
                            />
                        </View>
                    }
                </View>
            </View>
        </View>
    )
}

export default memo(QuestionScreen);

const styles = StyleSheet.create({
    container: {
        flex:1,
        gap:16,
        paddingTop:DefaultStyles.container.paddingTop,
        backgroundColor:colors.background.screen,
    },
    title: {
        fontSize:DefaultStyles.text.title.medium,
        fontWeight:'600', 
        lineHeight:42,
    },
    description: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'400',
        lineHeight: 22,
    },
    topContainer: {
        gap:16,
        display:'flex',
        alignItems:'center',
        flexDirection:'row',
        width:'100%',
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    textContainer: {
        width:'100%',
        gap:14,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        marginBottom:16,
    },
    scrollViewContainer: {
        alignItems:'center',
        flexGrow:1,
    },
    optionsContainer: {
        gap:16,
        flex:1,
        width:'100%',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding:DefaultStyles.container.paddingHorizontal,
        paddingTop:0,
    },
    bottomContainer: {
        padding:DefaultStyles.container.paddingHorizontal,
        boxShadow:'0px -75px 60px rgba(0,0,0,.01)',
        borderTopWidth: 1.5,
        borderTopColor:colors.background.light,
    },
    iconButton: {
        width:44,
        height:44,
        backgroundColor:colors.background.light,
    },
    progressBar: {
        flex:1,
        height:4,
        backgroundColor:colors.background.light,
        borderRadius:8,
        overflow:'hidden',
    },
    progressBarFill: {
        height:'100%',
        backgroundColor:colors.background.primary,
        borderRadius:8,
    },
})
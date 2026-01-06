import DefaultButton from "components/Buttons/DefaultButton"
import colors from "config/colors"
import { useAuth } from "context/global/AuthContext"
import { useData } from "context/global/DataContext"
import { useSignUpFlow } from "context/SignUpFlowContext"
import SignUpQuestions from "data/SignUpQuestions"
import * as Haptics from 'expo-haptics'
import { doc, setDoc, updateDoc } from "firebase/firestore"
import { useCallback, useEffect, useMemo, useState } from "react"
import { db } from "services/firebase/firebase"
import { setNestedProperty } from "utils/objects"
import { getNestedProperty } from "utils/objects"
const { default: DefaultStyles } = require("config/styles")
const { View, SafeAreaView, ScrollView, StyleSheet } = require("react-native")
const { default: ProfileQuestionScreenHeader } = require("./header")
const { useRoute, useNavigation } = require("@react-navigation/native")
const { default: ConditionalScrollView } = require("components/Containers/ConditionalScrollView")
const { default: DefaultText } = require("components/Text/DefaultText")

const ProfileQuestionScreen = ({

}) => {

    const route = useRoute();
    const navigation = useNavigation();
    const {user} = useAuth();
    const {question} = route?.params;
    const {
        userData,
        setUserData
    } = useData();
    const [saving, setSaving] = useState(false)

    const {
        answers,
        answerCurrent,
        setCurrentQuestionIndex
    } = useSignUpFlow();

    const currentlySetValue = useMemo(
        () => getNestedProperty(userData, question.field),
        [question, userData]
    )

    const currentQuestionIndex = useMemo(
        () => SignUpQuestions.findIndex((q => q.id === question.id)),
        [question]
    )
    
    const canSave = useMemo(
        () => currentlySetValue !== answers?.[question.id],
        [currentlySetValue, answers, question.id]
    )

    const handleSave = useCallback(async () => {
        setSaving(true)

        const newlySetValue = answers?.[question.id];

        // Convert dot notation field path to nested object for Firebase
        const updateData = {};
        const keys = question.field.split('.');
        let current = updateData;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = newlySetValue;

        await setDoc(
            doc(db, `/users/${user?.uid}`),
            updateData,
            {merge:true}
        );

        setUserData(prev => setNestedProperty(prev, question.field, newlySetValue));

        navigation.goBack();

        setSaving(false)
    }, [question, answers, user?.uid, navigation, setUserData])

    useEffect(() => {
        setCurrentQuestionIndex(currentQuestionIndex)
        answerCurrent(question.id, currentlySetValue)
    }, [question])

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <View style={styles.container}>
                    <ProfileQuestionScreenHeader />

                    <View style={styles.textContainer}>
                        <DefaultText style={styles.title}>{question.title}</DefaultText>
                        <DefaultText style={styles.description}>{question.description}</DefaultText>
                    </View>

                    <View style={{flex:1}}>
                        <ConditionalScrollView
                            contentContainerStyle={styles.scrollViewContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.optionsContainer}>
                                <question.Type question={question} />
                            </View>
                        </ConditionalScrollView>

                        <View style={styles.bottomContainer}>
                            <DefaultButton
                                isActive
                                title='Save'
                                disabled={!canSave || saving}
                                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                onPress={handleSave}
                                style={{
                                    borderRadius:64,
                                }}
                            />
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default ProfileQuestionScreen;

const styles = StyleSheet.create({
    container: {
        flex:1,
        gap:16,
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
        borderTopWidth: 1,
        borderTopColor:colors.background.light,
    },
})
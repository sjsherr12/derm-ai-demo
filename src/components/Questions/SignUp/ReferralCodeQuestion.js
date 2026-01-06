import { Alert, StyleSheet, View } from "react-native";
import { useSignUpFlow } from "../../../context/SignUpFlowContext";
import { useEffect, useMemo, useState } from "react";
import DefaultTextInput from "../../Text/DefaultTextInput";
import colors from "../../../config/colors";
import DefaultStyles from "../../../config/styles";
import DefaultButton from "../../Buttons/DefaultButton";
import { useNavigation } from "@react-navigation/native";
import SignUpQuestions from "../../../data/SignUpQuestions";
import { addDoc, collection, doc, getDoc, getDocs, limit, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { db } from "../../../services/firebase/firebase";
import { useAuth } from "../../../context/global/AuthContext";
import { ReferralStatus } from "../../../constants/signup";
import * as Haptics from 'expo-haptics'

export const ReferralCodeQuestionBottom = ({

}) => {

    const navigation = useNavigation();
    const {
        answers, 
        diagnosis,
        answerCurrent
    } = useSignUpFlow();
    const {user} = useAuth();
    const [verifying, setVerifying] = useState(false)

    const totalQuestions = SignUpQuestions.length;
    const currentQuestionId = 'ReferralCodeQuestion'
    const currentQuestionIndex = useMemo(
        () => SignUpQuestions.findIndex((q => q.id === currentQuestionId)), []
    )
    const nextQuestionID = useMemo(
        () => currentQuestionIndex < totalQuestions - 1 ? SignUpQuestions[currentQuestionIndex+1].id : diagnosis ? 'GeneratedPlan' : 'ReadyToGenerate',
        [diagnosis]
    )

    const canEditReferralCode = !answers?.[currentQuestionId]?.verified
    const enteredCode = answers?.[currentQuestionId]?.code;

    const validCode = useMemo(
        () => enteredCode?.length >= 6,
        [enteredCode]
    )

    const handleVerifyCode = async () => {
        if (validCode) {
            setVerifying(true);

            const influencerCodesRef = collection(db, 'influencerCodes');
            const referralCodesRef = collection(db, 'referralCodes')

            const [influencerCodeSnapshot, referralCodeSnapshot] = await Promise.all([
                getDocs(query(influencerCodesRef, where('code', '==', enteredCode), limit(1))),
                getDocs(query(referralCodesRef, where('code', '==', enteredCode), limit(1)))
            ]);

            let referrerData = null;

            if (!influencerCodeSnapshot.empty) {
                referrerData = influencerCodeSnapshot.docs[0].data();
            } else if (!referralCodeSnapshot.empty) {
                referrerData = referralCodeSnapshot.docs[0].data();
            }

            const isEnteredCodeInfluencerCode = !influencerCodeSnapshot.empty;

            if (referrerData) {
                answerCurrent(currentQuestionId, {
                    verified:true,
                    code: enteredCode,
                })

                Alert.alert(
                    'Referral claimed!',
                    `Congratulations! We found the referral code you entered.${isEnteredCodeInfluencerCode ? ` This code will get you a ${referrerData?.discountPercent ? referrerData?.discountPercent + '% ' : ''}discount on your first subscription.` : ''}`
                )
            } else {
                Alert.alert(
                    'Code not found',
                    'We could not find the referral code you entered. Please double-check you entered the right code.'
                )
            }

            setVerifying(false)
        } else {
            Alert.alert(
                'Invalid code',
                'The code you entered is invalid.'
            )
        }
    }

    const handleConfirmVerifyCode = async () => {
        Alert.alert(
            'Enter Code?',
            `Are you sure you want to enter this code (${enteredCode})? Once you enter a valid code, you cannot change it.`,
            [
                {
                    text:'Enter',
                    style:'default',
                    onPress:handleVerifyCode
                },
                {
                    text:'Cancel',
                    style:'cancel'
                }
            ]
        )    
    }

    const renderOptions = () => canEditReferralCode ? (
        <>
            <DefaultButton
                isActive
                title='Skip'
                onPress={() => navigation.navigate(nextQuestionID)}
                style={{
                    flex:.5,
                    borderRadius:64,
                }}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
            />
            <DefaultButton
                isActive
                title='Verify'
                disabled={!validCode}
                onPress={handleConfirmVerifyCode}
                style={{
                    flex:.5,
                    borderRadius:64,
                }}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
            />
        </>
    ) : (
        <DefaultButton
            isActive
            title='Continue'
            onPress={() => navigation.navigate(nextQuestionID)}
            style={{
                borderRadius:64,
            }}
            hapticType={Haptics.ImpactFeedbackStyle.Soft}
        />
    )

    return (
        <View
            style={bottomStyles.container}
        >
            {renderOptions()}
        </View>
    )
}

const ReferralCodeQuestion = ({ question }) => {
    const { answers, answerCurrent } = useSignUpFlow();
    const [referralCode, setReferralCode] = useState(answers?.[question.id]?.code || '');

    const canEditReferralCode = !answers?.[question.id]?.verified

    const handleTextChange = (text) => {
        // Only allow letters, convert to uppercase, max 6 characters
        const filteredText = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
        setReferralCode(filteredText);
        answerCurrent(question.id, {
            code: filteredText,
            verified: false,
        })
    };

    return (
        <View style={styles.container}>
            <DefaultTextInput
                editable={canEditReferralCode}
                style={styles.textInput}
                placeholder="Referral Code"
                value={referralCode}
                onChangeText={canEditReferralCode ? handleTextChange : null}
                autoCapitalize="characters"
                autoCorrect={false}
            />
        </View>
    );
};

export default ReferralCodeQuestion;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        backgroundColor: colors.background.light,
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 20,
        fontSize: 16,
        color: colors.text.secondary,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.accents.stroke,
    }
});

const bottomStyles = StyleSheet.create({
    container: {
        padding:DefaultStyles.container.paddingHorizontal,
        flexDirection:'row',
        alignItems:'center',
        gap:16,
        boxShadow:'0px -75px 60px rgba(0,0,0,.01)',
        borderTopWidth: 1,
        borderTopColor:colors.background.light,
    }
})
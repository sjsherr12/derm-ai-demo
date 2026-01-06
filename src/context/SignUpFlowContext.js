import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import SignUpQuestions from '../data/SignUpQuestions';
import { useRoute } from '@react-navigation/native';
import { Animated } from 'react-native';

// const debugDiagnosisDataObject = {
//     diagnosis: "Mild comedonal acne with slight redness and uneven skin tone.",
//     summary: "The skin exhibits mild comedonal acne primarily on the cheeks, with some redness and uneven tone. There is noticeable oiliness, particularly in the T-zone, but overall skin hydration appears adequate. Dark circles are moderately visible, suggesting some periorbital pigmentation.",
//     severities: {
//         acne: 72,
//         aging: 80,
//         darkCircles: 60,
//         dryness: 75,
//         oiliness: 58,
//         overall: 68,
//         pores: 70,
//         redness: 65,
//         tone: 62
//     },
//     routineRecommendations: [
//         '0U1FiP94WHmKPwdHSLdJ',
//         'vw93rWywb8Mbk2pd26BS',
//         'Zvk0DMBFcVAkOrCO78qo',
//         'NoMvupuSGSKNr8MWGzhp',
//         'e71bUR7v6Pt2uJlg4Ypg',
//         'Zvk0DMBFcVAkOrCO78qo',
//         '1PP0hjoYdUzAXZM1SrJs',
//         'dgTXO7bhStBC1puLQWP1',
//         'eob18SU26COU34j7VQe0',
//         'YTmDSkkngTmfjw6G0zzM',
//         'mJ19CnhRlYiv46Ip6mwN',
//         'bFD1qEDFqpWo5AANni2q'
//     ]
// }

const SignUpFlowContext = createContext(null)

export const SignUpFlowProvider = ({
    children
}) => {
    const [answers, setAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [diagnosis, setDiagnosis] = useState(null);

    const totalQuestions = SignUpQuestions.length;

    const progress = useRef(new Animated.Value((currentQuestionIndex) / totalQuestions)).current;

    const answerCurrent = (
        currentQuestionId,
        response,
    ) => {
        setAnswers((prev) => ({
            ...prev,
            [currentQuestionId]: response,
        }));
    }

    useEffect(() => {
        const toValue = (currentQuestionIndex + 1) / totalQuestions;

        Animated.timing(progress, {
            toValue,
            duration: 200, // adjust duration as needed
            useNativeDriver: false, // must be false for width animation
        }).start();
    }, [currentQuestionIndex, totalQuestions])

    return (
        <SignUpFlowContext.Provider value={{
            diagnosis,
            setDiagnosis,
            answers,
            setAnswers,
            progress,
            answerCurrent,
            setCurrentQuestionIndex,
        }}>
            {children}
        </SignUpFlowContext.Provider>
    );
};

export const useSignUpFlow = () => {
    const ctx = useContext(SignUpFlowContext);
    if (ctx) {
        return ctx;
    }
}
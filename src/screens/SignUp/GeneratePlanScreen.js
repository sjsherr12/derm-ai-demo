import FadeScaleView from "components/Containers/FadeScaleView";
import GradientProgressBar from "components/Graphics/SignUp/GradientProgressBar"
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { useEffect, useState, useRef, memo } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import {Ionicons} from '@expo/vector-icons'
import { lighten } from "utils/lighten";
import { PreviewGeneratorSteps } from "constants/signup";
import * as Haptics from 'expo-haptics'
import { useSignUpFlow } from "context/SignUpFlowContext";
import DefaultText from "components/Text/DefaultText";
import { httpsCallable } from 'firebase/functions';
import { functions } from "services/firebase/firebase";
import Constants from 'expo-constants';
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import { signInAnonymously } from 'firebase/auth';
import { auth } from "services/firebase/firebase";
import { setupNotifications } from "../../services/notifications";
import ProgressSpinner from "../../components/Common/ProgressSpinner";

const GeneratePlanScreen = ({
    navigation
}) => {
    const safeAreaStyles = useSafeAreaStyles();

    const {diagnosis, setDiagnosis, answers} = useSignUpFlow();
    const [percentComplete, setPercentComplete] = useState(0);
    const intervalRef = useRef(null);
    const [isComplete, setIsComplete] = useState(false);
    const hasStartedProcessing = useRef(false);

    const checkboxPoints = PreviewGeneratorSteps.slice(0,5)
    const spinnerPoints = PreviewGeneratorSteps.slice(5, 11)
    const dots = Array.from({length:(percentComplete)%4}).map((_) => '.')

    // Call createUserAccount first, then processFaceScan when component mounts
    useEffect(() => {
        const processSignUp = async () => {
            // Prevent multiple executions due to auth state changes
            if (hasStartedProcessing.current) {
                return;
            }
            hasStartedProcessing.current = true;
            
            // Check if we have scan data in answers
            const scanData = answers['ScanPhotosQuestion'];
            if (!scanData || !scanData.front || !scanData.left || !scanData.right) {
                console.error('No scan data found in signup answers');
                return;
            }

            try {
                const userCredential = await signInAnonymously(auth);

                // First create the user account with signup data only
                const createUserAccountFunction = httpsCallable(functions, 'createUserAccount');
                const accountResult = await createUserAccountFunction({
                    signUpData: answers
                    // No diagnosis data - that will come from processFaceScan
                });

                if (!accountResult?.data?.success) {
                    throw new Error(accountResult?.data?.message ?? 'Failed to create user account');
                }

                try {
                    await setupNotifications(userCredential.user.uid)
                } catch {
                    // silently fail, cannot compromise sign up for this
                }
                
                console.log('User account created successfully, now processing face scan...');

                // Now process the face scan with the authenticated user account
                const processFaceScanFunction = httpsCallable(functions, 'processFaceScan');
                const result = await processFaceScanFunction({
                    imageData: {
                        front: `data:image/jpeg;base64,${scanData.front}`,
                        left: `data:image/jpeg;base64,${scanData.left}`,
                        right: `data:image/jpeg;base64,${scanData.right}`
                    },
                });
                
                if (result.data.success && result.data.diagnosis) {
                    console.log('processFaceScan completed successfully');
                    setDiagnosis(result.data.diagnosis);
                }
            } catch (error) {
                console.error('Error in signup process:', error);
                // silently fail, dont want to risk losing users.
            } finally {
                setIsComplete(true)
            }
        };

        processSignUp();
    }, []); // Empty dependency array - run only once on mount

    useEffect(() => {
        // Start progress animation immediately
        if (percentComplete < 100) {
            const intervalTiming = Math.random() * (percentComplete < 50 ? 250 : 500) + 250; // Random interval between 250-600ms
            intervalRef.current = setInterval(() => {
                setPercentComplete(prev => {
                    // If not complete yet and approaching 99%, stall at 99%
                    if (!isComplete && prev >= 99) {
                        return 99; // Stall at 99% until completion
                    }
                    
                    // If complete, continue to 100%
                    if (isComplete) {
                        const newValue = prev + 1;
                        return newValue > 100 ? 100 : newValue;
                    }
                    
                    // Normal progression
                    const newValue = prev + 1;
                    // Don't exceed 99% until completion
                    return newValue > 99 ? 99 : newValue;
                });
            }, intervalTiming);
        } else {
            // Clear interval when at 100%
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isComplete, percentComplete]);

    useEffect(() => {
        if (percentComplete < 50) {
            const stepLength = 50 / checkboxPoints.length; // 10% per checkbox
            const moveOn = Math.floor(percentComplete / stepLength) === (percentComplete/stepLength)

            if (moveOn) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
        } else {
            // For spinners, trigger haptic when each item completes (every ~8.33%)
            const progressPerItem = 50 / 6;
            const itemsCompleted = Math.floor((percentComplete - 50) / progressPerItem);
            const prevItemsCompleted = Math.floor((percentComplete - 50 - 1) / progressPerItem);

            if (itemsCompleted > prevItemsCompleted && itemsCompleted <= 6) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
        }

        if (percentComplete === 100 && diagnosis) { // generation complete and diagnosis ready, move on
            navigation.replace('GeneratedPlan')
        }
    }, [percentComplete, diagnosis]);

    return (
        <View style={[DefaultStyles.outer, safeAreaStyles.safeAreaAll]}>
            <View style={DefaultStyles.container}>
                <View
                    style={styles.topContainer}
                >
                    <DefaultText
                        style={styles.title}
                    >
                        Generating your custom skincare routine ({percentComplete}%)
                    </DefaultText>
                </View>

                <FadeScaleView
                    key={percentComplete < 50}
                    style={styles.contentContainer}
                >
                    {percentComplete < 50 ? (
                        <View
                            style={styles.checkboxContainer}
                        >
                            {checkboxPoints.map((point, idx) => {
                                const complete = percentComplete >= (idx+1)*10
                                return (
                                    <View
                                        key={idx}
                                        style={styles.checkboxPoint}
                                    >
                                        <DefaultText
                                            style={{
                                                ...styles.checkboxText,
                                                fontWeight:complete ? '600' : '400'
                                            }}
                                        >
                                            {point}{complete ? '' : dots}
                                        </DefaultText>

                                        <Ionicons
                                            name={complete ? 'checkmark-circle' : 'ellipse-outline'}
                                            size={24}
                                            color={complete ? colors.background.primary : colors.text.secondary}
                                        />
                                    </View>
                                )
                            })}
                        </View>
                    ) : (
                        <View
                            style={styles.spinnerColumns}
                        >
                            {spinnerPoints.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={styles.spinnerRow}
                                >
                                    {spinnerPoints.slice(idx*2, (idx*2)+2).map((point, index) => {
                                        const itemIndex = idx * 2 + index; // 0-5
                                        const progressPerItem = 50 / 6; // ~8.33% of overall progress per item
                                        const itemStartPercent = 50 + (itemIndex * progressPerItem);

                                        const progress = Math.min(
                                            100,
                                            Math.max(0, ((percentComplete - itemStartPercent) / progressPerItem) * 100)
                                        );
                                        const complete = progress === 100;
                                        return (
                                            <View
                                                key={index}
                                                style={styles.spinnerContainer}
                                            >
                                                <ProgressSpinner
                                                    progress={progress}
                                                    size={100}
                                                />

                                                <DefaultText
                                                    style={{
                                                        ...styles.spinnerCaption,
                                                        fontWeight:complete ? '600' : '400'
                                                    }}
                                                >
                                                    {point}{complete ? '' : '...'}
                                                </DefaultText>
                                            </View>
                                        )
                                    })}
                                </View>
                            ))}
                        </View>
                    )}
                </FadeScaleView>

                <GradientProgressBar progress={percentComplete/100}/>
            </View>
        </View>
    )
}

export default memo(GeneratePlanScreen);

const styles = StyleSheet.create({
    title: {
        fontSize:DefaultStyles.text.title.small,
        fontFamily:'HedvigLettersSerif',
        color:colors.text.dark,
        textAlign:'center',
    },
    textContainer: {
        gap:12,
    },
    contentContainer: {
        flex:1,
        justifyContent:'center',
    },
    topContainer: {
        width:'100%',
        paddingVertical:DefaultStyles.container.paddingTop,
    },
    checkboxContainer: {
        gap:16,
        width:'100%',
    },
    progressPercentage: {
        fontSize:75,
        fontWeight:'bold',
        textAlign:'center',
        color:colors.text.secondary,
    },
    progressCaption:{
        fontSize:18,
        fontWeight:500,
        textAlign:'center',
    },
    step: {
        flexDirection:'row',
        alignItems:'center',
        gap:8,
    },
    checkboxPoint: {
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
        justifyContent:'space-between',
        padding:DefaultStyles.container.paddingHorizontal,
        backgroundColor:colors.background.light,
        borderRadius:12,
    },
    checkboxText: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.darker,
    },
    spinnerColumns: {
        gap:16,
    },
    spinnerRow: {
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        gap:16,
        width:'100%',
    },
    spinnerContainer: {
        gap:16,
        alignItems:'center',
        flex:1,
        backgroundColor:colors.background.light,
        paddingVertical:DefaultStyles.container.paddingBottom,
        borderRadius:12,
    },
    spinnerCaption: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
        textAlign:'center'
    }
})
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { CameraView } from "expo-camera";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Alert, Animated, Image, Pressable, StyleSheet, View, ActivityIndicator, TextInput, ScrollView, TouchableWithoutFeedback, Platform, KeyboardAvoidingView, Keyboard, Modal } from "react-native";
import * as Haptics from 'expo-haptics'
import {Ionicons, FontAwesome6, FontAwesome, Octicons} from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import IconButton from "components/Buttons/IconButton";
import { useNavigation } from "@react-navigation/native";
import { darken } from "utils/darken";
import { useAuth } from 'context/global/AuthContext';
import { useData } from 'context/global/DataContext';
import useAnalysisLoader from 'context/global/useAnalysisLoader';
import { prepareImageForFirebase } from 'utils/images';
import BlurredIconButton from "components/Buttons/BlurredIconButton";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignUpFlow } from "../../../../context/SignUpFlowContext";
import SignUpQuestions from "../../../../data/SignUpQuestions";
import { SkinConcerns } from "../../../../constants/signup";
import DefaultTextInput from "../../../../components/Text/DefaultTextInput";
import DefaultButton from "../../../../components/Buttons/DefaultButton";
import { lighten } from "../../../../utils/lighten";

const ScanScreenTakePhoto = ({
    isSignUp
}) => {

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { user } = useAuth();
    const {answerCurrent} = useSignUpFlow();
    const {
        setMostRecentDiagnosis,
        additionalNotes,
        queueFaceScanProcessing,
        hasPendingScan
    } = useData();
    const { refreshAnalysisData, checkScanEligibility } = useAnalysisLoader();

    // Photo state management
    const [photos, setPhotos] = useState({ left: null, front: null, right: null });

    const { handlePressIn: handlePhotoPress, handlePressOut: handlePhotoRelease, scale: photoScale } = useScalePressAnimation({
        minScale: 0.95,
        maxScale: 1,
    });

    const [currentScanIndex, setCurrentScanIndex] = useState(0);
    const [snapping, setSnapping] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [scanEligibility, setScanEligibility] = useState(null);
    const [checkingEligibility, setCheckingEligibility] = useState(true);
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [slideAnimation] = useState(new Animated.Value(0));
    const [transitionFlash] = useState(new Animated.Value(0));
    const [showFinalApproval, setShowFinalApproval] = useState(false);
    const cameraRef = useRef(null);

    const scanTypes = ['front', 'left', 'right'];
    const currentScanType = scanTypes[currentScanIndex];
    const snappingDisabled = !cameraReady || snapping || !scanEligibility?.canScan || (hasPendingScan && !isSignUp)


    const handleTakePhoto = async () => {
        if (cameraRef.current && cameraReady) {
            try {
                setSnapping(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });
                setPhotos(prev => ({ ...prev, [currentScanType]: photo?.uri }))

                // Trigger white flash animation
                Animated.sequence([
                    // Flash in
                    Animated.timing(transitionFlash, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                    // Flash out
                    Animated.timing(transitionFlash, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                    })
                ]).start();

                // Auto-progress to next scan or final approval (with slight delay for flash)
                Animated.timing(slideAnimation, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    slideAnimation.setValue(0);
                    const nextIndex = currentScanIndex + 1;
                    if (nextIndex >= scanTypes.length) {
                        setShowFinalApproval(true);
                    } else {
                        setCurrentScanIndex(nextIndex);
                    }
                });
            } catch (error) {
                Alert.alert('Error taking photo:', error);
            } finally {
                setSnapping(false)
            }
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.goBack();
    };

    const getScanTitle = () => {
        if (processing) return 'Processing Scan...';
        if (showFinalApproval) return 'Final Review';
        if (checkingEligibility) return 'Loading...';
        if (hasPendingScan && !isSignUp) return 'Processing Previous Scan';
        if (!scanEligibility?.canScan) return 'Scan Unavailable';

        const scanTitles = {
            front: 'Front Facing Scan',
            left: 'Left Side Scan',
            right: 'Right Side Scan'
        };

        return scanTitles[currentScanType];
    };
    
    const title = getScanTitle();

    const handleInfoAlert = useCallback(() => {
        let description = '';

        if (processing) {
            if (scanEligibility?.isFirstScan) {
                description = 'Our AI is performing your first comprehensive skin analysis. This advanced technology examines your skin for acne, pigmentation, redness, and other concerns. Results will be available shortly.';
            } else {
                description = 'Please wait while we analyze your skin. This may take a few moments...';
            }
        } else if (hasPendingScan && !isSignUp) {
            description = 'Another scan is currently being processed. Please wait for it to complete before starting a new scan. You can continue using the app while processing.';
        } else if (showFinalApproval) {
            if (scanEligibility?.isFirstScan) {
                description = 'Perfect! You\'ve captured all three angles needed for comprehensive analysis. Review your photos - they should be well-lit and show your skin clearly. Tap the checkmark to start your first analysis or the restart button if you\'d like to retake any photos.';
            } else {
                description = 'Review your three face scans. If everything looks good, tap the checkmark to proceed with analysis. Otherwise, tap the restart button to begin again.';
            }
        } else if (checkingEligibility) {
            description = 'Checking scan availability...';
        } else if (!scanEligibility?.canScan) {
            description = scanEligibility?.message || 'Scan not available at this time.';
        } else {
            const scanInstructions = {
                front: 'Face the camera directly and capture your front view. Center your face in the frame.',
                left: 'Turn your head to the left and capture your left profile. Make sure your left side is clearly visible.',
                right: 'Turn your head to the right and capture your right profile. Make sure your right side is clearly visible.'
            };

            const firstTimeInstructions = {
                front: 'For comprehensive skin analysis, we need three angles of your face. First, face the camera directly - this helps us analyze your forehead, cheeks, nose, and chin area comprehensively.',
                left: 'Now turn your head to the left for your side profile. This angle helps us examine the left side of your face for acne, texture, and discoloration patterns.',
                right: 'Finally, turn your head to the right for the last angle. This completes the 360-degree view needed to detect skin concerns across your entire face and create personalized recommendations.'
            };

            if (scanEligibility?.isFirstScan) {
                description = firstTimeInstructions[currentScanType];
            } else {
                description = `Time for your comprehensive skin analysis! ${scanInstructions[currentScanType]}`;
            }
        }

        Alert.alert(title, description);
    }, [processing, checkingEligibility, scanEligibility, showFinalApproval, currentScanType, title])

    const handleSelectFromCameraRoll = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setPhotos(prev => ({ ...prev, [currentScanType]: result.assets[0].uri }));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to select image from camera roll');
        }
    };

    const toggleFlash = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFlashEnabled(prev => !prev);
    };

    const handleRestart = () => {
        Alert.alert(
            'Restart Scan Process',
            'Are you sure you want to restart? This will delete all your current photos and start over.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Restart',
                    style: 'destructive',
                    onPress: () => {
                        setPhotos({ left: null, front: null, right: null });
                        setCurrentScanIndex(0);
                        setShowFinalApproval(false);
                        slideAnimation.setValue(0);
                    }
                }
            ]
        );
    };

    const processFaceScan = async () => {
        const { left, front, right } = photos;
        if (!left || !front || !right) {
            Alert.alert('Error', 'All photos missing');
            return;
        }

        // Check for user only if not in sign-up flow
        if (!isSignUp && !user) {
            Alert.alert('Error', 'User information missing');
            return;
        }

        try {
            setProcessing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Handle sign-up flow differently
            if (isSignUp) {
                // Convert all photo URIs to base64
                const leftBase64 = await prepareImageForFirebase(left, {
                    quality: 0.9,
                    maxWidth: 1024,
                    maxHeight: 1024
                });
                const frontBase64 = await prepareImageForFirebase(front, {
                    quality: 0.9,
                    maxWidth: 1024,
                    maxHeight: 1024
                });
                const rightBase64 = await prepareImageForFirebase(right, {
                    quality: 0.9,
                    maxWidth: 1024,
                    maxHeight: 1024
                });

                // Store base64 data in sign-up flow context
                answerCurrent('ScanPhotosQuestion', {
                    front: frontBase64,
                    left: leftBase64,
                    right: rightBase64
                });

                navigation.goBack();
                return;
            }

            // Normal app flow - queue for background processing
            queueFaceScanProcessing(photos, additionalNotes);

            // Navigate back immediately so user can continue using the app
            navigation.goBack();

        } catch (error) {
            console.error('Error queueing face scan:', error);
            setProcessing(false);

            Alert.alert(
                'Error',
                'Failed to queue scan for processing. Please try again.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setProcessing(false);
                        }
                    }
                ]
            );
        }
    };

    // Check scan eligibility when component mounts - only run once
    useEffect(() => {
        let isMounted = true;

        const checkEligibility = async () => {
            // Skip eligibility check for sign-up flow
            if (isSignUp) {
                if (isMounted) {
                    setScanEligibility({
                        canScan: true,
                        isFirstScan: true
                    });
                    setCheckingEligibility(false);
                }
                return;
            }

            // Block scanning if there's a pending scan
            if (hasPendingScan) {
                if (isMounted) {
                    setScanEligibility({
                        canScan: false,
                        message: 'Please wait for the current scan to complete before starting a new one.'
                    });
                    setCheckingEligibility(false);
                }
                return;
            }

            if (user && isMounted) {
                try {
                    setCheckingEligibility(true);
                    const eligibility = await checkScanEligibility();
                    if (isMounted) {
                        setScanEligibility(eligibility);
                    }
                } catch (error) {
                    console.error('Error checking scan eligibility:', error);
                    if (isMounted) {
                        setScanEligibility({
                            canScan: false,
                            message: 'Error checking scan availability. Please try again.'
                        });
                    }
                } finally {
                    if (isMounted) {
                        setCheckingEligibility(false);
                    }
                }
            }
        };

        checkEligibility();

        return () => {
            isMounted = false;
        };
    }, [user?.uid, isSignUp, hasPendingScan]); // Added hasPendingScan dependency

    const TopContainer = () => (
        <View
            style={[
                styles.topContainer,
                {
                    paddingTop:DefaultStyles.container.paddingTop+insets.top,
                    paddingHorizontal:DefaultStyles.container.paddingHorizontal,
                }
            ]}
        >
            <BlurredIconButton
                icon='close-outline'
                tint={showFinalApproval ? 'systemThinMaterialDark' : null}
                intensity={50}
                size={28}
                hapticType={Haptics.ImpactFeedbackStyle.Medium}
                onPress={handleClose}
                disabled={processing}
                style={{
                    outer: {
                        marginRight:'auto',
                        opacity: processing ? 0.5 : 1
                    }
                }}
            />

            <DefaultText
                style={{
                    ...styles.title,
                    color:showFinalApproval ? '#000000' : colors.text.primary,
                }}
            >
                {title}
            </DefaultText>

            <BlurredIconButton
                icon='information'
                tint={showFinalApproval ? 'systemThinMaterialDark' : null}
                intensity={50}
                size={24}
                style={{
                    outer: {
                        marginLeft:'auto',
                        opacity: processing ? 0.5 : 1
                    }
                }}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                onPress={handleInfoAlert}
                disabled={processing}
            />
        </View>
    );

    return (
        <>
            <CameraView
                ref={cameraRef}
                style={DefaultStyles.outer}
                onCameraReady={() => setCameraReady(true)}
                facing='front'
                flash={flashEnabled ? 'on' : 'off'}
            >
                {!showFinalApproval && (
                    <View style={styles.container}>
                        <TopContainer />

                        <View
                            style={{
                                flex:1,
                                paddingVertical:DefaultStyles.container.paddingTop,
                                paddingHorizontal:DefaultStyles.container.paddingHorizontal,
                            }}
                        >
                            <Animated.View
                                style={[
                                    styles.cameraContainer,
                                    {
                                        borderRadius:24,
                                        borderWidth:3,
                                        opacity: slideAnimation.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [1, 0.3, 1],
                                        })
                                    }
                                ]}
                            />
                        </View>

                        <View
                            style={[
                                styles.bottomContainer,
                                {
                                    paddingBottom:DefaultStyles.container.paddingBottom + insets.bottom,
                                }
                            ]}
                        >
                            {scanEligibility?.canScan && !checkingEligibility ? (
                                <>
                                    <BlurredIconButton
                                        intensity={100}
                                        tint='light'
                                        icon='image'
                                        size={24}
                                        onPress={handleSelectFromCameraRoll}
                                        hapticType={Haptics.ImpactFeedbackStyle.Medium}
                                        disabled={processing}
                                        style={{
                                            outer: {
                                                opacity: processing ? 0.5 : 1
                                            }
                                        }}
                                    />

                                    <Pressable
                                        onPressIn={handlePhotoPress}
                                        onPressOut={handlePhotoRelease}
                                        onPress={handleTakePhoto}
                                        disabled={snappingDisabled || processing}
                                    >
                                        <Animated.View style={[
                                            styles.captureButton,
                                            {
                                                transform: [{ scale: photoScale }],
                                                opacity: (snappingDisabled || processing) ? .5 : 1
                                            }
                                        ]}>
                                            <View style={styles.captureButtonInner} />
                                        </Animated.View>
                                    </Pressable>

                                    <BlurredIconButton
                                        intensity={(!flashEnabled+0)*100}
                                        tint='light'
                                        icon={flashEnabled ? 'sunny' : 'sunny-outline'}
                                        color={flashEnabled ? colors.background.primary : colors.text.primary}
                                        size={24}
                                        style={{
                                            outer: {
                                                opacity: processing ? 0.5 : 1
                                            },
                                            button: {
                                                backgroundColor:flashEnabled && '#fff'
                                            },
                                        }}
                                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                        onPress={toggleFlash}
                                        disabled={processing}
                                    />
                                </>
                            ) : null}
                        </View>
                    </View>
                )}
            </CameraView>


            {showFinalApproval && (
                <View style={[styles.confirmationOverlay, { backgroundColor: colors.background.screen }]}>
                    <TopContainer />

                    <View
                        style={{
                            flex:1,
                            paddingVertical:DefaultStyles.container.paddingTop,
                            paddingHorizontal:DefaultStyles.container.paddingHorizontal,
                        }}
                    >
                        <Animated.View
                            style={[
                                styles.cameraContainer,
                                {
                                    borderRadius:24,
                                    overflow:'visible',
                                    borderWidth:0,
                                    opacity: slideAnimation.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [1, 0.3, 1],
                                    })
                                }
                            ]}
                        >
                            <View style={styles.finalApprovalContainer}>
                                <View style={{ flex: 1, gap: 16 }}>
                                    <View style={[styles.photoWrapper, { flex: 2 }]}>
                                        <Image
                                            source={{uri: photos.front}}
                                            style={[styles.frontPhoto, { flex: 1, aspectRatio: undefined, height: undefined }]}
                                            resizeMode='cover'
                                        />
                                        {processing && (
                                            <View style={styles.processingOverlay}>
                                                <ActivityIndicator
                                                    size="large"
                                                    color={colors.text.primary}
                                                />
                                            </View>
                                        )}
                                    </View>

                                    <View style={[styles.topPhotosRow, { flex: 1 }]}>
                                        <View style={[styles.sidePhotoContainer, styles.photoWrapper, { flex: 1 }]}>
                                            <Image
                                                source={{uri: photos.left}}
                                                style={[styles.sidePhoto, { flex: 1, aspectRatio: undefined, height: undefined }]}
                                                resizeMode='cover'
                                            />
                                            {processing && (
                                                <View style={styles.processingOverlay}>
                                                    <ActivityIndicator
                                                        size="large"
                                                        color={colors.text.primary}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                        <View style={[styles.sidePhotoContainer, styles.photoWrapper, { flex: 1 }]}>
                                            <Image
                                                source={{uri: photos.right}}
                                                style={[styles.sidePhoto, { flex: 1, aspectRatio: undefined, height: undefined }]}
                                                resizeMode='cover'
                                            />
                                            {processing && (
                                                <View style={styles.processingOverlay}>
                                                    <ActivityIndicator
                                                        size="large"
                                                        color={colors.text.primary}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <DefaultButton
                                    disabled={processing}
                                    title="Add Personal Notes"
                                    endAdornment={
                                        <FontAwesome6
                                            name="plus"
                                            size={22}
                                            color={colors.text.primary}
                                        />
                                    }
                                    hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                    onPress={() => navigation.navigate('FaceScanNotes')}
                                    style={{
                                        backgroundColor:processing ? lighten(colors.background.secondary, .5) : colors.background.secondary,
                                        color:colors.text.primary
                                    }}
                                />
                            </View>
                        </Animated.View>
                    </View>

                    <View
                        style={[
                            styles.bottomContainer,
                            {
                                paddingBottom:DefaultStyles.container.paddingBottom + insets.bottom,
                            }
                        ]}
                    >
                        <IconButton
                            iconComponent={<FontAwesome name="refresh" size={32} color={colors.accents.error}/>}
                            style={{
                                width:72,
                                height:72,
                                backgroundColor:darken(colors.accents.error, .5),
                                opacity: processing ? 0.5 : 1
                            }}
                            onPress={handleRestart}
                            hapticType={Haptics.ImpactFeedbackStyle.Medium}
                            disabled={processing}
                        />
                        <IconButton
                            iconComponent={<FontAwesome6 name="check" size={32} color={colors.text.primary} />}
                            style={{
                                width:72,
                                height:72,
                                backgroundColor:colors.background.primary,
                                opacity: processing ? 0.5 : 1
                            }}
                            onPress={processFaceScan}
                            hapticType={Haptics.ImpactFeedbackStyle.Medium}
                            disabled={processing}
                        />
                    </View>
                </View>
            )}

            {/* White flash transition overlay */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.transitionFlashOverlay,
                    {
                        opacity: transitionFlash,
                    }
                ]}
            />
        </>
    )
}

export default ScanScreenTakePhoto;

const modalStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: DefaultStyles.container.paddingHorizontal,
    },
    content: {
        backgroundColor: colors.background.screen,
        borderRadius: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        height:275,
        padding:DefaultStyles.container.paddingHorizontal,
    },
    flexContainer: {
        width:'100%',
        gap:16,
        flexDirection:'row',
        alignItems:'center',
    },
    container: {
        gap:16,
        flex:1,
        width:'100%',
        backgroundColor: colors.background.screen,
    },
    title: {
        fontSize:DefaultStyles.text.title.xsmall,
        fontWeight:'700',
        color:colors.text.secondary
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
    },
    iconButton: {
        width:36,
        height:36,
        backgroundColor:colors.background.light,
        borderRadius:64,
        marginLeft:'auto',
    }
})

const styles = StyleSheet.create({
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'600',

        padding:4,
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.primary
    },
    container: {
        flex:1,
    },  
    topContainer: {
        alignItems:'center',
        gap: DefaultStyles.container.paddingHorizontal,
        flexDirection:'row',
        justifyContent:'space-between',
        padding:DefaultStyles.container.paddingHorizontal,
    },
    bottomContainer: {
        alignItems:'center',
        gap: DefaultStyles.container.paddingHorizontal,
        flexDirection:'row',
        justifyContent:'space-between',
        padding:DefaultStyles.container.paddingHorizontal,
    },
    iconButton: {
        width:48,
        height:48,
        borderRadius:64,
        overflow:'hidden',
        justifyContent:'center',
        alignItems:'center'
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
        borderColor:colors.text.primary
    },
    fullScreenCamera: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    fullScreenImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    safeAreaOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flex: 1,
    },
    topOverlay: {
        height: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    bottomOverlay: {
        height: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    middleRow: {
        flex: 1,
        flexDirection: 'row',
    },
    leftOverlay: {
        width: DefaultStyles.container.paddingHorizontal,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    rightOverlay: {
        width: DefaultStyles.container.paddingHorizontal,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    clearArea: {
        flex: 1,
    },
    cameraViewContainer: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.text.primary,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    snappedPictureContainer: {
        flex:1,
    },
    camera: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 4,
        borderColor: colors.text.primary,
        borderRadius: 125,
        backgroundColor: 'transparent',
    },
    captureButton: {
        width: 75,
        height: 75,
        borderRadius: 64,
        backgroundColor: 'rgba(255,255,255,.5)',
        alignItems: 'center',
        justifyContent: 'center',

    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 64,
        backgroundColor: colors.background.screen,
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius:24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    processingText: {
        color: colors.text.primary,
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        color: colors.text.primary,
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '500',
    },
    unavailableContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingHorizontal: 32,
    },
    unavailableTitle: {
        color: colors.text.primary,
        fontSize: DefaultStyles.text.title.xsmall,
        fontWeight: '600',
        textAlign: 'center',
    },
    unavailableMessage: {
        color: colors.text.primary,
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '400',
        textAlign: 'center',
        opacity: 0.8,
    },
    finalApprovalContainer: {
        flex: 1,
        gap: 16,
        justifyContent:'flex-start',
    },
    topPhotosRow: {
        flexDirection: 'row',
        gap: 16,
    },
    photoWrapper: {
        overflow: 'hidden',
    },
    sidePhotoContainer: {
        flex: 0.5,
    },
    sidePhoto: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 24,
        borderWidth: 5,
        borderColor: colors.accents.stroke,
    },
    frontPhoto: {
        width:'100%',
        aspectRatio: 1,
        borderRadius: 24,
        borderWidth: 5,
        borderColor: colors.accents.stroke,
    },
    wrapContainer: {
        flexDirection:'row',
        flexWrap:'wrap',
        gap:8,
        width:'100%',
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: 16,
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.background.tertiary,
        textAlignVertical: 'top',
        minHeight: 60,
    },
    confirmationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    confirmationBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    confirmationContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    transitionFlashOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 9999,
    },
})
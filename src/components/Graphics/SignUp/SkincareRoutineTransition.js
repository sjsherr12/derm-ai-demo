import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../config/colors';
import DefaultText from 'components/Text/DefaultText';

const SkincareRoutineTransition = () => {
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const scanOpacityAnim = useRef(new Animated.Value(0)).current;
    const analysisCompleteAnim = useRef(new Animated.Value(0)).current;
    const analysisPointsAnim = useRef(new Animated.Value(0)).current;
    const resultsAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            // Start scanning animation after a brief delay
            Animated.sequence([
                Animated.delay(300),
                Animated.parallel([
                    Animated.timing(scanOpacityAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnim, {
                        toValue: 200,
                        duration: 900,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(scanOpacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Show analysis complete
                Animated.sequence([
                    Animated.timing(analysisCompleteAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.delay(800),
                    Animated.timing(analysisCompleteAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start();

                // Show analysis points and results
                Animated.sequence([
                    Animated.delay(600),
                    Animated.parallel([
                        Animated.timing(analysisPointsAnim, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(resultsAnim, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start();
            });
        };

        startAnimation();
    }, []);

    const CameraCorner = ({ style }) => (
        <View style={[styles.cameraCorner, style]}>
            <View style={styles.cornerHorizontal} />
            <View style={styles.cornerVertical} />
        </View>
    );

    const DiagnosisItem = ({ condition, severity, color }) => (
        <View style={styles.diagnosisItem}>
            <View style={styles.diagnosisHeader}>
                <View style={[styles.diagnosisIndicator, { backgroundColor: color }]} />
                <DefaultText style={styles.diagnosisCondition}>{condition}</DefaultText>
                <DefaultText style={[styles.diagnosisSeverity, { color }]}>{severity}</DefaultText>
            </View>
            <View style={styles.severityBar}>
                <View 
                    style={[
                        styles.severityFill, 
                        { 
                            backgroundColor: color,
                            width: severity === 'Mild' ? '70%' : severity === 'Moderate' ? '60%' : severity === 'Severe' ? '10%' : '90%'
                        }
                    ]} 
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Camera Frame and Face */}
            <View style={styles.cameraSection}>
                <View style={styles.cameraFrame}>
                    <CameraCorner style={styles.topLeft} />
                    <CameraCorner style={styles.topRight} />
                    <CameraCorner style={styles.bottomLeft} />
                    <CameraCorner style={styles.bottomRight} />
                    
                    {/* Face Icon */}
                    <MaterialCommunityIcons 
                        name="account" 
                        size={190} 
                        color={colors.background.primary} 
                        style={styles.faceIcon}
                    />

                    {/* Scanning Line */}
                    <Animated.View
                        style={[
                            styles.scanLine,
                            {
                                transform: [{ translateY: scanLineAnim }],
                                opacity: scanOpacityAnim,
                            },
                        ]}
                    />

                    {/* Analysis Points
                    <AnalysisPoint x={40} y={70} delay={0} />
                    <AnalysisPoint x={180} y={65} delay={200} />
                    <AnalysisPoint x={45} y={130} delay={400} />
                    <AnalysisPoint x={175} y={140} delay={600} /> */}

                    {/* Analysis Complete Text - Centered in Camera Frame */}
                    <Animated.View
                        style={[
                            styles.analysisCompleteContainer,
                            {
                                opacity: analysisCompleteAnim,
                                transform: [{
                                    scale: analysisCompleteAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.8, 1],
                                    }),
                                }],
                            },
                        ]}
                    >
                        <DefaultText style={styles.analysisCompleteText}>Analysis Complete</DefaultText>
                    </Animated.View>
                </View>
            </View>

            {/* Results Section */}
            <Animated.View
                style={[
                    styles.resultsContainer,
                    {
                        opacity: resultsAnim,
                        transform: [{
                            translateY: resultsAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                            }),
                        }],
                    },
                ]}
            >
                <View style={styles.diagnosisContainer}>
                    <DiagnosisItem 
                        condition="Acne" 
                        severity="Mild" 
                        color={colors.accents.info} 
                    />
                    <DiagnosisItem 
                        condition="Oiliness" 
                        severity="Moderate" 
                        color={colors.accents.warning} 
                    />
                    <DiagnosisItem 
                        condition="Dark Spots" 
                        severity="Minimal" 
                        color={colors.accents.success} 
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent:'center',
        alignItems: 'center',
    },
    cameraSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    cameraFrame: {
        width: 270,
        height: 204,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraCorner: {
        position: 'absolute',
        width: 40,
        height: 40,
    },
    cornerHorizontal: {
        position: 'absolute',
        width: 32,
        height: 5,
        backgroundColor: colors.background.primary,
        borderRadius: 2,
    },
    cornerVertical: {
        position: 'absolute',
        width: 5,
        height: 32,
        backgroundColor: colors.background.primary,
        borderRadius: 2,
    },
    topLeft: {
        top: 0,
        left: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        transform: [{ rotate: '90deg' }],
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        transform: [{ rotate: '-90deg' }],
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        transform: [{ rotate: '180deg' }],
    },
    scanLine: {
        position: 'absolute',
        width: 260,
        height: 4,
        backgroundColor: colors.background.secondary,
        top: 0,
        borderRadius:4,
    },
    faceIcon: {
        position: 'absolute',
        alignSelf: 'center',
    },
    analysisPoint: {
        position: 'absolute',
    },
    analysisCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
    },
    analysisInnerCircle: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.background.primary,
    },
    analysisCompleteContainer: {
        backgroundColor: colors.background.secondary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
    },
    analysisCompleteText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    resultsContainer: {
        width: '100%',
        backgroundColor: 'transparent',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        padding: 20,
    },
    diagnosisContainer: {
        gap: 16,
    },
    diagnosisHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    diagnosisIndicator: {
        width: 8,
        height: 8,
        borderRadius: 6,
        marginRight: 8,
    },
    diagnosisCondition: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    diagnosisSeverity: {
        fontSize: 14,
        fontWeight: '600',
    },
    severityBar: {
        height: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 1.5,
        overflow: 'hidden',
        marginLeft: 16,
    },
    severityFill: {
        height: '100%',
        borderRadius: 1.5,
    },
});

export default SkincareRoutineTransition;
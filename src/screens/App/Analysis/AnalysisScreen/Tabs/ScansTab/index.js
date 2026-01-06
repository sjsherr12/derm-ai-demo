import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import {FontAwesome, Ionicons, FontAwesome6} from '@expo/vector-icons'
import DefaultButton from "components/Buttons/DefaultButton";
import IconButton from "components/Buttons/IconButton";
import * as Haptics from 'expo-haptics'
import { useData } from "context/global/DataContext";
import { useNavigation } from "@react-navigation/native";
import { getSeverityRating } from "utils/analysis";
import { SkinConcerns, AgeGroups } from "constants/signup";
import GradientProgressBar from "components/Graphics/SignUp/GradientProgressBar";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import { convertSkinConcernSeverityIdToName } from "utils/analysis";
import useAnalysisLoader from "context/global/useAnalysisLoader";
import { useEffect, useMemo, useState, memo, useCallback } from "react";
import useReviewPrompt from "hooks/useReviewPrompt";
import SkinConcernShortcut from "../../../../../../components/Options/ConcernShortcut";
import Skeleton from "components/Common/Skeleton";
import AnalysisScreenNoScansAvailable from "../../noScans";
import FadeScaleView from "../../../../../../components/Containers/FadeScaleView";
import ProgressSpinner from "../../../../../../components/Common/ProgressSpinner";
import Svg, { Path } from 'react-native-svg';
const { View, StyleSheet, Image, Pressable, Animated, Dimensions, Text } = require("react-native")

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Helper function to convert AgeGroup value to estimated chronological age (midpoint)
const getAgeFromAgeGroup = (ageGroupValue) => {
    const ageRanges = {
        0: { min: 18, max: 20 },   // "Under 21" - min 18
        1: { min: 21, max: 30 },   // "21 to 30"
        2: { min: 31, max: 40 },   // "31 to 40"
        3: { min: 41, max: 50 },   // "41 to 50"
        4: { min: 51, max: 60 },   // "51 to 60"
        5: { min: 61, max: 70 },   // "61 or above"
    };

    const range = ageRanges[ageGroupValue] || ageRanges[1]; // default to 21-30
    return (range.min + range.max) / 2;
};

// Helper function to derive skin age from user age and aging scores
const deriveSkinAge = (userAgeGroupValue, agingScores) => {
    const baseAge = getAgeFromAgeGroup(userAgeGroupValue);

    // If no aging scores, return base age
    if (!agingScores || agingScores.length === 0) {
        return Math.max(18, baseAge);
    }

    // Calculate weighted average of aging scores (more recent = more weight)
    const weights = agingScores.map((_, idx) => idx + 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = agingScores.reduce((sum, score, idx) => sum + (score * weights[idx]), 0);
    const avgAgingScore = weightedSum / totalWeight;

    // Aging score interpretation (0-100%):
    // 0-30%: Excellent skin health, looks younger than actual age
    // 31-50%: Good skin health, looks around actual age
    // 51-70%: Moderate aging signs, looks slightly older
    // 71-100%: Significant aging signs, looks older

    // Use a percentage-based modifier that scales with age
    // Score of 50 = looks your actual age
    // The offset is proportional to both the score deviation AND the base age
    // This creates a weaker correlation for younger users
    const neutralScore = 50;
    const scoreDeviation = (avgAgingScore - neutralScore) / 100; // -0.5 to +0.5

    // Scale factor: younger people have smaller absolute offsets
    // Max offset is roughly ±30% of base age
    const maxOffsetRatio = 0.3;
    const ageOffset = scoreDeviation * baseAge * maxOffsetRatio * 2;

    const derivedAge = baseAge + ageOffset;

    // Clamp to minimum 18 and reasonable max (base age + 15 years max)
    return Math.max(18, Math.min(derivedAge, baseAge + 15));
};

// Helper function to calculate skin aging pace
const calculateAgingPace = (agingScores, userAgeGroupValue) => {
    // If less than 2 scores, we can't calculate a trend
    if (!agingScores || agingScores.length < 2) {
        // Base pace on current aging score relative to neutral (50%)
        if (agingScores && agingScores.length === 1) {
            const score = agingScores[0];
            // Score of 50 = 1.0x pace (normal)
            // Higher scores = faster aging, lower = slower
            const basePace = 1 + ((score - 50) / 200); // Gentler scaling
            return Math.max(0.7, Math.min(basePace, 1.5));
        }
        return 1.0; // Default to normal pace
    }

    // Calculate trend from oldest to newest
    const oldestScores = agingScores.slice(0, Math.ceil(agingScores.length / 2));
    const newestScores = agingScores.slice(Math.ceil(agingScores.length / 2));

    const oldAvg = oldestScores.reduce((sum, s) => sum + s, 0) / oldestScores.length;
    const newAvg = newestScores.reduce((sum, s) => sum + s, 0) / newestScores.length;

    // Calculate pace based on change over time
    // If scores improved (decreased), aging pace is slower
    // If scores worsened (increased), aging pace is faster
    const change = newAvg - oldAvg;

    // Base pace on latest score level
    const latestScore = agingScores[agingScores.length - 1];
    const basePace = 1 + ((latestScore - 50) / 200);

    // Adjust based on trend (gentler adjustment)
    const trendAdjustment = (change / 100) * 0.3;

    const pace = basePace + trendAdjustment;

    // Clamp between 0.7x and 1.5x for realistic range
    return Math.max(0.7, Math.min(pace, 1.5));
};

// Semicircle Progress Bar Component
const SemicircleProgressBar = memo(({ progress, size, color = colors.background.primary, backgroundColor = colors.background.screen, strokeWidth = 10 }) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    const radius = (size - strokeWidth) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    // Create semicircle arc path (top half - from left to right)
    const createArcPath = (startAngle, endAngle) => {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
    };

    // Background arc: full semicircle (180 to 360 degrees, which is the top half)
    const backgroundPath = createArcPath(180, 360);

    // Progress arc: partial semicircle based on progress
    const progressAngle = 180 + (clampedProgress / 100) * 180;
    const progressPath = clampedProgress > 0 ? createArcPath(180, progressAngle) : '';

    return (
        <View style={{ width: size, height: size / 2, position: 'relative' }}>
            <Svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2 + strokeWidth / 2}`}>
                {/* Background arc */}
                <Path
                    d={backgroundPath}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Progress arc */}
                {clampedProgress > 0 && (
                    <Path
                        d={progressPath}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                    />
                )}
            </Svg>
        </View>
    );
});

// Memoized scan availability container component
const ScanAvailabilityContainer = memo(({
    scanEligibility,
    scanEligibilityLoading,
    onScanPress,
    hasPendingScan
}) => {
    const getScanDisplayInfo = () => {
        if (!scanEligibility) {
            return {
                title: 'Scan your face',
                description: 'Loading scan availability...',
                buttonText: 'Add Scan',
                canScan: false
            };
        }

        // Check for pending scan first
        if (hasPendingScan) {
            return {
                title: 'Scan in progress',
                description: 'Your scan is currently being processed. Please wait for it to complete before starting a new scan.',
                buttonText: 'Processing...',
                canScan: false
            };
        }

        if (!scanEligibility?.canScan) {
            const daysText = scanEligibility?.daysRemaining === 1 ? 'day' : 'days';
            return {
                title: 'Scan cooldown active',
                description: `You can scan again in ${scanEligibility?.daysRemaining || 'a few'} ${daysText}. Continue following your routine and check back soon to track your progress!`,
                buttonText: 'No scans available',
                canScan: false
            };
        }

        // Scan available (3-day cooldown system)
        return {
            title: scanEligibility.isFirstScan ? 'Ready for your first scan!' : 'Scan your face',
            description: scanEligibility.isFirstScan ?
                'Take your first photo to get detailed insights about your skin and receive personalized product recommendations.' :
                'Take a photo of your face to get detailed insights about your skin and receive personalized product recommendations.',
            buttonText: scanEligibility.isFirstScan ? 'Take first scan' : 'Add Scan',
            canScan: true
        };
    };

    const scanInfo = getScanDisplayInfo();

    if (scanEligibilityLoading) {
        return (
            <View style={styles.itemContainer}>
                <Skeleton
                    width={200}
                    height={22}
                    borderRadius={4}
                />
                <Skeleton
                    width="100%"
                    height={10}
                    borderRadius={5}
                />
                <Skeleton
                    width="100%"
                    height={50}
                    borderRadius={64}
                />
            </View>
        );
    }

    return (
        <FadeScaleView style={styles.itemContainer}>
            <DefaultText
                style={styles.timeCaption}
            >
                Next scan is available{' '}
                <DefaultText
                    style={[
                        styles.timeCaption,
                        {color:colors.background.primary}
                    ]}
                >
                    {scanEligibility?.canScan? 'today!' : `in ${scanEligibility?.daysRemaining || 1} day${scanEligibility?.daysRemaining > 1 ? 's' : ''}.`}
                </DefaultText>
            </DefaultText>

            <GradientProgressBar
                progress={1 - ((scanEligibility?.daysRemaining) / 4)}
                colorA={colors.background.primary}
                colorB={colors.background.primary}
                height={10}
            />

            <DefaultButton
                isActive={scanInfo?.canScan}
                title={scanInfo.buttonText}
                endAdornment={
                    <Ionicons
                        name={scanInfo.canScan ? 'add-circle-outline' : 'close-circle-outline'}
                        size={24}
                        color={scanInfo.canScan ? colors.text.primary : colors.text.lighter}
                        style={{
                            marginLeft:8,
                        }}
                    />
                }
                style={{
                    borderRadius:64,
                    height:50,
                    opacity: scanInfo?.canScan ? 1 : 0.6
                }}
                extraStyles={{
                    button: {
                        height:50,
                        borderRadius:64,
                        backgroundColor: scanInfo?.canScan ? colors.background.primary : colors.accents.stroke
                    },
                    text: {
                        fontSize:DefaultStyles.text.caption.small,
                        color: scanInfo?.canScan ? colors.text.primary : colors.text.lighter
                    }
                }}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                onPress={() => {
                    if (scanInfo?.canScan) {
                        onScanPress();
                    }
                }}
            />
        </FadeScaleView>
    );
});

const LatestAnalysisAgingOverview = memo(({
    latestScan,
    diagnoses
}) => {
    const { userData } = useData();

    // Extract aging scores from all diagnoses (oldest to newest)
    const agingScores = useMemo(() => {
        if (!diagnoses || diagnoses.length === 0) return [];

        // Sort by createdAt ascending (oldest first) for proper trend calculation
        const sortedDiagnoses = [...diagnoses].sort((a, b) => {
            const dateA = a?.createdAt instanceof Date ? a.createdAt : new Date(a?.createdAt);
            const dateB = b?.createdAt instanceof Date ? b.createdAt : new Date(b?.createdAt);
            return dateA - dateB;
        });

        return sortedDiagnoses
            .map(d => d?.severities?.aging)
            .filter(score => score !== undefined && score !== null);
    }, [diagnoses]);

    // Get user's age group from profile
    const userAgeGroup = userData?.profile?.age ?? 1; // Default to "21-30" if not set

    // Calculate derived skin age
    const derivedSkinAge = useMemo(() => {
        return deriveSkinAge(userAgeGroup, agingScores);
    }, [userAgeGroup, agingScores]);

    // Calculate skin aging pace
    const skinAgingPace = useMemo(() => {
        return calculateAgingPace(agingScores, userAgeGroup);
    }, [agingScores, userAgeGroup]);

    const derivedSkinAgeSeverityInfo = getSeverityRating(118 - derivedSkinAge);
    const semicircleSize = (SCREEN_WIDTH - 128) / 2;

    return (
        <FadeScaleView style={styles.itemContainer}>
            <View
                style={{
                    ...styles.flexContainer,
                    alignItems:'flex-start'
                }}
            >
                <View
                    style={{
                        gap:8,
                        flex:1,
                        alignItems:'flex-start'
                    }}
                >
                    <DefaultText
                        style={styles.caption}
                    >
                        Skin Health
                    </DefaultText>

                    <View
                        style={{
                            gap:4,
                            marginTop:8,
                        }}
                    >
                        <DefaultText
                            style={styles.text}
                        >
                            Overall Skin Age
                        </DefaultText>

                        <DefaultText
                            style={styles.largeTitle}
                        >
                            {parseFloat(derivedSkinAge).toFixed(1)}
                        </DefaultText>
                    </View>

                    <View
                        style={{
                            gap:4
                        }}
                    >
                        <DefaultText
                            style={styles.text}
                        >
                            Skin Aging Pace
                        </DefaultText>

                        <DefaultText
                            style={styles.largeTitle}
                        >
                            {skinAgingPace.toFixed(1)}x
                        </DefaultText>
                    </View>
                </View>

                <View
                    style={{
                        alignItems:'center',
                        backgroundColor:colors.background.light,
                        padding:16,
                        borderRadius:16,
                    }}
                >
                    <SemicircleProgressBar
                        progress={derivedSkinAge}
                        size={semicircleSize}
                        strokeWidth={16}
                        color={derivedSkinAgeSeverityInfo?.color}
                    />
                    <DefaultText
                        style={{
                            fontSize: DefaultStyles.text.title.xsmall,
                            fontWeight: '700',
                            color: colors.text.secondary,
                            marginTop: -semicircleSize / 4,
                            marginBottom:18,
                        }}
                    >
                        {parseFloat(derivedSkinAge).toFixed(1)}
                    </DefaultText>

                    <DefaultText
                        style={{
                            width:semicircleSize-16,
                            paddingHorizontal:16,
                            paddingVertical:8,
                            backgroundColor:derivedSkinAgeSeverityInfo?.color,
                            color:colors.text.primary,
                            fontSize:DefaultStyles.text.caption.small,
                            textAlign:'center',
                            borderRadius:64,
                        }}
                    >
                        {derivedSkinAgeSeverityInfo?.name}
                    </DefaultText>
                </View>
            </View>
        </FadeScaleView>
    )
})

const ScanHistoryShortcut = memo(({

}) => {

    const navigation = useNavigation();
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150
    })
    
    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('ScanHistory')}
        >
            <Animated.View
                style={[
                    styles.itemContainer,
                    {transform:[{scale}]}
                ]}
            >
                <View
                    style={styles.flexContainer}
                >
                    <View
                        style={{
                            flex:1,
                            gap:8
                        }}
                    >
                        <DefaultText
                            style={styles.title}
                        >
                            Scan History
                        </DefaultText>

                        <DefaultText
                            style={styles.text}
                        >
                            View all your previous scans & analyses
                        </DefaultText>
                    </View>

                    <Ionicons
                        name='chevron-forward'
                        color={colors.text.secondary}
                        size={24}
                    />
                </View>
            </Animated.View>
        </Pressable>
    )
})

const AnalysisScreenScanTab = ({
    diagnoses,
    latestScan,
    scanEligibility,
    analysisLoading,
    scanEligibilityLoading,
    hasNoScans,
    pendingScan,
    pendingScanProgress
}) => {

    const navigation = useNavigation();
    const { pendingScanError, clearPendingScanError } = useData();
    const overallScore = latestScan?.severities?.overall
    const overallSeverityRating = getSeverityRating(overallScore)
    const { recordPositiveAction } = useReviewPrompt();
    const concernCustomWidth = useMemo(
        () => (SCREEN_WIDTH-(DefaultStyles.container.paddingHorizontal*2)-(16*2)-4)/2, []
    );

    // Memoized scan press handler
    const handleScanPress = useCallback(() => {
        recordPositiveAction('scan_initiated');
        navigation.navigate('FaceScan');
    }, [navigation, recordPositiveAction]);

    const renderPendingAnalysisContainer = useCallback(() => {
        // Only render if there's a pending scan
        if (!pendingScan) return null;

        // Get processing stage based on progress
        const getProcessingStage = (progress) => {
            if (progress < 20) return 'Uploading photos...';
            if (progress < 40) return 'Processing scan...';
            if (progress < 60) return 'Analyzing skin...';
            if (progress < 80) return 'Diagnosing conditions...';
            return 'Finalizing results...';
        };

        const processingStage = getProcessingStage(Math.round(pendingScanProgress));

        return (
            <FadeScaleView
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    New Analysis{' · '}
                    {(pendingScan?.createdAt || new Date()).toLocaleDateString('en-US', {
                        month:'short',
                        day:'numeric',
                        year:'numeric'
                    })}
                </DefaultText>

                <View
                    style={[
                        styles.flexContainer,
                        {
                            marginTop:2,
                            marginBottom:4,
                        }
                    ]}
                >
                    <Image
                        source={{
                            uri:pendingScan?.photos?.left,
                        }}
                        style={styles.imageContainer}
                        resizeMode='cover'
                    />
                    <Image
                        source={{
                            uri:pendingScan?.photos?.front,
                        }}
                        style={styles.imageContainer}
                        resizeMode='cover'
                    />
                    <Image
                        source={{
                            uri:pendingScan?.photos?.right,
                        }}
                        style={styles.imageContainer}
                        resizeMode='cover'
                    />
                </View>

                <View
                    style={styles.flexContainer}
                >
                    <ProgressSpinner
                        progress={Math.round(pendingScanProgress)}
                    />

                    <View
                        style={{
                            gap:12,
                            flex:1,
                        }}
                    >
                        <DefaultText
                            style={{
                                ...styles.caption,
                                textAlign:'start'
                            }}
                        >
                            {processingStage}
                        </DefaultText>

                        {Array.from({length:2}).map((_, idx) => (
                            <Skeleton
                                key={idx}
                                width='100%'
                                height={12}
                                borderRadius={16}
                                style={{
                                    flex:1,
                                    maxHeight:12,
                                }}
                            />
                        ))}

                        <DefaultText
                            style={styles.text}
                        >
                            We'll update this when it's done!
                        </DefaultText>
                    </View>
                </View>
            </FadeScaleView>
        )
    }, [pendingScan, pendingScanProgress])


    const renderLatestAnalysisContainer = useCallback(() => {
        if (!analysisLoading && hasNoScans) {
            return <AnalysisScreenNoScansAvailable />;
        }

        if (analysisLoading || !latestScan) {
            return (
                <View style={styles.itemContainer}>
                    <Skeleton
                        width={200}
                        height={14}
                        borderRadius={4}
                        style={{ marginHorizontal: 'auto' }}
                    />
                    
                    <View style={[styles.flexContainer, { marginTop: DefaultStyles.container.paddingTop }]}>
                        <Skeleton
                            width={(SCREEN_WIDTH - (DefaultStyles.container.paddingHorizontal * 2) - 32 - 24) / 3}
                            height={(SCREEN_WIDTH - (DefaultStyles.container.paddingHorizontal * 2) - 32 - 24) / 3}
                            borderRadius={16}
                        />
                        <Skeleton
                            width={(SCREEN_WIDTH - (DefaultStyles.container.paddingHorizontal * 2) - 32 - 24) / 3}
                            height={(SCREEN_WIDTH - (DefaultStyles.container.paddingHorizontal * 2) - 32 - 24) / 3}
                            borderRadius={16}
                        />
                        <Skeleton
                            width={(SCREEN_WIDTH - (DefaultStyles.container.paddingHorizontal * 2) - 32 - 24) / 3}
                            height={(SCREEN_WIDTH - (DefaultStyles.container.paddingHorizontal * 2) - 32 - 24) / 3}
                            borderRadius={16}
                        />
                    </View>

                    <Skeleton
                        width="100%"
                        height={48}
                        borderRadius={64}
                    />

                    <View style={styles.wrapContainer}>
                        <Skeleton
                            width={concernCustomWidth}
                            height={60}
                            borderRadius={8}
                        />
                        <Skeleton
                            width={concernCustomWidth}
                            height={60}
                            borderRadius={8}
                        />
                        <Skeleton
                            width={concernCustomWidth}
                            height={60}
                            borderRadius={8}
                        />
                        <Skeleton
                            width={concernCustomWidth}
                            height={60}
                            borderRadius={8}
                        />
                    </View>

                    <Skeleton
                        width="100%"
                        height={50}
                        borderRadius={64}
                    />
                </View>
            );
        }

        return (
            <FadeScaleView style={styles.itemContainer}>
                <DefaultText
                    style={styles.caption}
                >
                    Latest Analysis{' · '}
                    {(new Date(latestScan?.createdAt))?.toLocaleDateString('en-US', {
                        month:'short',
                        day:'numeric',
                        year:'numeric'
                    })}
                </DefaultText>

                <View
                    style={[
                        styles.flexContainer,
                        {
                            marginTop:2,
                        }
                    ]}
                >
                    <Image
                        source={{
                            uri:latestScan?.facialScans?.left,
                        }}
                        style={styles.imageContainer}
                        resizeMode='cover'
                    />
                    <Image
                        source={{
                            uri:latestScan?.facialScans?.front,
                        }}
                        style={styles.imageContainer}
                        resizeMode='cover'
                    />
                    <Image
                        source={{
                            uri:latestScan?.facialScans?.right,
                        }}
                        style={styles.imageContainer}
                        resizeMode='cover'
                    />
                </View>

                <DefaultButton
                    title={`Overall Score: ${overallScore}%`}
                    style={{
                        height:50,
                        color:colors.text.primary,
                        backgroundColor: overallSeverityRating?.color
                    }}
                    extraStyles={{
                        button: {
                            height:50,
                        },
                        text: {
                            fontWeight:'700',
                            fontSize:DefaultStyles.text.caption.small,
                        }
                    }}
                />

                <View style={styles.wrapContainer}>
                    {SkinConcerns.slice(1).sort().map((concern, idx) => {
                        const severity = latestScan?.severities?.[concern.severityId];
                        const concernName = convertSkinConcernSeverityIdToName(concern.severityId);
                        const severityInfo = getSeverityRating(severity);
    
                        return (
                            <View
                                key={idx}
                                style={{
                                    ...styles.itemContainer,
                                    gap:8,
                                    padding:12,
                                    width: concernCustomWidth,
                                    position: 'relative'
                                }}
                            >
                                <View
                                    style={styles.flexContainer}
                                >
                                    <DefaultText
                                        style={{
                                            ...styles.caption,
                                            alignSelf:'flex-start',
                                            fontWeight:'400'
                                        }}
                                    >
                                        {concernName}
                                    </DefaultText>

                                    <DefaultText
                                        style={{
                                            ...styles.caption,
                                            marginLeft:'auto'
                                        }}
                                    >
                                        {severity}%
                                    </DefaultText>
                                </View>

                                <View
                                    style={styles.flexContainer}
                                >
                                    <GradientProgressBar
                                        progress={severity / 100}
                                        height={6}
                                        borderRadius={16}
                                        colorA={severityInfo.color}
                                        colorB={severityInfo.color}
                                    />
                                </View>
                            </View>
                        )
                    })}
                </View>

                <DefaultButton
                    isActive
                    title='View Full Analysis'
                    style={{
                        borderRadius:64,
                        height:50,
                    }}
                    extraStyles={{
                        button: {
                            height:50,
                        },
                        text: {
                            fontSize:DefaultStyles.text.caption.small,
                        }
                    }}
                    hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    onPress={() => {
                        recordPositiveAction('full_analysis_viewed');
                        navigation.navigate('FullAnalysis', {
                            diagnosisId:latestScan?.id
                        });
                    }}
                />
            </FadeScaleView>
        );
    }, [hasNoScans, analysisLoading, latestScan, overallSeverityRating, concernCustomWidth, recordPositiveAction, navigation]);

    const renderLatestAnalysisAgingOverview = () => {
        if (analysisLoading || !latestScan) {
            return (
                <View></View>
            )
        }

        return (
            <LatestAnalysisAgingOverview
                latestScan={latestScan}
                diagnoses={diagnoses}
            />
        )
    }

    return (
        <View
            style={styles.container}
        >
            
            {(analysisLoading || diagnoses?.length > 0) && (
                <ScanAvailabilityContainer
                    scanEligibility={scanEligibility}
                    scanEligibilityLoading={scanEligibilityLoading}
                    onScanPress={handleScanPress}
                    hasPendingScan={!!pendingScan}
                />
            )}
            
            {/* Show error message if scan failed */}
            {pendingScanError && (
                <FadeScaleView style={[styles.itemContainer, { borderColor: colors.accents.error }]}>
                    <View style={styles.flexContainer}>
                        <Ionicons name="alert-circle" size={24} color={colors.accents.error} />
                        <View style={{ flex: 1, gap: 4 }}>
                            <DefaultText style={[styles.title, { color: colors.accents.error }]}>
                                Scan Failed
                            </DefaultText>
                            <DefaultText style={styles.text}>
                                {pendingScanError}
                            </DefaultText>
                        </View>
                        <IconButton
                            iconComponent={<Ionicons name="close" size={20} color={colors.text.secondary} />}
                            style={{
                                width: 32,
                                height: 32,
                                backgroundColor: colors.accents.stroke
                            }}
                            onPress={clearPendingScanError}
                            hapticType={Haptics.ImpactFeedbackStyle.Light}
                        />
                    </View>
                </FadeScaleView>
            )}

            {/* Show pending container if scan is processing, otherwise show latest analysis */}
            {pendingScan ? (
                renderPendingAnalysisContainer()
            ) : (
                renderLatestAnalysisContainer()
            )}

            {renderLatestAnalysisAgingOverview()}

            {diagnoses?.length > 1 &&
                <ScanHistoryShortcut
                />
            }
        </View>
    )
}

export default memo(AnalysisScreenScanTab);

const styles = StyleSheet.create({
    container: {
        gap:16,
    },
    itemContainer: {
        gap:16,
        borderRadius:16,
        padding:DefaultStyles.container.paddingBottom,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    wrapContainer: {
        flexDirection:'row',
        flexWrap:'wrap',
        gap:16,
        marginTop:4
    },
    largeImageContainer: {
        width:'100%',
        aspectRatio:1,
        borderWidth:2,
        borderColor:colors.accents.stroke,
        borderRadius:24,
        marginTop:DefaultStyles.container.paddingTop,
    },
    imageContainer: {
        flex:.5,
        resizeMode:'cover',
        borderRadius:14,
        aspectRatio:3 / 4,
        marginHorizontal:'auto',
    },
    safetyRatingText: {
        width:'100%',
        borderRadius:64,
        textAlign:'center',
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.medium,
        backgroundColor:colors.background.primary,
        paddingVertical:16,
        color:'#fff',
        marginHorizontal:'auto',
    },
    largeTitle: {
        fontWeight:'800',
        fontSize:DefaultStyles.text.title.small,
        color:colors.text.secondary,
    },
    title: {
        fontSize:DefaultStyles.text.caption.xlarge,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    timeCaption:{
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'800',
        color:colors.text.secondary,
    },
    caption: {
        textAlign:'center',
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'700',
        color:colors.text.secondary,
    },
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
    }
})
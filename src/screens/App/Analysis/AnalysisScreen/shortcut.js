import colors from "config/colors";
import DefaultStyles from "config/styles";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import * as Haptics from 'expo-haptics'
import { useNavigation } from "@react-navigation/native";
import DefaultText from "components/Text/DefaultText";
import { timeAgo } from "utils/date";
import { useData } from "context/global/DataContext";
import { SkinConcerns } from "constants/signup";
import { convertSkinConcernSeverityIdToName } from "utils/analysis";
import { getSeverityRating } from "utils/analysis";
import {Ionicons, Entypo} from '@expo/vector-icons'

const AnalysisScreenScanShortcut = ({
    userData,
    diagnosis
}) => {
    const navigation = useNavigation();
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:0.95,
        maxScale:1,
        duration:150,
        useNativeDriver: true
    })
    const diagnosisCreationDate = (new Date(diagnosis?.createdAt));
    const userSkinConcerns = userData?.profile?.skinInfo?.skinConcerns || [];
    
    // Create a list that ensures we always show 3 concerns
    const getTopConcernsToDisplay = () => {
        if (!diagnosis?.severities) return [];
        
        // Get all available skin concerns with their severity scores
        const allConcernsWithSeverity = SkinConcerns.map(concern => ({
            ...concern,
            severity: diagnosis.severities[concern.severityId] || 0
        })).filter(concern => concern.severity > 0); // Only show concerns that have a score
        
        // Sort by severity (highest first)
        const sortedBySeverity = allConcernsWithSeverity.sort((a, b) => b.severity - a.severity);
        
        // If user selected concerns, prioritize those, then fill with highest severity ones
        const userSelectedConcerns = userSkinConcerns.map(concernValue => 
            allConcernsWithSeverity.find(c => c.value === concernValue)
        ).filter(Boolean);
        
        // Combine user selected + highest severity, remove duplicates, take first 3
        const combined = [...userSelectedConcerns];
        sortedBySeverity.forEach(concern => {
            if (combined.length < 3 && !combined.find(c => c.value === concern.value)) {
                combined.push(concern);
            }
        });
        
        return combined.slice(0, 3);
    };
    
    const concernsToDisplay = getTopConcernsToDisplay();

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('FullAnalysis', {
                diagnosisId: diagnosis?.id
            })}
        >
            <Animated.View
                style={[
                    styles.container,
                    {transform:[{scale}]}
                ]}
            >
                <View
                    style={styles.flexContainer}
                >
                    <DefaultText
                        style={styles.text}
                    >
                        {diagnosisCreationDate?.toLocaleDateString('en-US', {
                            month:'short',
                            day:'numeric',
                            year:'numeric'
                        })}
                    </DefaultText>

                    <View
                        style={[
                            styles.flexContainer,
                            {
                                gap:4,
                                marginLeft:'auto'
                            }
                        ]}
                    >
                        <DefaultText
                            style={styles.badge}
                        >
                            {timeAgo(diagnosisCreationDate)}
                        </DefaultText>

                        <Entypo name="chevron-right" size={20} color="black"/>
                    </View>
                </View>

                <View style={DefaultStyles.separator} />
                
                <View
                    style={styles.flexContainer}
                >
                    <Image
                        source={{uri:diagnosis?.facialScans?.front}}
                        style={styles.imageContainer}
                    />

                    <View
                        style={{
                            flex:1,
                            gap:16,
                        }}
                    >
                        <View
                            style={[
                                styles.scoreContainer,
                                {backgroundColor:getSeverityRating(diagnosis?.severities?.overall).color}
                            ]}
                        >
                            <DefaultText
                                style={styles.scoreText}
                            >
                                Overall: {diagnosis?.severities?.overall}/100
                            </DefaultText>
                        </View>

                        {concernsToDisplay.map((concern, idx) => {
                            const concernName = convertSkinConcernSeverityIdToName(concern.severityId)
                            const concernSeverity = concern.severity;
                            const concernSeverityInfo = getSeverityRating(concernSeverity)

                            return (
                                <View
                                    key={idx}
                                    style={styles.concernContainer}
                                >
                                    <DefaultText
                                        style={styles.concernText}
                                    >
                                        {concernName}: {concernSeverity}%
                                    </DefaultText>
                                    <View style={styles.progressBarContainer}>
                                        <View 
                                            style={[
                                                styles.progressBar,
                                                {
                                                    width: `${concernSeverity}%`,
                                                    backgroundColor: concernSeverityInfo?.color
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    )
}

export default AnalysisScreenScanShortcut;

const styles = StyleSheet.create({
    container: {
        gap:16,
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:24,
    },
    imageContainer: {
        width:122,
        aspectRatio:3 / 4,
        borderRadius:14,
        overflow:'hidden',
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    scoreText: {
        fontSize:14,
        fontWeight:'600',
        color:colors.text.primary,
    },
    badge: {
        fontSize:DefaultStyles.text.caption.xsmall,
        fontWeight:'600',
        color:colors.text.primary,
        paddingHorizontal:12,
        paddingVertical:6,
        borderRadius:64,
        backgroundColor:colors.background.primary,
        marginLeft:'auto',
    },
    scoreContainer: {
        alignItems:'center',
        justifyContent:'center',
        width:'100%',
        paddingVertical:8,
        borderRadius:60
    },
    concernContainer: {
        width:'100%',
        borderRadius:8,
        gap:6,
    },
    concernText: {
        fontSize:14,
        fontWeight:'500',
        color:colors.text.secondary,
    },
    progressBarContainer: {
        width:'100%',
        height:4,
        backgroundColor:colors.accents.stroke,
        borderRadius:2,
        overflow:'hidden',
    },
    progressBar: {
        height:'100%',
        borderRadius:2,
    },
})
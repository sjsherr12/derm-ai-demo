import { useNavigation } from "@react-navigation/native"
import DefaultText from "components/Text/DefaultText"
import colors from "config/colors"
import { SkinTypes, SkinTones, SkinSensitivities, SkinConcerns, BreakoutLocations, BreakoutPainSeverities, CommonMedications, GenericClimates, CommonAllergens, SkincareGoals } from "constants/signup"
import { useData } from "context/global/DataContext"
import SignUpQuestions from "data/SignUpQuestions"
import useScalePressAnimation from "hooks/useScalePressAnimation"
import React, { useMemo } from "react"
import { getNestedProperty } from "utils/objects"
import {Ionicons, Entypo} from '@expo/vector-icons'

const { default: DefaultStyles } = require("config/styles")
const { View, SafeAreaView, ScrollView, StyleSheet, Animated, Pressable } = require("react-native")
const { default: EditSkinProfileScreenHeader } = require("./header")

const SkinProfileQuestionShortcut = ({
    id,
    name,
    value,
}) => {
    const navigation = useNavigation();

    const question = useMemo(() => SignUpQuestions.find(q => q.id === id), [id])

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })

    const handlePress = () => {
        navigation.navigate('ProfileQuestion', {
            question
        })
    }

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.flexContainer,
                    {transform:[{scale}]}
                ]}
            >
                <DefaultText
                    style={styles.text}
                >
                    {name}
                </DefaultText>

                <DefaultText
                    style={[
                        styles.caption,
                        {
                            marginLeft:'auto',
                            maxWidth: '44%'
                        }
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {value}
                </DefaultText>

                <Entypo
                    name='chevron-right'
                    color={colors.text.secondary}
                    size={20}
                />
            </Animated.View>
        </Pressable>
    )
}

const EditSkinProfileScreen = ({

}) => {

    const {userData} = useData();

    const formatValue = (value, options, isArray = false) => {
        if (value === undefined || value === null) return isArray ? 'None' : 'Not set';
        
        if (isArray) {
            if (Array.isArray(value)) {
                if (value.length === 0) return 'None';
                if (value.length > 1) return 'Multiple';
                // For single item array, find the option title or return the value
                const option = options?.find(opt => opt.value === value[0]);
                return option?.title || value[0];
            }
            return 'None';
        }

        // For single values, find the option title
        const option = options?.find(opt => opt.value === value);
        return option?.title || value || 'Not set';
    };

    const profileQuestions = useMemo(() => {
        const questions = [];
        
        // Get all profile questions from SignUpQuestions that have field property
        const profileQuestionIds = [
            'SkinTypeQuestion',
            'SkinToneQuestion', 
            'SkinSensitivityQuestion',
            'SkinConcernsQuestion',
            'BreakoutLocationsQuestion',
            // 'BreakoutPainSeverityQuestion',
            // 'MedicationRoutineQuestion',
            'TypicalClimateQuestion',
            'KnownAllergensQuestion',
            'SkinCareGoalsQuestion'
        ];
        
        profileQuestionIds.forEach(questionId => {
            const question = SignUpQuestions.find(q => q.id === questionId);
            if (question?.field) {
                const rawValue = getNestedProperty(userData, question.field);
                let formattedValue;
                
                switch (questionId) {
                    case 'SkinTypeQuestion':
                        formattedValue = formatValue(rawValue, SkinTypes);
                        break;
                    case 'SkinToneQuestion':
                        formattedValue = formatValue(rawValue, SkinTones);
                        break;
                    case 'SkinSensitivityQuestion':
                        formattedValue = formatValue(rawValue, SkinSensitivities);
                        break;
                    case 'SkinConcernsQuestion':
                        formattedValue = formatValue(rawValue, SkinConcerns, true);
                        break;
                    case 'BreakoutLocationsQuestion':
                        formattedValue = formatValue(rawValue, BreakoutLocations, true);
                        break;
                    // case 'BreakoutPainSeverityQuestion':
                    //     formattedValue = formatValue(rawValue, BreakoutPainSeverities);
                    //     break;
                    // case 'MedicationRoutineQuestion':
                    //     // Medications is array of strings, don't look up in options
                    //     if (rawValue === undefined || rawValue === null || rawValue.length === 0) {
                    //         formattedValue = 'None';
                    //     } else if (rawValue.length > 1) {
                    //         formattedValue = 'Multiple';
                    //     } else {
                    //         formattedValue = rawValue[0];
                    //     }
                    //     break;
                    case 'TypicalClimateQuestion':
                        formattedValue = formatValue(rawValue, GenericClimates);
                        break;
                    case 'KnownAllergensQuestion':
                        formattedValue = formatValue(rawValue, CommonAllergens, true);
                        break;
                    case 'SkinCareGoalsQuestion':
                        formattedValue = formatValue(rawValue, SkincareGoals, true);
                        break;
                    default:
                        formattedValue = rawValue || 'Not set';
                }
                
                const displayNames = {
                    'SkinTypeQuestion': 'Skin type',
                    'SkinToneQuestion': 'Skin tone',
                    'SkinSensitivityQuestion': 'Sensitivity',
                    'SkinConcernsQuestion': 'Skin concerns',
                    'BreakoutLocationsQuestion': 'Breakout areas',
                    // 'BreakoutPainSeverityQuestion': 'Breakout severity',
                    // 'MedicationRoutineQuestion': 'Medications',
                    'TypicalClimateQuestion': 'Typical climate',
                    'KnownAllergensQuestion': 'Unwanted ingredients',
                    'SkinCareGoalsQuestion': 'Skincare goals'
                };
                
                questions.push({
                    id: questionId,
                    name: displayNames[questionId],
                    value: formattedValue
                });
            }
        });
        
        return questions;
    }, [userData])

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <EditSkinProfileScreenHeader />

                <ScrollView
                    contentContainerStyle={DefaultStyles.scrollContainer}
                >
                    <View
                        style={styles.itemContainer}
                    >
                        {profileQuestions.map((q, idx) => (
                            <React.Fragment
                                key={idx}
                            >
                                <SkinProfileQuestionShortcut
                                    id={q.id}
                                    name={q.name}
                                    value={q.value}
                                />
                                {profileQuestions.length > idx+1 &&
                                    <View style={DefaultStyles.separator} />
                                }
                            </React.Fragment>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

export default EditSkinProfileScreen;

const styles = StyleSheet.create({
    itemContainer: {
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
    },
    flexContainer: {
        gap:6,
        flexDirection:'row',
        alignItems:'center',
        paddingVertical:18,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600',
        color:colors.text.secondary
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.dark
    },
})
import { StyleSheet, Text, View } from "react-native";
import colors from "../../../config/colors";
import DefaultButton from "../../Buttons/DefaultButton";
import * as Haptics from 'expo-haptics'
import { useSignUpFlow } from "../../../context/SignUpFlowContext";
import {Ionicons} from '@expo/vector-icons'
import { darken } from "../../../utils/darken";
import TextDivider from "../../Common/TextDivider";
import DefaultSearchBar from "../../Inputs/DefaultSearchBar";
import IconButton from '../../Buttons/IconButton'
import { useEffect, useState, useMemo, useCallback } from "react";
import DefaultPill from "../../Options/DefaultPill";
import DefaultText from "components/Text/DefaultText";
import DefaultStyles from "config/styles";

const capitalize = (str) => 
    String(str).split(' ').map(
        str => str.charAt(0).toUpperCase()
        .concat(str.slice(1, str.length))
    ).join(' ');

const AidedInputQuestion = ({ question }) => {

    const {answers, setAnswers, answerCurrent} = useSignUpFlow();
    const [customInput, setCustomInput] = useState('')

    // Memoize the current answer to avoid repeated object access
    const currentAnswer = useMemo(() => answers[question.id] || [], [answers, question.id]);
    
    // Memoize the placeholder text
    const placeholder = useMemo(() => 
        question?.element ? `Add ${question?.element}...` : 'Add here...', 
        [question?.element]
    );

    const addToAnswers = useCallback((value) => {
        const cleaned = capitalize(value).trim()
        if (cleaned) {
            setAnswers(prev => ({
                ...prev,
                [question.id]: [...(prev[question.id] || []), cleaned]
            }));
        }
    }, [question.id, setAnswers]);

    const removeFromAnswers = useCallback((value) => {
        setAnswers(prev => ({
            ...prev,
            [question.id]: prev[question.id].filter(v => v !== value)
        }));
    }, [question.id, setAnswers]);

    const addFromCustomInput = useCallback(() => {
        const cleaned = capitalize(customInput).trim()

        if (cleaned) {
            const alreadyExists = currentAnswer.some(
                item => item === cleaned
            );

            if (!alreadyExists) {
                addToAnswers(cleaned);
            }

            setCustomInput('');
        }
    }, [customInput, currentAnswer, addToAnswers]);

    useEffect(() => {
        if (answers[question.id] == null) {
            setAnswers(prev => ({
                ...prev,
                [question.id]: []
            }))
        }
    }, [answers, question.id, setAnswers])

    return (
        <View style={styles.container}>
            <View style={styles.customAddContainer}>
                <DefaultSearchBar
                    placeholder={placeholder}
                    value={customInput}
                    onChangeText={setCustomInput}
                    onSubmitEditing={addFromCustomInput}
                />
                <IconButton
                    icon='add'
                    size={28}
                    color={colors.text.primary}
                    style={styles.addButton}
                    onPress={addFromCustomInput}
                />
            </View>
            
            {currentAnswer.length > 0 &&
                <View style={styles.pillContainer}>
                    {currentAnswer.map((ans, idx) => {

                        return (
                            <DefaultPill
                                key={idx}
                                text={ans}
                                endAdornment={
                                    <Ionicons name='close' size={18} color={colors.text.secondary} />
                                }
                                onPress={() => {
                                    removeFromAnswers(ans)
                                }}
                            />
                        )
                    })}
                </View>
            }

            <View style={styles.optionsContainer}>
                {question?.options?.map((option, idx) => {
                    const isSelected = currentAnswer.includes(option.title)
                    return (
                        <DefaultButton
                        extraStyles={{text:DefaultStyles.button.signUpOption.text}}
                            key={idx}
                            title={option.title}
                            isActive={isSelected}
                            startAdornment={
                                <Ionicons
                                    name={isSelected ? 'checkbox' : 'square-outline'}
                                    color={isSelected ? colors.text.primary : colors.text.secondary}
                                    size={36}
                                />
                            }
                            description={option.description}
                            hapticType={Haptics.ImpactFeedbackStyle.Light}
                            onPress={() => {
                                if (isSelected) {
                                    removeFromAnswers(option.title)
                                } else {
                                    addToAnswers(option.title)
                                }
                            }}
                        />
                    )
                })}
            </View>
        </View>
    )
};

export default AidedInputQuestion;

const styles = StyleSheet.create({
    container: {
        flex:1,
        gap:20,
        width:'100%',
        display:'flex',
        flexDirection:'column',
    },
    customAddContainer: {
        display:'flex',
        width:'100%',
        flexDirection:'row',
        gap:16,
    },
    pillContainer: {
        flexDirection:'row',
        flexWrap:'wrap',
        gap:8,
    },
    optionsContainer: {
        flex:1,
        flexDirection:'column',
        gap:16,
    },
    addButton: {
        aspectRatio:'1 / 1',
        borderRadius:32,
        backgroundColor:colors.background.primary,
    },
})
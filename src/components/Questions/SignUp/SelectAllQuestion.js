import { StyleSheet, Text, View } from "react-native";
import colors from "../../../config/colors";
import DefaultButton from "../../Buttons/DefaultButton";
import * as Haptics from 'expo-haptics'
import { useSignUpFlow } from "../../../context/SignUpFlowContext";
import {Ionicons} from '@expo/vector-icons'
import { darken } from "../../../utils/darken";
import TextDivider from "../../Common/TextDivider";
import DefaultStyles from "config/styles";
import { useEffect } from "react";

const SelectAllQuestion = ({ question }) => {

    const {answers, setAnswers, answerCurrent} = useSignUpFlow();
    const hasSelectNoneOption = question?.options?.findIndex(option => option?.value === 0) !== -1;

    return question?.options?.map((option, idx) => {
        const isActive = answers[question?.id]?.includes(option?.value)
        const isDisabled = hasSelectNoneOption && (answers[question.id]?.length ? answers[question.id][0] === 0 : false) && option.value !== 0

        return (
            <View 
                key={idx} 
                style={styles.container}
            >
                <DefaultButton
                    extraStyles={{text:DefaultStyles.button.signUpOption.text}}
                    key={idx}
                    title={option?.title}
                    isActive={isActive}
                    disabled={isDisabled}
                    startAdornment={
                        <Ionicons
                            name={isActive ? 'checkbox' : 'square-outline'}
                            color={isDisabled ? colors.text.primary : isActive ? colors.text.primary : colors.text.secondary}
                            size={36}
                        />
                    }
                    description={option.description}
                    hapticType={Haptics.ImpactFeedbackStyle.Light}
                    onPress={() => {
                        if (option.value) {
                            setAnswers(prev => {
                                const prevAnswers = prev[question.id] || [];
                                const exists = prevAnswers.includes(option.value);
                                return {
                                    ...prev,
                                    [question.id]: exists
                                        ? prevAnswers.filter(v => v !== option.value)
                                        : [...prevAnswers, option.value],
                                };
                            });
                        } else {
                            answerCurrent(
                                question.id,
                                answers[question.id]?.includes(option.value)
                                    ? []
                                    : [option.value],
                            );
                        }
                    }}
                />
                {option.value === 0 &&
                    <TextDivider text='or' />
                }
            </View>
        )
    })
};

export default SelectAllQuestion;

const styles = StyleSheet.create({
    container: {
        gap:16,
        width:'100%',
        flexDirection:'column',
    },
})
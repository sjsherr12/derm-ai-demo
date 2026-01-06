import { Image, StyleSheet, View } from "react-native";
import colors from "../../../config/colors";
import DefaultButton from "../../Buttons/DefaultButton";
import * as Haptics from 'expo-haptics'
import { useSignUpFlow } from "../../../context/SignUpFlowContext";
import {Ionicons} from '@expo/vector-icons';
import DefaultStyles from "config/styles";

const ButtonQuestion = ({ question }) => {

    const {answers, answerCurrent} = useSignUpFlow();

    return question?.options?.map((option, idx) => {
        const isActive = answers[question.id] === option.value

        let adornment;

        if (option?.icon) {
            adornment = <Ionicons name={option.icon} size={24} color={isActive ? colors.text.primary : colors.text.secondary} />
        }
        else if (option?.image) {
            adornment = <Image source={option.image} style={{width:36,height:36}} />
        }

        return (
            <DefaultButton
                extraStyles={{text:DefaultStyles.button.signUpOption.text}}
                key={idx}
                title={option?.title}
                hapticType={Haptics.ImpactFeedbackStyle.Light}
                isActive={isActive}
                startAdornment={adornment}
                onPress={() => answerCurrent(question.id, option.value)}
            />
        )
    })
};

export default ButtonQuestion;
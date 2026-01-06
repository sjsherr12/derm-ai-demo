import { StyleSheet, View } from "react-native";
import colors from "../../../config/colors";
import DefaultButton from "../../Buttons/DefaultButton";
import * as Haptics from 'expo-haptics'
import { useSignUpFlow } from "../../../context/SignUpFlowContext";
import {Ionicons} from '@expo/vector-icons';
import DefaultStyles from "config/styles";

const DescriptiveQuestion = ({ question }) => {

    const {answers, answerCurrent} = useSignUpFlow();

    return question?.options?.map((option, idx) => {
        const isActive = answers[question.id] === option.value

        let adornment;

        if (option?.icon) {
            adornment = <Ionicons name={option?.icon} color={isActive ? '#fff' : '#000'} size={36} />
        }
        else if (option?.color) {
            adornment = <View style={[styles.colorPreview, {borderWidth:isActive*2,borderColor:'#fff', backgroundColor:option?.color}]} />
        }

        return (
            <DefaultButton
                extraStyles={{text:DefaultStyles.button.signUpOption.text}}
                key={idx}
                title={option.title}
                isActive={isActive}
                startAdornment={adornment}
                description={option.description}
                hapticType={Haptics.ImpactFeedbackStyle.Light}
                onPress={() => answerCurrent(question.id, option.value)}
            />
        )
    })
};

export default DescriptiveQuestion;

const styles = StyleSheet.create({
    colorPreview: {
        width:40,
        height:40,
        borderRadius:6,
    }
})
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { useCallback } from "react";
import { Linking, StyleSheet } from "react-native";
import { PrivacyPolicyLink, TermsOfUseLink } from "../../constants/auth";

const LegalText = () => {

    const viewTermsOfUse = useCallback(
        async () => await Linking.openURL(TermsOfUseLink), []
    )

    const viewPrivacyPolicy = useCallback(
        async () => await Linking.openURL(PrivacyPolicyLink), []
    )

    return (
        <DefaultText style={styles.text}>
            By continuing, you agree to Derm AI’s{'\n'}
            <DefaultText
                style={styles.linkText}
                onPress={viewTermsOfUse}
            >
                Terms and Conditions
            </DefaultText>
            <DefaultText> and </DefaultText>
            <DefaultText
                style={styles.linkText}
                onPress={viewPrivacyPolicy}
            >
                Privacy Policy
            </DefaultText>
        </DefaultText>
    )
}

export default LegalText;

const styles = StyleSheet.create({
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        textAlign:'center',
        color:colors.text.darker,
        lineHeight: 18
    },
    linkText: {
        fontWeight:'600',
        color:colors.text.secondary,
        textDecorationLine:'underline'
    }
})
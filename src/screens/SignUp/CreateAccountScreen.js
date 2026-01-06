import LegalText from "components/Common/LegalText";
import AuthOptions from "components/Options/AuthOptions";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { AuthIntent } from "constants/auth";
import { useAuth } from "context/global/AuthContext";
import { useCallback, useEffect, memo } from "react";
import { Button, StyleSheet, View } from "react-native";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import { useSignUpFlow } from "../../context/SignUpFlowContext";
import { useNavigation } from "@react-navigation/native";
import DefaultButton from "../../components/Buttons/DefaultButton";
import {Ionicons} from '@expo/vector-icons'

const CreateAccountScreen = ({
}) => {
    const safeAreaStyles = useSafeAreaStyles();
    
    return (
        <View style={[DefaultStyles.outer, safeAreaStyles.safeAreaAll]}>
            <View style={DefaultStyles.container}>
                <DefaultText
                    style={styles.title}
                >
                    Create an Account
                </DefaultText>

                {/* <DefaultText
                    style={styles.description}
                >
                    Connect your existing anonymous account with a provider to secure your data and access it across devices.
                </DefaultText> */}

                <View style={styles.authOptionsContainer}>
                    <AuthOptions authIntent={AuthIntent.SignUp} />
                </View>

                <View style={styles.bottomContainer}>
                    <LegalText />
                </View>
            </View>
        </View>
    )
}

export default memo(CreateAccountScreen);

const styles = StyleSheet.create({
    container: {
        flex:1,
        gap:16,
        backgroundColor:colors.background.screen,
    },
    title:{
        marginTop:DefaultStyles.container.paddingTop,
        fontSize:DefaultStyles.text.title.medium,
        color:colors.text.secondary,
        fontWeight:'600',
    },
    description: {
        fontSize:DefaultStyles.text.caption.small,
    },
    authOptionsContainer: {
        flex:1,
        justifyContent:'center',
        alignItems:'center',
    },
    bottomContainer: {
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        alignItems:'center',
    }
})
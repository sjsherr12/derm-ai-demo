import DefaultText from 'components/Text/DefaultText';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import { useRedirect } from 'context/RedirectContext';
import { useSignUpFlow } from 'context/SignUpFlowContext';
import * as Notifications from 'expo-notifications'
import * as Haptics from 'expo-haptics'
import { Alert, Linking, StyleSheet } from 'react-native';
import { View } from 'react-native';
import { lighten } from 'utils/lighten';
import SignUpQuestions from 'data/SignUpQuestions';

const EnableNotifications = ({question}) => {
    const {answerCurrent} = useSignUpFlow();
    const {replace} = useRedirect();
    const nextQuestion = SignUpQuestions[SignUpQuestions.findIndex(q => q.id === question.id)+1].id

    const moveOn = () => replace(nextQuestion)

    const completeAlert = (
        title,
        description,
    ) => {
        Alert.alert(
            title,
            description,
            [
                { text: "Cancel", style: "cancel", onPress: moveOn  },
                { text: "Open Settings", onPress: () => {
                    Linking.openSettings()
                }},
            ]
        )
    }

    const intentEnableNotifications = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        const {status} = await Notifications.requestPermissionsAsync();
        answerCurrent(question.id, status)
        if (status !== 'granted') {
            completeAlert(
                "Enable Notifications",
                "Notifications are currently disabled. To receive reminders and updates, please enable them in your device settings.",
            )
        }
        else moveOn();
    }

    const intentDisableNotifications = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        const status = (await Notifications.getPermissionsAsync()).status;
        answerCurrent(question.id, status)
        if (status === 'granted') {
            completeAlert(
                "Disable Notifications",
                "Notifications are currently enabled. To stop receiving reminders, turn them off in your device settings.",
            )
        }
        else moveOn();
    }

    return (
        <View
            style={styles.container}
        >
            <View
                style={styles.textContainer}
            >
                <DefaultText
                    style={styles.title}
                >
                    Derm AI would like to send you notifications.
                </DefaultText>

                {/* <DefaultText
                    style={styles.caption}
                >
                    Notifications help you stay on track with scans and skincare progress.
                </DefaultText> */}
            </View>

            <View
                style={styles.optionsContainer}
            >
                <DefaultText
                    style={[
                        styles.option,
                        {
                            borderRightColor:colors.accents.stroke,
                            borderRightWidth:1,
                        }
                    ]}
                    onPress={intentDisableNotifications}
                >
                    Don't Allow
                </DefaultText>
                
                <DefaultText
                    style={[
                        styles.option,
                        {
                            color:colors.text.primary,
                            fontWeight:'bold',
                            fontSize:DefaultStyles.text.caption.small,
                            backgroundColor:colors.background.primary,
                        }
                    ]}
                    onPress={intentEnableNotifications}
                >
                    Allow
                </DefaultText>
            </View>
        </View>
    )
}

export default EnableNotifications;

const styles = StyleSheet.create({
    container: {
        width:'100%',
        maxWidth:330,
        borderRadius:16,
        overflow:'hidden',
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        boxShadow:'0px 12px 32px rgba(0,0,0,.03)'
    },
    textContainer: {
        padding:DefaultStyles.container.paddingHorizontal,
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        textAlign:'center',
        fontWeight:'600',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        textAlign:'center',
        color:colors.text.lighter,
    },
    optionsContainer: {
        width:'100%',
        borderTopWidth:1,
        borderTopColor:colors.accents.stroke,
        flexDirection:'row',
        alignItems:'center',
    },
    option: {
        flex:1,
        textAlign:'center',
        paddingVertical:DefaultStyles.container.paddingBottom,
    }
})
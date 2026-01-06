import DefaultStyles from "config/styles";
import { Linking, Platform, StyleSheet, View } from "react-native";
import * as Haptics from 'expo-haptics'
import { useNavigation } from "@react-navigation/native";
import colors from "config/colors";
import DefaultText from "components/Text/DefaultText";
import DefaultButton from "components/Buttons/DefaultButton";
import {Ionicons, Entypo} from '@expo/vector-icons'
import IconButton from "components/Buttons/IconButton";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";

const ScanScreenRequestCameraPermission = ({
    
}) => {
    const navigation = useNavigation();
    const safeAreaStyles = useSafeAreaStyles();

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.goBack();
    };

    const handleEnable = () => {
        Linking.openSettings();
    }
    
    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaAll]}
        >
            <View
                style={DefaultStyles.container}
            >
                    <IconButton
                        icon='close'
                        style={[
                            DefaultStyles.button.iconFilled,
                            {
                                marginLeft:'auto',
                            }
                        ]}
                        size={24}
                        onPress={handleClose}
                    />

                    <View
                        style={styles.content}
                    >
                        <View
                            style={styles.camera}
                        >
                            <Entypo
                                name='camera'
                                size={112}
                                color={colors.text.primary}
                            />
                        </View>

                        <DefaultText
                            style={styles.title}
                        >
                            Enable Camera
                        </DefaultText>
                        <DefaultText
                            style={styles.subtitle}
                        >
                            We’ll need this to take face scans and track your progress.
                        </DefaultText>
                    </View>

                    <DefaultButton
                        title='Enable Camera'
                        isActive
                        style={{
                            borderRadius:64,
                        }}
                        onPress={handleEnable}
                    />
            </View>
        </View>
    )
}

export default ScanScreenRequestCameraPermission;

const styles = StyleSheet.create({
    content: {
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        gap:8,
    },
    camera: {
        borderRadius:128,
        width:175,
        height:175,
        marginBottom:32,
        backgroundColor:colors.background.primary,
        alignItems:'center',
        justifyContent:'center',
    },
    title: {
        fontSize: DefaultStyles.text.title.medium,
        fontWeight: 'bold',
        color: colors.text.secondary,
    },
    subtitle: {
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.darker,
        textAlign: 'center',
        marginTop: 8,
    },
})
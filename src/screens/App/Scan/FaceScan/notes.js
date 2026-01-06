import { SafeAreaView, StyleSheet, View, TouchableWithoutFeedback, Keyboard } from "react-native"
import DefaultStyles from "../../../../config/styles"
import DefaultText from "../../../../components/Text/DefaultText";
import IconButton from "../../../../components/Buttons/IconButton";
import { useNavigation } from "@react-navigation/native";
import colors from "../../../../config/colors";
import { useData } from "../../../../context/global/DataContext";
import DefaultTextInput from "../../../../components/Text/DefaultTextInput";
import { useState } from "react";
import DefaultButton from "../../../../components/Buttons/DefaultButton";
import {FontAwesome6} from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

const ScanScreenAddNotes = () => {

    const navigation = useNavigation();

    const {
        additionalNotes,
        setAdditionalNotes
    } = useData();

    const [preAdditionalNotes, setPreAdditionalNotes] = useState(additionalNotes)

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View
                style={DefaultStyles.outer}
            >
                <SafeAreaView
                    style={DefaultStyles.safeArea}
                >
                    <View
                        style={styles.container}
                    >
                        <View
                            style={styles.flexContainer}
                        >
                            <DefaultText
                                style={styles.title}
                            >
                                Additional Notes
                            </DefaultText>

                            <IconButton
                                style={styles.iconButton}
                                icon='close'
                                size={24}
                                onPress={() => navigation.goBack()}
                            />
                        </View>

                        <DefaultText
                            style={styles.text}
                        >
                            If you have any particular skin conditions you'd like to highlight or put emphasis on, please detail them here.
                        </DefaultText>

                        <DefaultTextInput
                            style={styles.inputContainer}
                            value={preAdditionalNotes}
                            onChangeText={setPreAdditionalNotes}
                            maxLength={250}
                            multiline
                            numberOfLines={5}
                            placeholder='Add additional information here...'
                        />

                        <DefaultButton
                            isActive
                            title='Save notes'
                            style={{
                                marginTop:'auto'
                            }}
                            endAdornment={
                                (
                                    <FontAwesome6 name="check" size={24} color="white" />
                                )
                            }
                            onPress={() => {
                                setAdditionalNotes(preAdditionalNotes)
                                navigation.goBack();
                            }}
                            hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        />
                    </View>
                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    )
}

export default ScanScreenAddNotes;

const styles = StyleSheet.create({
    flexContainer: {
        flexDirection:'row',
        width:'100%',
        alignItems:'center',
        justifyContent:'space-between',
    },
    title: {
        fontSize:DefaultStyles.text.title.small,
        fontWeight:'700',
        color:colors.text.secondary
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
    },
    iconButton: {
        width:36,
        height:36,
        backgroundColor:colors.background.light,
        borderRadius:64,
    },
    container: {
        flex:1,
        gap:24,
        padding:DefaultStyles.container.paddingHorizontal,
        backgroundColor:colors.background.screen,
    },
    inputContainer: {
        fontSize:DefaultStyles.text.caption.small,
        minHeight:100,
        padding:DefaultStyles.container.paddingTop,
        borderWidth:1,
        borderColor:colors.accents.stroke,
        borderRadius:12,
    },
})
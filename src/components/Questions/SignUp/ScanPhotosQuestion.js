import { Alert, Animated, Image, Pressable, StyleSheet, View } from "react-native"
import DefaultStyles from "../../../config/styles"
import DefaultText from "../../Text/DefaultText";
import { useSignUpFlow } from "../../../context/SignUpFlowContext";
import useScalePressAnimation from "../../../hooks/useScalePressAnimation";
import React, { useEffect, useMemo } from "react";
import colors from "../../../config/colors";
import {Ionicons, Entypo, FontAwesome} from '@expo/vector-icons'
import { useNavigation } from "@react-navigation/native";
import * as Haptics from 'expo-haptics'
import DefaultButton from "../../Buttons/DefaultButton";

const ScanPhotosQuestion = ({ question }) => {

    const { answers, answerCurrent } = useSignUpFlow();
    const navigation = useNavigation();

    const hasAnswer = useMemo(
        () => !!answers[question.id] && answers[question.id]?.left && answers[question.id]?.right && answers[question.id]?.front,
        [answers]
    )

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
        navigation.navigate('FaceScan', {
            isSignUp:true,
        })
    }

    const confirmClearImages = () => {
        Alert.alert(
            'Clear Images',
            'Are you sure you want to clear? This will delete all your current photos and start over.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => answerCurrent(question.id, null)
                }
            ]
        )
    }

    return (
        <View style={styles.container}>
            {hasAnswer ? 
                <React.Fragment>
                    <View
                        style={styles.stackedImagesContainer}
                    >
                        <Image
                            style={[
                                styles.image,
                                {
                                    width:'100%',
                                }
                            ]}
                            source={{
                                uri: `data:image/jpeg;base64,${answers[question.id]?.front}`
                            }}
                        />

                        <View
                            style={styles.bottomImageContainer}
                        >
                            <Image
                                style={styles.image}
                                source={{
                                    uri: `data:image/jpeg;base64,${answers[question.id]?.left}`
                                }}
                            />
                            <Image
                                style={styles.image}
                                source={{
                                    uri: `data:image/jpeg;base64,${answers[question.id]?.right}`
                                }}
                            />
                        </View>
                    </View>

                    <DefaultButton
                        title='Clear Images'
                        style={{
                            borderRadius:64,
                            color:colors.text.primary,
                            backgroundColor:colors.accents.error,
                        }}
                        onPress={confirmClearImages}
                    />
                </React.Fragment>

                :

                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                >
                    <Animated.View
                        style={[
                            styles.button,
                            {transform:[{scale}]}
                        ]}
                    >
                        <Entypo
                            name='camera'
                            size={54}
                            color={colors.text.primary}
                        />

                        <DefaultText
                            style={styles.text}
                        >
                            Take Photos
                        </DefaultText>
                    </Animated.View>
                </Pressable>
            }
        </View>
    )
}

export default ScanPhotosQuestion;

const styles = StyleSheet.create({
    container: {
        flex:1,
        gap:16,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        padding:DefaultStyles.container.paddingHorizontal,
        backgroundColor:colors.background.primary,
        borderRadius:12,
        gap:16,
        alignItems:'center',
    },
    text: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'700',
        color:colors.text.primary
    },
    stackedImagesContainer: {
        gap:16,
        flex:1,
        justifyContent:'center',
    },
    bottomImageContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
        width:'100%',
    },
    image: {
        flex:.5,
        aspectRatio:1,
        borderRadius:12,
        borderWidth:5,
        borderColor:colors.text.secondary
    },
})
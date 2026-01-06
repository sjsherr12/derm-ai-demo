import { StyleSheet, Text, View, Image, Button, Linking } from "react-native";
import DefaultButton from "../../components/Buttons/DefaultButton";
import colors from "../../config/colors";
import DefaultStyles from "../../config/styles";
import SignUpQuestions from "../../data/SignUpQuestions";
import * as Haptics from 'expo-haptics'
import DefaultText from "components/Text/DefaultText";
import { useState, memo } from "react";
import DefaultBottomSheet from "components/Containers/DefaultBottomSheet";
import IconButton from "components/Buttons/IconButton";
import AuthOptions from "components/Options/AuthOptions";
import LegalText from "components/Common/LegalText";
import { AuthIntent } from "constants/auth";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import Video from 'react-native-video'
import { useNavigation } from "@react-navigation/native";
const DemoVideo = require('../../assets/extra/demo-video.mp4');
const iPhoneBezel = require('../../assets/extra/iphone-bezel.png')

const IntroductionScreen = ({
}) => {
    const navigation = useNavigation();
    const safeAreaStyles = useSafeAreaStyles();
    const [signInSheetOpen, setSignInSheetOpen] = useState(false)
    
    return (
        <View style={[DefaultStyles.outer, safeAreaStyles.safeAreaAll]}>
            <View style={styles.container}>
                <View style={styles.graphicContainer}>
                    <View style={styles.graphicWrapper}>
                        <View style={styles.videoWrapper}>
                            <Video
                                source={DemoVideo}
                                style={styles.video}
                                resizeMode='contain'
                                repeat
                            />
                        </View>
                        <Image
                            source={iPhoneBezel}
                            style={styles.iphoneFrame}
                            resizeMode='contain'
                        />
                    </View>
                </View>
                <View style={styles.bottomContainer}>
                    <DefaultText style={styles.title}>
                        Organic skincare made simple.
                    </DefaultText>
                    <DefaultButton
                        isActive
                        title='Get Started'
                        style={{
                            borderRadius:64,
                        }}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        onPress={() => navigation.navigate(SignUpQuestions[0].id)}
                    />

                    <DefaultText
                        style={styles.text}
                    >
                        Already have an account? <DefaultText style={{fontWeight:'700'}} onPress={() => setSignInSheetOpen(true)}>Sign in</DefaultText>
                    </DefaultText>
                </View>
            </View>

            <DefaultBottomSheet
                isOpen={signInSheetOpen}
                onClose={() => setSignInSheetOpen(false)}
                snapPoints={['50%']}
            >
                <View style={signInSheetStyles.container}>
                    <View style={signInSheetStyles.header}>
                        <IconButton
                            name='placeholder'
                            color='transparent'
                            size={16}
                            style={signInSheetStyles.iconButton}
                        />
                        <DefaultText style={signInSheetStyles.title}>
                            Sign In
                        </DefaultText>
                        
                        <IconButton
                            icon='close'
                            size={16}
                            style={[
                                signInSheetStyles.iconButton,
                                {
                                    borderWidth:1,
                                    borderColor:colors.accents.stroke,
                                }
                            ]}
                            hapticType={Haptics.ImpactFeedbackStyle.Light}
                            onPress={() => setSignInSheetOpen(false)}
                        />
                    </View>

                    <View style={signInSheetStyles.authOptionsContainer}>
                        <AuthOptions authIntent={AuthIntent.SignIn}/>
                    </View>

                    <View style={signInSheetStyles.bottomContainer}>
                        <LegalText />
                    </View>
                </View>
            </DefaultBottomSheet>
        </View>
    )
}

export default memo(IntroductionScreen);

const styles = StyleSheet.create({
    container: {
        backgroundColor:colors.background.screen,
        flex:1,
    },
    graphicContainer: {
        flex:1,
        backgroundColor:colors.background.screen,
        alignItems:'center',
        justifyContent:'center',
    },
    graphicWrapper: {
        width:'75%',
        height:'90%',
        position:'relative',
        alignItems:'center',
        justifyContent:'center',
    },
    videoWrapper: {
        width:'96%',
        height:'96%',
        overflow:'hidden',
        borderRadius:64,
    },
    video: {
        width:'100%',
        height:'100%',
    },
    iphoneFrame: {
        width:'100%',
        height:'100%',
        position:'absolute',
        top:0,
        left:0,
    },
    bottomContainer: {
        gap:16,
        boxShadow:'0px -30px 32px rgba(0,0,0,.05)',
        borderRadius:48,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        paddingTop:DefaultStyles.container.paddingHorizontal*1.5,
        justifyContent:'flex-end',
        alignItems:'center',
    },
    title: {
        fontSize:DefaultStyles.text.title.large,
        textAlign:'center',
        fontWeight:'600',
        marginBottom:16,
    },
    text: {
        marginTop:4,
        color:colors.text.secondary,
        fontSize:14,
    },
    bolded: {
        fontWeight:'700',
    },
})

const signInSheetStyles = StyleSheet.create({
    container: {
        flex:1,
        paddingBottom:DefaultStyles.container.paddingBottom
    },
    header: {
        flexDirection:'row',
        alignItems:'center',
        padding:DefaultStyles.container.paddingHorizontal,
        paddingTop:0,
        borderBottomWidth:1,
        borderBottomColor:colors.accents.stroke,
    },
    title: {
        textAlign:'center',
        fontSize:DefaultStyles.text.title.small,
        flex:1,
        fontWeight:'500',
    },
    iconButton: {
        width:36,
        height:36,
    },
    authOptionsContainer: {
        flex:1,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    bottomContainer: {
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
})
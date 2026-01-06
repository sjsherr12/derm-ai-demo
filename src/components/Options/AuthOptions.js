const { default: DefaultButton } = require("components/Buttons/DefaultButton")
const { StyleSheet, View, Image, Alert } = require("react-native")
import {Ionicons} from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthIntent } from 'constants/auth'
import { useAuth } from 'context/global/AuthContext'
import * as Haptics from 'expo-haptics'
import { useEffect } from 'react'
import { signInWithApple } from 'services/firebase/appleauth'
import { auth } from 'services/firebase/firebase'
import { useGoogleSignIn, useGoogleLink } from 'services/firebase/googleauth'
import { linkWithApple } from 'services/firebase/appleauth'
import { signInWithEmail, signUpWithEmail, linkWithEmail } from 'services/firebase/emailauth'

const AuthOptions = ({
    authIntent
}) => {
    const {setAuthIntent, user} = useAuth();
    const {promptAsync: promptGoogleSignIn} = useGoogleSignIn();
    const {promptAsync: promptGoogleLink} = useGoogleLink();

    // Only allow linking for anonymous users during SignUp intent
    const shouldLink = authIntent === AuthIntent.SignUp && user?.isAnonymous;
    
    const handleAppleAuth = async () => {
        // Set the intent first
        setAuthIntent(authIntent);
        
        if (shouldLink) {
            // Anonymous user with SignUp intent - link the account
            const res = await linkWithApple();
            // Navigation to app will happen automatically via CustomNavigation when user.isAnonymous changes
        } else {
            // All other cases - regular sign in (no user, anonymous with SignIn, non-anonymous)
            const res = await signInWithApple();
        }
    }

    const handleGoogleAuth = async () => {
        // Set the intent first  
        setAuthIntent(authIntent);
        
        if (shouldLink) {
            // Anonymous user with SignUp intent - link the account
            const res = await promptGoogleLink();
            // Navigation to app will happen automatically via CustomNavigation when user.isAnonymous changes
        } else {
            // All other cases - regular sign in (no user, anonymous with SignIn, non-anonymous)
            const res = await promptGoogleSignIn();
        }
    }

    // const handleEmailAuth = async () => {
    //     // Set the intent first
    //     setAuthIntent(authIntent);
        
    //     if (shouldLink) {
    //         // Anonymous user with SignUp intent - link the account
    //         const res = await linkWithEmail();
    //         // Navigation to app will happen automatically via CustomNavigation when user.isAnonymous changes
    //     } else {
    //         // For regular auth, determine sign in vs sign up based on intent
    //         if (authIntent === AuthIntent.SignUp) {
    //             const res = await signUpWithEmail();
    //         } else {
    //             const res = await signInWithEmail();
    //         }
    //     }
    // }

    const buttonTitle = shouldLink ? 'Sign up with' : 'Continue with';

    return (
        <View style={styles.container}>
            <DefaultButton
                title={`${buttonTitle} Apple`}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                startAdornment={<Ionicons name='logo-apple' size={24} color='white' />}
                onPress={handleAppleAuth}
                style={{
                    backgroundColor:'#000000',
                    color:'#ffffff',
                }}
            />
            <DefaultButton
                title={`${buttonTitle} Google`}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                startAdornment={
                    <Image 
                        source={{uri:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png'}}
                        width={24} height={24}
                    />
                }
                onPress={handleGoogleAuth}
            />
            {/* <DefaultButton
                title={`${buttonTitle} Email`}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                startAdornment={<Ionicons name='mail' size={24} color='white' />}
                onPress={handleEmailAuth}
                style={{
                    backgroundColor:'#007AFF',
                    color:'#ffffff',
                }}
            /> */}
        </View>
    )
}

export default AuthOptions;

const styles = StyleSheet.create({
    container: {
        width:'100%',
        gap:16,
    }
})
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, linkWithCredential, signOut, updateProfile } from 'firebase/auth';
import { auth } from './firebase';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { userAccountExists } from 'utils/user';
import { useNavigation } from '@react-navigation/native';
import { useRedirect } from '../../context/RedirectContext';

export function useGoogleSignIn() {
    const redirectUri = makeRedirectUri({
        useProxy:false,
    })

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: Constants.expoConfig.extra.GOOGLE_EXPO_CLIENT_ID,
        webClientId: Constants.expoConfig.extra.GOOGLE_WEB_CLIENT_ID,
        iosClientId: Constants.expoConfig.extra.GOOGLE_IOS_CLIENT_ID,
        androidClientId: Constants.expoConfig.extra.GOOGLE_ANDROID_CLIENT_ID,
        redirectUri,
    });

    useEffect(() => {
        if (!response) return;

        if (response.type !== 'success') {
            if (response.type === 'error') {
                console.error('❌ Google Auth Error:', response.error);
            }
            return;
        }

        const idToken = response.authentication?.idToken;
        if (!idToken) {
            console.warn('No ID token returned from Google');
            return;
        }

        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential);
    }, [response]);

    return {
        promptAsync,
        request,
        loading: !request,
    };
}

export function useGoogleLink() {
    const {replace} = useRedirect();
    const redirectUri = makeRedirectUri({
        useProxy:false,
    })

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: Constants.expoConfig.extra.GOOGLE_EXPO_CLIENT_ID,
        webClientId: Constants.expoConfig.extra.GOOGLE_WEB_CLIENT_ID,
        iosClientId: Constants.expoConfig.extra.GOOGLE_IOS_CLIENT_ID,
        androidClientId: Constants.expoConfig.extra.GOOGLE_ANDROID_CLIENT_ID,
        redirectUri,
    });

    useEffect(() => {
        if (!response) return;

        if (response.type !== 'success') {
            if (response.type === 'error') {
                console.error('❌ Google Link Error:', response.error);
            }
            return;
        }

        const idToken = response.authentication?.idToken;
        if (!idToken) {
            console.warn('No ID token returned from Google');
            return;
        }

        const credential = GoogleAuthProvider.credential(idToken);
        linkWithCredential(auth.currentUser, credential)
            .then(async (result) => {
                // After successful linking, update the user profile with Google info
                if (response.authentication?.accessToken) {
                    try {
                        // Fetch user info from Google API to get profile data
                        const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${response.authentication.accessToken}`);
                        const userInfo = await userInfoResponse.json();
                        
                        // Update Firebase user profile with Google data
                        const profileUpdates = {};
                        if (userInfo.name && !result.user.displayName) {
                            profileUpdates.displayName = userInfo.name;
                        }
                        if (userInfo.picture && !result.user.photoURL) {
                            profileUpdates.photoURL = userInfo.picture;
                        }
                        
                        if (Object.keys(profileUpdates).length > 0) {
                            await updateProfile(result.user, profileUpdates);
                        }
                    } catch (profileError) {
                        console.error('Error updating user profile:', profileError);
                        // Don't fail the whole process if profile update fails
                    }
                }
            })
            .catch(error => {
                console.error('Error during Google linking:', error);
                
                let title = 'Link Error';
                let message = 'Failed to link Google account. Please try again.';
                
                if (error.code === 'auth/credential-already-in-use') {
                    title = 'Account Already Exists';
                    message = 'This Google account is already linked to another user. Please sign in at the home screen instead or try a different Google account.';
                } else if (error.code === 'auth/email-already-in-use') {
                    title = 'Email Already Used';
                    message = 'This email address is already associated with another account. Please sign in at the home screen instead.';
                } else if (error.code === 'auth/operation-not-allowed') {
                    title = 'Operation Not Allowed';
                    message = 'Google sign-in is not enabled. Please contact support.';
                }
                
                Alert.alert(title, message, [
                    {
                        text:'OK',
                        style:'default'
                    },
                    {
                        text:'Back Home',
                        style:'cancel',
                        onPress: () => replace('Introduction')
                    }
                ]);
            });
    }, [response]);

    return {
        promptAsync,
        request,
        loading: !request,
    };
}


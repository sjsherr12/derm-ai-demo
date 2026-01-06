import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, reauthenticateWithCredential, signInWithCredential, linkWithCredential, signOut, updateProfile } from 'firebase/auth';
import * as Crypto from 'expo-crypto';
import { auth } from './firebase';
import { Alert } from 'react-native';
import { userAccountExists } from 'utils/user';

function generateNonce(length = 32) {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const randomBytes = Crypto.getRandomBytes(length);
    return Array.from(randomBytes)
        .map(byte => charset[byte % charset.length])
        .join('');
}

export async function signInWithApple() {
    try {
        const rawNonce = generateNonce();
        const hashedNonce = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            rawNonce
        );

        const appleCredential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
            nonce: hashedNonce
        });

        const { identityToken } = appleCredential;

        if (!identityToken) {
            throw new Error('Apple Sign-In failed: no identity token returned');
        }

        const provider = new OAuthProvider('apple.com');
        const firebaseCredential = provider.credential({
            idToken: identityToken,
            rawNonce: rawNonce,
        });

        const result = await signInWithCredential(auth, firebaseCredential);
        return result.user;

    } catch (err) {
        if (err.code === 'ERR_REQUEST_CANCELED') return null;
        Alert.alert('Apple Sign-In Error', err?.code)
        throw err;
    }
}

export async function linkWithApple() {
    try {
        const rawNonce = generateNonce();
        const hashedNonce = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            rawNonce
        );

        const appleCredential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
            nonce: hashedNonce
        });

        const { identityToken } = appleCredential;

        if (!identityToken) {
            throw new Error('Apple Sign-In failed: no identity token returned');
        }

        const provider = new OAuthProvider('apple.com');
        const firebaseCredential = provider.credential({
            idToken: identityToken,
            rawNonce: rawNonce,
        });

        // Link the credential with the current anonymous user
        const result = await linkWithCredential(auth.currentUser, firebaseCredential);
        
        // After successful linking, update the user profile with Apple info
        try {
            const profileUpdates = {};
            
            // Apple provides fullName in the credential response
            if (appleCredential.fullName) {
                const firstName = appleCredential.fullName.givenName;
                const lastName = appleCredential.fullName.familyName;
                
                if ((firstName || lastName) && !result.user.displayName) {
                    const displayName = [firstName, lastName].filter(Boolean).join(' ');
                    if (displayName.trim()) {
                        profileUpdates.displayName = displayName;
                    }
                }
            }
            
            // Note: Apple doesn't provide profile pictures
            
            if (Object.keys(profileUpdates).length > 0) {
                await updateProfile(result.user, profileUpdates);
            }
        } catch (profileError) {
            console.error('Error updating user profile:', profileError);
            // Don't fail the whole process if profile update fails
        }
        
        return result.user;

    } catch (err) {
        if (err.code === 'ERR_REQUEST_CANCELED') return null;
        
        let title = 'Apple Link Error';
        let message = 'Failed to link Apple ID. Please try again.';
        
        if (err.code === 'auth/credential-already-in-use') {
            title = 'Account Already Exists';
            message = 'This Apple ID is already linked to another user. Please sign in at the home screen instead or try a different Apple ID.';
        } else if (err.code === 'auth/email-already-in-use') {
            title = 'Email Already Used';
            message = 'This email address is already associated with another account. Please sign in at the home screen instead.';
        } else if (err.code === 'auth/operation-not-allowed') {
            title = 'Operation Not Allowed';
            message = 'Apple Sign-In is not enabled. Please contact support.';
        } else if (err.code === 'auth/invalid-credential') {
            title = 'Invalid Credential';
            message = 'The Apple ID credential is invalid. Please try again.';
        }
        
        Alert.alert(title, message, [
            {
                text:'OK',
                style:'default'
            },
            {
                text:'Back Home',
                style:'cancel'
            }
        ]);
        throw err;
    }
}
import { EmailAuthProvider, signInWithCredential, linkWithCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './firebase';
import { Alert } from 'react-native';

function promptEmailPasswordAlert(isSignUp = false) {
    return new Promise((resolve) => {
        const title = isSignUp ? 'Sign Up with Email' : 'Sign In with Email';
        
        Alert.prompt(
            title,
            '',
            [
                {
                    text: 'Cancel',
                    onPress: () => resolve(null),
                    style: 'cancel',
                },
                {
                    text: 'Next',
                    onPress: (email) => {
                        if (!email || !email.includes('@')) {
                            Alert.alert('Invalid Email', 'Please enter a valid email address');
                            resolve(null);
                            return;
                        }
                        
                        Alert.prompt(
                            title,
                            'Password:',
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => resolve(null),
                                    style: 'cancel',
                                },
                                {
                                    text: isSignUp ? 'Sign Up' : 'Sign In',
                                    onPress: (password) => {
                                        if (!password || password.length < 6) {
                                            Alert.alert('Invalid Password', 'Password must be at least 6 characters');
                                            resolve(null);
                                            return;
                                        }
                                        resolve({ email, password });
                                    },
                                },
                            ],
                            'secure-text'
                        );
                    },
                },
            ],
            'plain-text'
        );
    });
}

export async function signInWithEmail() {
    try {
        const credentials = await promptEmailPasswordAlert(false);
        if (!credentials) return null;
        
        const { email, password } = credentials;
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
        
    } catch (err) {
        let title = 'Sign In Error';
        let message = 'Failed to sign in. Please try again.';
        
        if (err.code === 'auth/user-not-found') {
            title = 'Account Not Found';
            message = 'No account found with this email address. Please sign up first.';
        } else if (err.code === 'auth/wrong-password') {
            title = 'Invalid Password';
            message = 'The password is incorrect. Please try again.';
        } else if (err.code === 'auth/invalid-email') {
            title = 'Invalid Email';
            message = 'Please enter a valid email address.';
        } else if (err.code === 'auth/user-disabled') {
            title = 'Account Disabled';
            message = 'This account has been disabled. Please contact support.';
        } else if (err.code === 'auth/too-many-requests') {
            title = 'Too Many Attempts';
            message = 'Too many failed attempts. Please try again later.';
        }
        
        Alert.alert(title, message);
        throw err;
    }
}

export async function signUpWithEmail() {
    try {
        const credentials = await promptEmailPasswordAlert(true);
        if (!credentials) return null;
        
        const { email, password } = credentials;
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
        
    } catch (err) {
        let title = 'Sign Up Error';
        let message = 'Failed to create account. Please try again.';
        
        if (err.code === 'auth/email-already-in-use') {
            title = 'Account Exists';
            message = 'An account with this email already exists. Please sign in instead.';
        } else if (err.code === 'auth/invalid-email') {
            title = 'Invalid Email';
            message = 'Please enter a valid email address.';
        } else if (err.code === 'auth/weak-password') {
            title = 'Weak Password';
            message = 'Password should be at least 6 characters long.';
        } else if (err.code === 'auth/operation-not-allowed') {
            title = 'Operation Not Allowed';
            message = 'Email sign-up is not enabled. Please contact support.';
        }
        
        Alert.alert(title, message);
        throw err;
    }
}

export async function linkWithEmail() {
    try {
        const credentials = await promptEmailPasswordAlert(true);
        if (!credentials) return null;
        
        const { email, password } = credentials;
        const credential = EmailAuthProvider.credential(email, password);
        
        const result = await linkWithCredential(auth.currentUser, credential);
        return result.user;
        
    } catch (err) {
        let title = 'Email Link Error';
        let message = 'Failed to link email account. Please try again.';
        
        if (err.code === 'auth/credential-already-in-use') {
            title = 'Account Already Exists';
            message = 'This email is already linked to another user. Please sign in at the home screen instead or try a different email.';
        } else if (err.code === 'auth/email-already-in-use') {
            title = 'Email Already Used';
            message = 'This email address is already associated with another account. Please sign in at the home screen instead.';
        } else if (err.code === 'auth/operation-not-allowed') {
            title = 'Operation Not Allowed';
            message = 'Email linking is not enabled. Please contact support.';
        } else if (err.code === 'auth/invalid-credential') {
            title = 'Invalid Credential';
            message = 'The email credential is invalid. Please try again.';
        } else if (err.code === 'auth/weak-password') {
            title = 'Weak Password';
            message = 'Password should be at least 6 characters long.';
        }
        
        Alert.alert(title, message, [
            {
                text: 'OK',
                style: 'default'
            },
            {
                text: 'Back Home',
                style: 'cancel'
            }
        ]);
        throw err;
    }
}
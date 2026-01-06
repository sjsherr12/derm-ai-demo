import React, { createContext, useContext, useEffect, useState, useReducer } from 'react';
import { getAuth, onAuthStateChanged, onIdTokenChanged, signOut, signInAnonymously, deleteUser } from 'firebase/auth';
import { auth } from 'services/firebase/firebase';
import Purchases, { PurchasesOfferings, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import Constants from 'expo-constants'
import * as SplashScreen from 'expo-splash-screen'
import { AuthIntent } from 'constants/auth';
import { userAccountExists } from 'utils/user';
import { Alert, AppState } from 'react-native';
import { useRedirect, redirectContextNavigationRef } from '../RedirectContext';
import { useSignUpFlow } from '../SignUpFlowContext';
import { setupNotifications } from 'services/notifications';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase/firebase';
import { doc, setDoc, getDoc, query, collection, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { ReferralStatus } from '../../constants/signup';

// Splash screen management is now handled in App.js

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const {replace, navigate} = useRedirect();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasProAccess, setHasProAccess] = useState(false);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [appStable, setAppStable] = useState(false);
    const [appUserId, setAppUserId] = useState(null);
    const [authIntent, setAuthIntent] = useState(AuthIntent.Unknown);
    const [hasAskedSkip, setHasAskedSkip] = useState(false)
    const [hasPendingInfluencerDiscount, setHasPendingInfluencerDiscount] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(null);

    // NEW REVENUECAT CODE
    const checkSubscriptionStatus = async (firebaseUser = null) => {
        try {
            setSubscriptionLoading(true);
            
            const customerInfo = await Purchases.getCustomerInfo();
            
            // Update RevenueCat appUserId from customer info
            setAppUserId(customerInfo.originalAppUserId);
            
            // Check if user has "pro" entitlement
            const hasProEntitlement = customerInfo.entitlements.active['pro'] !== undefined;
            
            setHasProAccess(hasProEntitlement);

            const authUser = firebaseUser || user;

            if (
                authUser &&
                !authUser.isAnonymous &&
                !hasProEntitlement
            ) {
                navigate('InAppPaywall')
            }

            return hasProEntitlement;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const checkInfluencerDiscount = async (userId) => {
        try {
            if (!userId) return;
            
            const pendingReferralRef = doc(db, 'pendingReferrals', userId);
            const pendingReferralDoc = await getDoc(pendingReferralRef);
            
            if (pendingReferralDoc.exists()) {
                const pendingReferralData = pendingReferralDoc.data();
                const enteredCode = pendingReferralData.code

                if (
                    pendingReferralData.status === ReferralStatus.Pending &&
                    !pendingReferralData?.paid
                ) {
                    const influencerCodesCollectionRef = collection(db, 'influencerCodes')
                    const influencerCodeQuery = query(
                        influencerCodesCollectionRef,
                        where('code', '==', enteredCode),
                        limit(1)
                    )
                    const influencerCodeSnapshot = await getDocs(influencerCodeQuery);

                    if (!influencerCodeSnapshot.empty) {
                        const influencerCodeDoc = influencerCodeSnapshot.docs[0].data()

                        setHasPendingInfluencerDiscount(true);
                        setDiscountPercent(influencerCodeDoc.discountPercent);
                    }
                    return;
                }
            }
            
            setHasPendingInfluencerDiscount(false);
            setDiscountPercent(null);
        } catch (error) {
            console.error('Error checking influencer discount:', error);
            setHasPendingInfluencerDiscount(false);
            setDiscountPercent(null);
        }
    };


    // NEW REVENUECAT CODE
    useEffect(() => {
        const initializeRevenueCat = async () => {
            try {
                // Initialize RevenueCat with your API key
                const API_KEY = Constants.expoConfig?.extra?.REVENUECAT_PUBLIC_API_KEY_APPLE;
                
                if (!API_KEY || typeof API_KEY !== 'string') {
                    console.error('RevenueCat API key is missing or invalid. Please check your app.config.js');
                    return;
                }
                
                // Configure RevenueCat with minimal logging
                Purchases.configure({ 
                    apiKey: API_KEY,
                    debugLogsEnabled: false // Disable debug logs for production
                });
                
                // Set log level to only errors
                Purchases.setLogLevel('ERROR');
            } catch (error) {
                console.error('Error initializing RevenueCat:', error);
            }
        };
        
        initializeRevenueCat();
    }, []);

    useEffect(() => {
        // Use onIdTokenChanged instead of onAuthStateChanged to catch provider linking
        // onIdTokenChanged fires when user properties change, including isAnonymous status
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
            // Auth state changed - process authentication
            if (!firebaseUser) {
                // No user - staying signed out until needed
                // Don't automatically sign in anonymously - only do it when needed for account creation
                setUser(null);
                setLoading(false);
                // SplashScreen hiding is now managed by App.js custom splash transition
                // await SplashScreen.hideAsync();
                return;
            }

            const userExists = await userAccountExists(firebaseUser);

            // ALWAYS check document existence for non-anonymous users
            if (!firebaseUser.isAnonymous) {
                // Non-anonymous user detected - checking if account document exists
                
                if (authIntent === AuthIntent.SignIn) {
                    // Processing SignIn intent
                    if (!userExists) {
                        // SignIn failed - no document found, signing out
                        await deleteUser(firebaseUser);
                        await signOut(auth);
                        Alert.alert('Account Not Found', 'No account found. Please create an account first.');
                        return;
                    }
                    // SignIn validated - user document exists
                    
                } else {
                    // Non-anonymous user with unknown intent
                    if (!userExists) {
                        // No document found for non-anonymous user, signing out
                        await deleteUser(firebaseUser);
                        await signOut(auth);
                        Alert.alert('Account Not Found', 'No account found. Please create an account first.');
                        return;
                    }
                }
            } else {
                if (
                    userExists &&
                    authIntent === AuthIntent.Unknown &&
                    !hasAskedSkip
                ) {
                    Alert.alert(
                        'Previous Progress Found',
                        'We found your previous sign-up progress! You can continue to account creation.',
                        [
                            {
                                text:'Cancel',
                                style:'cancel'
                            },
                            {
                                text:'Continue',
                                style:'default',
                                onPress:() => replace('TryForFree')
                            }
                        ]
                    )
                    setHasAskedSkip(true);
                }
            }

            // Setting user and completing auth
            // User authenticated (anonymous or with provider)
            setUser(firebaseUser);
            
            // Reset auth intent only after successful non-anonymous authentication
            // Don't reset during intermediate anonymous states (like during linking)
            if (authIntent !== AuthIntent.Unknown && !firebaseUser.isAnonymous) {
                setAuthIntent(AuthIntent.Unknown);
            }
            
            // Set up RevenueCat and check subscription status
            try {
                // Always login to RevenueCat with Firebase UID (anonymous or not)
                if (firebaseUser?.uid) {
                    await Purchases.logIn(firebaseUser.uid);
                    await checkSubscriptionStatus(firebaseUser);

                    // Check for influencer discount
                    await checkInfluencerDiscount(firebaseUser.uid);
                }
            } catch (error) {
                console.error('Error with RevenueCat setup:', error);
            }
            
            // Setup notifications only for non-anonymous users who have user documents
            if (firebaseUser.uid && userExists && !firebaseUser.isAnonymous) {
                setupNotifications(firebaseUser.uid).catch(error => {
                    console.error('Failed to setup notifications:', error);
                });
            }

            setLoading(false);
            // SplashScreen hiding is now managed by App.js custom splash transition
            // await SplashScreen.hideAsync();
        });

        return () => unsubscribe();
    }, [authIntent, replace]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active' && user) {
                checkSubscriptionStatus();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [user]);

    // Set app as stable after 3 second
    useEffect(() => {
        const timer = setTimeout(() => {
            setAppStable(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                authIntent,
                setAuthIntent,
                hasProAccess,
                subscriptionLoading,
                checkSubscriptionStatus,
                checkInfluencerDiscount,
                appUserId,
                hasPendingInfluencerDiscount,
                discountPercent,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
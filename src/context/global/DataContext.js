import { useState, useCallback, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { Image, AppState } from 'react-native';
import SignUpQuestions from '../../data/SignUpQuestions';
import { useRoute } from '@react-navigation/native';
import { Animated } from 'react-native';
import { useAuth } from './AuthContext';
import { collection, doc, getDoc, getDocs, getFirestore, query, where, onSnapshot, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth, functions } from 'services/firebase/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { prepareImageForFirebase } from 'utils/images';
import { getUserRoutineCompletions } from '../../utils/streaks';
import useReviewFetcher from './useReviewFetcher';
import { useProductCache } from './ProductCacheProvider';
import useLocalExploreProductsFetcher from './useLocalExploreProductsFetcher';
import useAIChatLoader from './useAIChatLoader';
import { 
    getProductById, 
    getPersonalizedProducts, 
    searchProductsLocally, 
    filterProductsByConcern,
    filterProductsBySkinType,
    filterProductsByCategory,
    getHighSafetyProducts,
    filterProductsAdvanced,
    getTrendingProducts
} from '../../utils/localProductQueries';
import { useSignUpFlow } from '../SignUpFlowContext';

const DataContext = createContext(null)

export const DataProvider = ({
    children,
    deferInitialization = false
}) => {
    const {user} = useAuth();
    const {setAnswers, setDiagnosis} = useSignUpFlow();
    const [ingredients, setIngredients] = useState({}) // cached ingredients object
    const [routineProducts, setRoutineProducts] = useState(null); // just a filtered copy of products state
    const [routineProductsLoading, setRoutineProductsLoading] = useState(false);
    const routineProductsLoadedRef = useRef(false);
    const [routineCompletions, setRoutineCompletions] = useState({
        morningRoutine: [],
        eveningRoutine: []
    });
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [userDataLoading, setUserDataLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const notificationsLoadedRef = useRef(false);
    const notificationsUnsubscribeRef = useRef(null);
    const [personalReferralCode, setPersonalReferralCode] = useState(null);
    const [personalReferralCodeLoading, setPersonalReferralCodeLoading] = useState(false);
    const personalReferralCodeLoadedRef = useRef(false);
    const [pendingReferrals, setPendingReferrals] = useState([]);
    const [pendingReferralsLoading, setPendingReferralsLoading] = useState(false);
    
    // Analysis/Diagnosis states
    const [diagnoses, setDiagnoses] = useState([]); // Recent diagnoses (up to 5)
    const [mostRecentDiagnosis, setMostRecentDiagnosis] = useState(null); // Latest diagnosis
    const [severityTrends, setSeverityTrends] = useState([]); // Severity data over time for charts
    const [analysisStats, setAnalysisStats] = useState(null); // Aggregate stats (total scans, improvements, etc.)
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState('')
    
    // Separate recommendation states
    const [routineRecommendations, setRoutineRecommendations] = useState(null); // Most recent routine recommendations
    const [scanRecommendations, setScanRecommendations] = useState(null); // Most recent scan recommendations
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);

    // AI Chat states
    const [aiChats, setAiChats] = useState([]); // Array of chat documents
    const [aiChatsLoading, setAiChatsLoading] = useState(false);
    const [messagesByChatId, setMessagesByChatId] = useState({}); // Record<chatId, Message[]>
    const [messagesLoadingByChatId, setMessagesLoadingByChatId] = useState({}); // Record<chatId, boolean>
    const aiChatsLoadedRef = useRef(false);

    // Scan limits state for product scanning rate limiting
    const [scanLimits, setScanLimits] = useState(null); // { attempts: number, firstAttemptDate: timestamp }
    const [scanLimitsLoading, setScanLimitsLoading] = useState(false);
    const scanLimitsLoadedRef = useRef(false);

    // Pending face scan processing states
    const [pendingScan, setPendingScan] = useState(null); // { photos: { left, front, right }, additionalNotes, createdAt }
    const [pendingScanProgress, setPendingScanProgress] = useState(0); // 0-100
    const [isPendingScanProcessing, setIsPendingScanProcessing] = useState(false);
    const [pendingScanError, setPendingScanError] = useState(null); // Error message if processing fails
    const processingIntervalRef = useRef(null);
    const completionTimeoutRef = useRef(null);
    
    // Product cache integration - global cache available to all users
    const { 
        products: productsObject, 
        loading: productsLoading, 
        isInitialized: productsInitialized,
        initializeCache,
        downloadAllProducts,
        getCacheMetadata,
        checkAndUpdateProducts
    } = useProductCache();

    // Convert products object to array for brands calculation only
    const productsArray = useMemo(() => {
        if (!productsObject || typeof productsObject !== 'object') {
            return [];
        }
        return Object.values(productsObject);
    }, [productsObject]);
    
    // Keep original products object for backward compatibility
    const products = productsObject;
    
    const reviewFetcher = useReviewFetcher();
    const localExploreProductsFetcher = useLocalExploreProductsFetcher(products);
    const aiChatLoader = useAIChatLoader();

    const fetchRoutineCompletions = useCallback(async () => {
        // Don't fetch routine completions for anonymous users or if no user
        if (!user || user.isAnonymous) return;
        
        setLoading(true);
        try {
            const completions = await getUserRoutineCompletions(user?.uid);
            setRoutineCompletions(completions);
        } catch (error) {
            console.error('Error fetching routine completions:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updateRoutineCompletions = useCallback((routineType, timestamp) => {
        const fieldName = routineType === 0 ? 'morningRoutine' : 'eveningRoutine';
        setRoutineCompletions(prev => ({
            ...prev,
            [fieldName]: [...(prev?.[fieldName] || []), timestamp]
        }));
    }, []);

    const fetchRoutineProducts = useCallback(async (forceRefresh = false) => {
        // Don't fetch routine products for anonymous users or if no user
        if (!user || user.isAnonymous) return;
        if (!forceRefresh && routineProductsLoadedRef.current) return; // Don't refetch if already loaded
        
        setRoutineProductsLoading(true);
        try {
            const db = getFirestore();
            const routineRef = collection(db, `users/${user?.uid}/routineProducts`);
            const snapshot = await getDocs(query(routineRef));

            const routineInfos = snapshot?.docs?.map(doc => ({
                id: doc?.id,
                ...doc?.data(),
            }));

            // Get products from local cache - no need to fetch individually anymore
            const enriched = routineInfos.map(routineInfo => ({
                routineInfo,
                productInfo: getProductById(productsObject, routineInfo?.productId),
            }));

            setRoutineProducts(enriched);
            routineProductsLoadedRef.current = true;
        } catch (error) {
            console.error('Error fetching routine products:', error);
        } finally {
            setRoutineProductsLoading(false);
        }
    }, [user, productsObject]);

    const fetchUserData = useCallback(async (forceRefresh = false) => {
        // Don't fetch data for anonymous users or if no user
        if (!user || user.isAnonymous) return;
        
        if (userData && !forceRefresh) return; // Already loaded, unless forcing refresh
        
        setUserDataLoading(true);
        try {
            const userDocRef = doc(db, 'users', user?.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc?.exists()) {
                setUserData(userDoc?.data());
            } else {
                setUserData(null);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setUserDataLoading(false);
        }
    }, [user, userData]);

    const fetchNotifications = useCallback(async (forceRefresh = false) => {
        // Don't fetch notifications for anonymous users or if no user
        if (!user || user.isAnonymous) return;
        if (!forceRefresh && notificationsLoadedRef.current) return; // Don't refetch if already loaded
        
        setNotificationsLoading(true);
        try {
            const notificationsRef = collection(db, 'users', user?.uid, 'notifications');
            const q = query(notificationsRef, where('sent', '==', true));
            const querySnapshot = await getDocs(q);
            
            const notificationsData = [];
            querySnapshot?.forEach((doc) => {
                notificationsData.push({
                    id: doc?.id,
                    ...doc?.data()
                });
            });
            
            setNotifications(notificationsData);
            notificationsLoadedRef.current = true;
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setNotificationsLoading(false);
        }
    }, [user]);

    const setupNotificationsListener = useCallback(() => {
        // Don't set up listener for anonymous users or if no user
        if (!user || user.isAnonymous) return;
        
        // Clean up existing listener if any
        if (notificationsUnsubscribeRef?.current) {
            notificationsUnsubscribeRef?.current();
            notificationsUnsubscribeRef.current = null;
        }
        
        setNotificationsLoading(true);
        
        const notificationsRef = collection(db, 'users', user?.uid, 'notifications');
        const q = query(notificationsRef, where('sent', '==', true));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notificationsData = [];
            querySnapshot?.forEach((doc) => {
                notificationsData.push({
                    id: doc?.id,
                    ...doc?.data()
                });
            });
            
            setNotifications(notificationsData);
            setNotificationsLoading(false);
            notificationsLoadedRef.current = true;
        }, (error) => {
            console.error('Error in notifications listener:', error);
            setNotificationsLoading(false);
        });
        
        notificationsUnsubscribeRef.current = unsubscribe;
    }, [user]);

    const fetchPendingReferrals = useCallback(async (referralCode) => {
        if (!referralCode) return;

        setPendingReferralsLoading(true);
        try {
            const pendingReferralsRef = collection(db, 'pendingReferrals');
            const q = query(pendingReferralsRef, where('code', '==', referralCode));
            const querySnapshot = await getDocs(q);
            
            const pendingReferralsData = [];
            querySnapshot?.forEach((doc) => {
                pendingReferralsData.push({
                    id: doc?.id,
                    ...doc?.data()
                });
            });
            
            setPendingReferrals(pendingReferralsData);
        } catch (error) {
            console.error('Error fetching pending referrals:', error);
            setPendingReferrals([]);
        } finally {
            setPendingReferralsLoading(false);
        }
    }, []);

    const fetchPersonalReferralCode = useCallback(async (forceRefresh = false) => {
        // Don't fetch referral codes for anonymous users or if no user
        if (!user || user.isAnonymous) return;
        if (!forceRefresh && personalReferralCodeLoadedRef.current) return;
        
        setPersonalReferralCodeLoading(true);
        try {
            const referralCodeDocRef = doc(db, 'referralCodes', user?.uid);
            const referralCodeDoc = await getDoc(referralCodeDocRef);
            
            if (referralCodeDoc?.exists()) {
                const referralData = referralCodeDoc?.data();
                setPersonalReferralCode(referralData);
                
                // Chain the pending referrals fetch if we have a code
                if (referralData?.code) {
                    await fetchPendingReferrals(referralData?.code);
                }
            } else {
                setPersonalReferralCode(null);
                setPendingReferrals([]);
            }
            personalReferralCodeLoadedRef.current = true;
        } catch (error) {
            console.error('Error fetching personal referral code:', error);
            setPersonalReferralCode(null);
            setPendingReferrals([]);
        } finally {
            setPersonalReferralCodeLoading(false);
        }
    }, [user, fetchPendingReferrals]);

    const clearAllData = useCallback(() => {
        setAnswers({})
        setDiagnosis(null)
        setIngredients({});
        setRoutineProducts(null);
        setRoutineProductsLoading(false);
        routineProductsLoadedRef.current = false;
        setRoutineCompletions({
            morningRoutine: [],
            eveningRoutine: []
        });
        setLoading(false);
        
        // Clear analysis data
        setDiagnoses([]);
        setMostRecentDiagnosis(null);
        setSeverityTrends([]);
        setAnalysisStats(null);
        setAnalysisLoading(false);
        
        // Clear recommendation data
        setRoutineRecommendations(null);
        setScanRecommendations(null);
        setRecommendationsLoading(false);
        
        // Clear user data
        setUserData(null);
        setUserDataLoading(false);
        
        // Clear notifications and cleanup listener
        setNotifications([]);
        setNotificationsLoading(false);
        notificationsLoadedRef.current = false;
        if (notificationsUnsubscribeRef?.current) {
            notificationsUnsubscribeRef?.current();
            notificationsUnsubscribeRef.current = null;
        }
        
        // Clear personal referral code
        setPersonalReferralCode(null);
        setPersonalReferralCodeLoading(false);
        personalReferralCodeLoadedRef.current = false;
        
        // Clear pending referrals
        setPendingReferrals([]);
        setPendingReferralsLoading(false);

        // Clear AI chat data
        setAiChats([]);
        setAiChatsLoading(false);
        setMessagesByChatId({});
        setMessagesLoadingByChatId({});
        aiChatsLoadedRef.current = false;

        // Clear scan limits data
        setScanLimits(null);
        setScanLimitsLoading(false);
        scanLimitsLoadedRef.current = false;

        // Clear pending scan data
        setPendingScan(null);
        setPendingScanProgress(0);
        setIsPendingScanProcessing(false);
        setPendingScanError(null);
        if (processingIntervalRef.current) {
            clearInterval(processingIntervalRef.current);
            processingIntervalRef.current = null;
        }
        if (completionTimeoutRef.current) {
            clearTimeout(completionTimeoutRef.current);
            completionTimeoutRef.current = null;
        }

        // Note: Product cache is now global and persists across user sessions
    }, []);

    // Clear data when user logs out - use ref to prevent multiple calls
    const lastUserRef = useRef(user);
    useEffect(() => {
        if (lastUserRef.current && !user) {
            // User just logged out
            clearAllData();
        }
        lastUserRef.current = user;
    }, [user, clearAllData]);

    // Track user auth state transitions (anonymous -> linked)
    const lastUserStateRef = useRef({ uid: user?.uid, isAnonymous: user?.isAnonymous });
    useEffect(() => {
        const currentState = { uid: user?.uid, isAnonymous: user?.isAnonymous };
        const lastState = lastUserStateRef.current;
        
        // Check if user transitioned from anonymous to non-anonymous (same UID)
        if (user && lastState?.uid === currentState?.uid && 
            lastState?.isAnonymous === true && currentState?.isAnonymous === false) {
            fetchUserData(true); // Force refresh
            fetchRoutineProducts(true); // Force refresh routine products
            setupNotificationsListener(); // Setup realtime listener
            fetchPersonalReferralCode(true);
        }
        
        lastUserStateRef.current = currentState;
    }, [user, fetchUserData, fetchRoutineProducts, setupNotificationsListener, fetchPersonalReferralCode]);

    // Load user data when user is available and userData is null
    useEffect(() => {
        if (deferInitialization) return;
        if (user && !user.isAnonymous && !userData && !userDataLoading) {
            fetchUserData();
        }
    }, [user, userData, userDataLoading, fetchUserData, deferInitialization]);

    // Load routine products when user is available and products are loaded
    useEffect(() => {
        if (deferInitialization) return;
        if (user && !user.isAnonymous && !routineProductsLoadedRef.current && !routineProductsLoading && productsObject && productsInitialized) {
            fetchRoutineProducts();
        }
    }, [user, routineProductsLoading, fetchRoutineProducts, productsObject, productsInitialized, deferInitialization]);

    // Setup notifications realtime listener when user is available
    useEffect(() => {
        if (deferInitialization) return;
        if (user && !user.isAnonymous && !notificationsLoadedRef.current) {
            setupNotificationsListener();
        }
    }, [user, setupNotificationsListener, deferInitialization]);

    // Load personal referral code when user is available
    useEffect(() => {
        if (deferInitialization) return;
        if (user && !user.isAnonymous && !personalReferralCodeLoadedRef.current && !personalReferralCodeLoading) {
            fetchPersonalReferralCode();
        }
    }, [user, personalReferralCodeLoading, fetchPersonalReferralCode, deferInitialization]);

    // Listen to Firebase Auth ID token changes to catch user authentication events immediately
    useEffect(() => {
        if (deferInitialization) return;

        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
            // Only proceed if we have a user who is not anonymous
            if (firebaseUser && !firebaseUser.isAnonymous) {
                
                // Fetch user data immediately
                setUserDataLoading(true);
                try {
                    const userDocRef = doc(db, 'users', firebaseUser?.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc?.exists()) {
                        setUserData(userDoc?.data());
                    } else {
                        setUserData(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data in onIdTokenChanged:', error);
                } finally {
                    setUserDataLoading(false);
                }
                
                // Setup notifications listener
                if (!notificationsLoadedRef.current) {
                    setupNotificationsListener();
                }

                
                // Fetch routine products (only if products are already loaded)
                if (!routineProductsLoadedRef.current && !routineProductsLoading && productsObject && productsInitialized) {
                    fetchRoutineProducts();
                }
                
                // Fetch personal referral code
                if (!personalReferralCodeLoadedRef.current && !personalReferralCodeLoading) {
                    fetchPersonalReferralCode();
                }

                // Fetch AI chats for image limit validation
                if (!aiChatsLoadedRef.current && !aiChatsLoading) {
                    fetchAiChats();
                }

                // Fetch scan limits for product scanning rate limiting
                if (!scanLimitsLoadedRef.current && !scanLimitsLoading) {
                    fetchScanLimits();
                }
            }
        });

        return () => unsubscribe?.();
    }, [setupNotificationsListener, fetchRoutineProducts, routineProductsLoading, fetchPersonalReferralCode, personalReferralCodeLoading, deferInitialization]);

    // Cleanup notifications listener on unmount
    useEffect(() => {
        return () => {
            if (notificationsUnsubscribeRef?.current) {
                notificationsUnsubscribeRef?.current();
                notificationsUnsubscribeRef.current = null;
            }
        };
    }, []);

    // Check for product updates when app comes into focus (OTA updates!)
    useEffect(() => {
        const handleAppStateChange = async (nextAppState) => {
            if (nextAppState === 'active') {
                if (productsInitialized) {
                    // Products are initialized - check for updates
                    await checkAndUpdateProducts();
                } else {
                    // Products not initialized - try to initialize cache
                    await initializeCache();
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove?.();
    }, [productsInitialized, checkAndUpdateProducts, initializeCache]);

    // Local product query functions - use refs to avoid recreating on every products change
    // NOTE: Query functions expect the original object format, not array
    const productsRef = useRef(productsObject);
    productsRef.current = productsObject;

    const getLocalProductById = useCallback((productId) => {
        return getProductById(productsRef.current, productId);
    }, []);

    const getLocalPersonalizedProducts = useCallback((userSkinInfo, dislikedProducts = [], limitCount = 10) => {
        return getPersonalizedProducts(productsRef.current, userSkinInfo, dislikedProducts, limitCount);
    }, []);

    const searchLocalProducts = useCallback((searchTerm, limitCount = 20) => {
        return searchProductsLocally(productsRef.current, searchTerm, limitCount);
    }, []);

    const getLocalProductsByConcern = useCallback((skinConcerns, limitCount = 20) => {
        return filterProductsByConcern(productsRef.current, skinConcerns, limitCount);
    }, []);

    const getLocalProductsBySkinType = useCallback((skinType, limitCount = 20) => {
        return filterProductsBySkinType(productsRef.current, skinType, limitCount);
    }, []);

    const getLocalProductsByCategory = useCallback((category, limitCount = 20) => {
        return filterProductsByCategory(productsRef.current, category, limitCount);
    }, []);

    const getLocalHighSafetyProducts = useCallback((minSafetyScore = 70, limitCount = 20) => {
        return getHighSafetyProducts(productsRef.current, minSafetyScore, limitCount);
    }, []);

    const getLocalTrendingProducts = useCallback((limitCount = 25) => {
        return getTrendingProducts(productsRef.current, limitCount);
    }, []);

    const advancedFilterProducts = useCallback((filters, limitCount = 20) => {
        return filterProductsAdvanced(productsRef.current, filters, limitCount);
    }, []);

    // Memoized brands set - expensive calculation that should only run once
    const uniqueBrands = useMemo(() => {
        if (!productsArray || !Array.isArray(productsArray) || productsArray.length === 0) {
            return new Set();
        }

        const brandsSet = new Set();
        
        for (const product of productsArray) {
            const brand = product?.brand;
            if (brand && typeof brand === 'string' && brand?.trim()?.length > 0) {
                brandsSet.add(brand?.trim());
            }
        }
        
        return brandsSet;
    }, [productsArray]);

    // Convert Set to sorted array for UI consumption
    const brandsArray = useMemo(() => {
        return Array.from(uniqueBrands).sort((a, b) => a?.localeCompare?.(b) || 0);
    }, [uniqueBrands]);

    // Legacy function for compatibility - fetch personalized products using local cache
    const fetchPersonalizedProducts = useCallback(async (userSkinInfo, dislikedProducts = [], limitCount = 10) => {
        // Return product IDs for compatibility with existing code
        const localProducts = getPersonalizedProducts(productsRef.current, userSkinInfo, dislikedProducts, limitCount);
        return localProducts.map(product => product?.id);
    }, []);

    // AI Chat fetch functions - simplified for component use
    const fetchAiChats = useCallback(async (forceRefresh = false) => {
        return await aiChatLoader.fetchAllChats(
            aiChats,
            setAiChats,
            setAiChatsLoading,
            aiChatsLoadedRef,
            forceRefresh
        );
    }, [aiChatLoader]);

    // Note: fetchAiChats is called in onAuthStateChanged (line 471) when user authenticates
    // No need for separate useEffect here to avoid duplicate fetching

    // Load scan limits when user is available
    useEffect(() => {
        if (deferInitialization) return;
        if (user && !user.isAnonymous && !scanLimitsLoadedRef.current && !scanLimitsLoading) {
            fetchScanLimits();
        }
    }, [user, scanLimitsLoading, fetchScanLimits, deferInitialization]);

    const fetchChatMessages = useCallback(async (chatId, forceRefresh = false) => {
        return await aiChatLoader.fetchMessagesForChat(
            chatId,
            messagesByChatId,
            setMessagesByChatId,
            setMessagesLoadingByChatId,
            forceRefresh
        );
    }, [aiChatLoader]);

    // Scan limits functions
    const fetchScanLimits = useCallback(async (forceRefresh = false) => {
        // Don't fetch scan limits for anonymous users or if no user
        if (!user || user.isAnonymous) return;
        if (!forceRefresh && scanLimitsLoadedRef.current) return;

        setScanLimitsLoading(true);
        try {
            const scanLimitsDocRef = doc(db, 'scanLimits', user.uid);
            const scanLimitsDoc = await getDoc(scanLimitsDocRef);

            if (scanLimitsDoc.exists()) {
                setScanLimits(scanLimitsDoc.data());
            } else {
                setScanLimits(null);
            }
            scanLimitsLoadedRef.current = true;
        } catch (error) {
            console.error('Error fetching scan limits:', error);
            setScanLimits(null);
        } finally {
            setScanLimitsLoading(false);
        }
    }, [user]);

    const incrementScanAttempt = useCallback(async () => {
        if (!user || user.isAnonymous) return false;

        try {
            const scanLimitsDocRef = doc(db, 'scanLimits', user.uid);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Get current scan limits
            const scanLimitsDoc = await getDoc(scanLimitsDocRef);
            const currentData = scanLimitsDoc.exists() ? scanLimitsDoc.data() : null;

            // Check if we need to reset (new day)
            if (currentData?.firstAttemptDate) {
                // Handle both Firestore Timestamp objects and regular Date objects
                let firstAttemptDate;
                if (currentData.firstAttemptDate.toDate && typeof currentData.firstAttemptDate.toDate === 'function') {
                    firstAttemptDate = currentData.firstAttemptDate.toDate();
                } else if (currentData.firstAttemptDate instanceof Date) {
                    firstAttemptDate = currentData.firstAttemptDate;
                } else {
                    // If we can't parse the date, treat as new day and reset
                    const newData = {
                        attempts: 1,
                        firstAttemptDate: serverTimestamp()
                    };
                    await setDoc(scanLimitsDocRef, newData);
                    setScanLimits(newData);
                    return true;
                }

                const firstAttemptDay = new Date(firstAttemptDate.getFullYear(), firstAttemptDate.getMonth(), firstAttemptDate.getDate());

                if (today.getTime() > firstAttemptDay.getTime()) {
                    // New day - reset count
                    const newData = {
                        attempts: 1,
                        firstAttemptDate: serverTimestamp()
                    };
                    await setDoc(scanLimitsDocRef, newData);
                    setScanLimits(newData);
                    return true;
                }
            }

            // Same day or first attempt ever
            if (!currentData) {
                // First attempt ever
                const newData = {
                    attempts: 1,
                    firstAttemptDate: serverTimestamp()
                };
                await setDoc(scanLimitsDocRef, newData);
                setScanLimits(newData);
                return true;
            } else {
                // Check if under limit
                if (currentData.attempts >= 3) {
                    return false; // Over limit
                }

                // Increment attempt
                const updatedData = {
                    ...currentData,
                    attempts: currentData.attempts + 1
                };
                await setDoc(scanLimitsDocRef, { attempts: increment(1) }, { merge: true });
                setScanLimits(updatedData);
                return true;
            }
        } catch (error) {
            console.error('Error incrementing scan attempt:', error);
            return false;
        }
    }, [user]);

    const canUserScan = useCallback(() => {
        if (!user || user.isAnonymous) return false;
        if (!scanLimits) return true; // No limits yet, allow scanning

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Check if it's a new day
        if (scanLimits.firstAttemptDate) {
            // Handle both Firestore Timestamp objects and regular Date objects
            let firstAttemptDate;
            if (scanLimits.firstAttemptDate.toDate && typeof scanLimits.firstAttemptDate.toDate === 'function') {
                firstAttemptDate = scanLimits.firstAttemptDate.toDate();
            } else if (scanLimits.firstAttemptDate instanceof Date) {
                firstAttemptDate = scanLimits.firstAttemptDate;
            } else {
                // If we can't parse the date, assume it's old and allow scanning
                return true;
            }

            const firstAttemptDay = new Date(firstAttemptDate.getFullYear(), firstAttemptDate.getMonth(), firstAttemptDate.getDate());

            if (today.getTime() > firstAttemptDay.getTime()) {
                return true; // New day, reset limit
            }
        } else {
            // No firstAttemptDate, treat as first scan
            return true;
        }

        return scanLimits.attempts < 3;
    }, [user, scanLimits]);

    // Queue face scan for processing - called by ScanScreenTakePhoto
    const queueFaceScanProcessing = useCallback((photos, notes = '') => {
        setPendingScan({
            photos,
            additionalNotes: notes,
            createdAt: new Date()
        });
        setPendingScanProgress(0);
        setIsPendingScanProcessing(true);
    }, []);

    // Process the queued face scan
    const processPendingFaceScan = useCallback(async () => {
        if (!pendingScan || !user || user.isAnonymous) return;

        const { photos, additionalNotes } = pendingScan;
        const { left, front, right } = photos;

        if (!left || !front || !right) {
            console.error('Missing photos for face scan processing');
            setPendingScanError('Missing photo data. Please try scanning again.');
            setPendingScan(null);
            setIsPendingScanProcessing(false);
            setPendingScanProgress(0);
            return;
        }

        try {
            // Convert all photo URIs to base64
            const leftBase64 = await prepareImageForFirebase(left, {
                quality: 0.9,
                maxWidth: 1024,
                maxHeight: 1024
            });
            const frontBase64 = await prepareImageForFirebase(front, {
                quality: 0.9,
                maxWidth: 1024,
                maxHeight: 1024
            });
            const rightBase64 = await prepareImageForFirebase(right, {
                quality: 0.9,
                maxWidth: 1024,
                maxHeight: 1024
            });

            // Call cloud function
            const processFaceScanFunction = httpsCallable(functions, 'processFaceScan');
            const result = await processFaceScanFunction({
                imageData: {
                    front: `data:image/jpeg;base64,${frontBase64}`,
                    left: `data:image/jpeg;base64,${leftBase64}`,
                    right: `data:image/jpeg;base64,${rightBase64}`,
                },
                additionalNotes,
            });

            if (result.data.success) {
                // Update the most recent diagnosis in global state
                if (result.data.diagnosis) {
                    setMostRecentDiagnosis({
                        ...result.data.diagnosis,
                        createdAt: new Date(result.data.diagnosis.createdAt.seconds * 1000)
                    });
                }

                // Signal completion - the useEffect will handle animating to 100%
                setIsPendingScanProcessing('completing'); // Special state to trigger fast completion

                // Note: refreshAnalysisData will be called from useAnalysisLoader in components
                // We don't call it here to avoid circular dependency
            } else {
                throw new Error(result.data.error || 'Scan processing failed');
            }
        } catch (error) {
            console.error('Error processing pending face scan:', error);

            // Clear interval on error
            if (processingIntervalRef.current) {
                clearInterval(processingIntervalRef.current);
                processingIntervalRef.current = null;
            }

            // Set user-friendly error message
            const errorMessage = error.code === 'functions/permission-denied'
                ? 'You need to wait between scans. Please try again later.'
                : error.message || 'Failed to process scan. Please try again.';

            setPendingScanError(errorMessage);

            // Clear pending scan on error
            setPendingScan(null);
            setIsPendingScanProcessing(false);
            setPendingScanProgress(0);
        }
    }, [pendingScan, user]);

    // Progress tracking effect - increment progress slowly until 95%, then wait for completion
    useEffect(() => {
        // No pending scan - cleanup
        if (!isPendingScanProcessing || !pendingScan) {
            if (processingIntervalRef.current) {
                clearInterval(processingIntervalRef.current);
                processingIntervalRef.current = null;
            }
            return;
        }

        // Completing state - animate from current to 100% quickly
        if (isPendingScanProcessing === 'completing') {
            // Clear slow interval if it exists
            if (processingIntervalRef.current) {
                clearInterval(processingIntervalRef.current);
                processingIntervalRef.current = null;
            }

            // Fast completion animation
            const completeInterval = setInterval(() => {
                setPendingScanProgress(prev => {
                    const newProgress = prev + 3; // Increment by 3% for fast completion
                    if (newProgress >= 100) {
                        clearInterval(completeInterval);

                        // Schedule cleanup after showing 100%
                        completionTimeoutRef.current = setTimeout(() => {
                            setPendingScan(null);
                            setIsPendingScanProcessing(false);
                            setPendingScanProgress(0);
                            setPendingScanError(null);
                            completionTimeoutRef.current = null;
                        }, 800);

                        return 100;
                    }
                    return newProgress;
                });
            }, 50); // Very fast interval for completion

            return () => {
                clearInterval(completeInterval);
                if (completionTimeoutRef.current) {
                    clearTimeout(completionTimeoutRef.current);
                    completionTimeoutRef.current = null;
                }
            };
        }

        // Processing state - prevent race condition
        if (processingIntervalRef.current) {
            return;
        }

        // Set up slow progress interval (0-95%)
        const intervalId = setInterval(() => {
            setPendingScanProgress(prev => {
                // Increment randomly between 0.5-1.5% for natural feel
                const increment = Math.random() * 1 + 0.5;
                const newProgress = prev + increment;

                // Cap at 95% until processing is actually complete
                return Math.min(newProgress, 95);
            });
        }, Math.random() * 400 + 100); // Random interval between 100-500ms

        processingIntervalRef.current = intervalId;

        // Start processing the scan asynchronously (don't await)
        processPendingFaceScan();

        return () => {
            if (processingIntervalRef.current) {
                clearInterval(processingIntervalRef.current);
                processingIntervalRef.current = null;
            }
            if (completionTimeoutRef.current) {
                clearTimeout(completionTimeoutRef.current);
                completionTimeoutRef.current = null;
            }
        };
    }, [isPendingScanProcessing, pendingScan, processPendingFaceScan]);

    return (
        <DataContext.Provider value={{
            products,
            ingredients, setIngredients,
            routineProducts, setRoutineProducts,
            routineProductsLoading,
            fetchRoutineProducts,
            routineCompletions,
            fetchRoutineCompletions,
            updateRoutineCompletions,
            clearAllData,
            loading,
            
            // Product cache state
            productsLoading,
            productsInitialized,
            
            // User data
            userData, setUserData,
            userDataLoading,
            fetchUserData,
            
            // Notifications
            notifications, setNotifications,
            notificationsLoading,
            fetchNotifications,
            setupNotificationsListener,
            
            // Personal referral code
            personalReferralCode, setPersonalReferralCode,
            personalReferralCodeLoading,
            fetchPersonalReferralCode,
            
            // Pending referrals
            pendingReferrals, setPendingReferrals,
            pendingReferralsLoading,
            fetchPendingReferrals,
            
            // Analysis states
            diagnoses, setDiagnoses,
            mostRecentDiagnosis, setMostRecentDiagnosis,
            severityTrends, setSeverityTrends,
            analysisStats, setAnalysisStats,
            analysisLoading, setAnalysisLoading,
            additionalNotes, setAdditionalNotes,
            
            // Recommendation states
            routineRecommendations, setRoutineRecommendations,
            scanRecommendations, setScanRecommendations,
            recommendationsLoading, setRecommendationsLoading,
            
            // Local product query functions
            getLocalProductById,
            getLocalPersonalizedProducts,
            searchLocalProducts,
            getLocalProductsByConcern,
            getLocalProductsBySkinType,
            getLocalProductsByCategory,
            getLocalHighSafetyProducts,
            getLocalTrendingProducts,
            advancedFilterProducts,
            
            // Product cache functions
            initializeCache,
            downloadAllProducts,
            getCacheMetadata,
            checkAndUpdateProducts,
            
            // Legacy compatibility functions
            fetchPersonalizedProducts,
            
            // Brands data
            uniqueBrands,
            brandsArray,
            
            ...reviewFetcher,
            ...localExploreProductsFetcher,

            // AI Chat states and functions
            aiChats,
            aiChatsLoading,
            messagesByChatId,
            messagesLoadingByChatId,
            fetchAiChats,
            fetchChatMessages,
            ...aiChatLoader,

            // Scan limits for product scanning
            scanLimits,
            scanLimitsLoading,
            fetchScanLimits,
            incrementScanAttempt,
            canUserScan,

            // Pending face scan processing
            pendingScan,
            pendingScanProgress,
            isPendingScanProcessing,
            pendingScanError,
            queueFaceScanProcessing,
            hasPendingScan: !!pendingScan, // Boolean helper for easy checking
            clearPendingScanError: () => setPendingScanError(null),
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const ctx = useContext(DataContext);
    if (ctx) {
        return ctx;
    }
}
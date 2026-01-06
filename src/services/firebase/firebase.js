import { initializeApp, getApps } from 'firebase/app';
import {
    initializeAuth,
    getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: 'AIzaSyB3yF9_eT28oedPsB7AsaeiS5bU-C5me9w',
    authDomain: "derm-ai-app.firebaseapp.com",
    projectId: "derm-ai-app",
    storageBucket: "derm-ai-app.appspot.com",
    messagingSenderId: "958434550412",
    appId: "1:958434550412:web:4a512c3ab47af0a50fd1a9",
    measurementId: "G-KVBTMCYK2M"
};

// Make sure Firebase is initialized only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app)
const functions = getFunctions(app);
const storage = getStorage(app, 'gs://derm-ai-app.firebasestorage.app');

let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch (e) {
    // Already initialized: fallback to getAuth
    auth = getAuth(app);
}

// Production mode - no emulator connections

export { app, db, auth, functions, storage };
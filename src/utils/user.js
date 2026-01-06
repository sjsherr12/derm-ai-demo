import { doc, getDoc, getFirestore, serverTimestamp, setDoc, collection, addDoc } from "firebase/firestore"
import { db, storage } from "services/firebase/firebase"
import { ref, uploadString, uploadBytes, getDownloadURL } from "firebase/storage"
import SignUpQuestions from "../data/SignUpQuestions"

const placeholderProfileMale = require('assets/media/filler/placeholder_pfp_male.png')
const placeholderProfileFemale = require('assets/media/filler/placeholder_pfp_female.png')
const placeholderProfileNonbinary = require('assets/media/filler/placeholder_pfp_nonbinary.png')

export const getUserFirstName = (user) => {
    return user?.displayName?.split(' ')[0]
}

export const getUserLastName = (user) => {
    return user?.displayName?.split(' ')[1]
}

export const getUserPlaceholderProfile = (userData) => {
    if (userData?.profile?.gender === 0) {
        return placeholderProfileMale
    }
    else if (userData?.profile?.gender === 1) {
        return placeholderProfileFemale
    }
    else return placeholderProfileNonbinary;
}

export const userAccountExists = async (user) => {
    const userDoc = await getDoc(doc(db, 'users', user?.uid));
    return userDoc.exists();
}
const { FieldValue } = require("firebase-admin/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { AGE_GROUPS, BREAKOUT_LOCATIONS, COMMON_ALLERGENS, GENDERS, GENERIC_CLIMATES, REFERRAL_STATUS, SKIN_CONCERNS, SKIN_SENSITIVITIES, SKIN_TONES, SKIN_TYPES, SKINCARE_GOALS } = require("./utils");
const { db } = require("./firebase-admin");
const admin = require('firebase-admin');

function verifySignupData(signUpData) {
    const errors = [];
    
    if (!signUpData || !('AgeQuestion' in signUpData) || signUpData.AgeQuestion === undefined || signUpData.AgeQuestion === null) {
        errors.push('AgeQuestion is missing');
    } else if (!AGE_GROUPS.some(ag => ag.value === signUpData.AgeQuestion)) {
        errors.push(`AgeQuestion value "${signUpData.AgeQuestion}" is not valid. Valid values: ${AGE_GROUPS.map(ag => ag.value).join(', ')}`);
    }

    if (!signUpData || !('GenderQuestion' in signUpData) || signUpData.GenderQuestion === undefined || signUpData.GenderQuestion === null) {
        errors.push('GenderQuestion is missing');
    } else if (!GENDERS.some(g => g.value === signUpData.GenderQuestion)) {
        errors.push(`GenderQuestion value "${signUpData.GenderQuestion}" is not valid. Valid values: ${GENDERS.map(g => g.value).join(', ')}`);
    }

    if (!Array.isArray(signUpData?.BreakoutLocationsQuestion)) {
        errors.push(`BreakoutLocationsQuestion must be an array, got: ${typeof signUpData?.BreakoutLocationsQuestion}`);
    } else if (!signUpData.BreakoutLocationsQuestion.every(loc => BREAKOUT_LOCATIONS.some(bl => bl.value === loc))) {
        const invalidLocs = signUpData.BreakoutLocationsQuestion.filter(loc => !BREAKOUT_LOCATIONS.some(bl => bl.value === loc));
        errors.push(`BreakoutLocationsQuestion contains invalid values: ${invalidLocs.join(', ')}. Valid values: ${BREAKOUT_LOCATIONS.map(bl => bl.value).join(', ')}`);
    }

    // if (!signUpData || !('BreakoutPainSeverityQuestion' in signUpData) || signUpData.BreakoutPainSeverityQuestion === undefined || signUpData.BreakoutPainSeverityQuestion === null) {
    //   errors.push('BreakoutPainSeverityQuestion is missing');
    // } else if (!BREAKOUT_PAIN_SEVERITIES.some(bps => bps.value === signUpData.BreakoutPainSeverityQuestion)) {
    //   errors.push(`BreakoutPainSeverityQuestion value "${signUpData.BreakoutPainSeverityQuestion}" is not valid. Valid values: ${BREAKOUT_PAIN_SEVERITIES.map(bps => bps.value).join(', ')}`);
    // }

    if (!signUpData || !('TypicalClimateQuestion' in signUpData) || signUpData.TypicalClimateQuestion === undefined || signUpData.TypicalClimateQuestion === null) {
        errors.push('TypicalClimateQuestion is missing');
    } else if (!GENERIC_CLIMATES.some(gc => gc.value === signUpData.TypicalClimateQuestion)) {
        errors.push(`TypicalClimateQuestion value "${signUpData.TypicalClimateQuestion}" is not valid. Valid values: ${GENERIC_CLIMATES.map(gc => gc.value).join(', ')}`);
    }

    if (!Array.isArray(signUpData?.KnownAllergensQuestion)) {
        errors.push(`KnownAllergensQuestion must be an array, got: ${typeof signUpData?.KnownAllergensQuestion}`);
    } else if (!signUpData.KnownAllergensQuestion.every(s => COMMON_ALLERGENS.some(ca => ca.value === s))) {
        const invalidAllergens = signUpData.KnownAllergensQuestion.filter(s => !COMMON_ALLERGENS.some(ca => ca.value === s));
        errors.push(`KnownAllergensQuestion contains invalid values: ${invalidAllergens.join(', ')}. Valid values: ${COMMON_ALLERGENS.map(ca => ca.value).join(', ')}`);
    }

    if (!signUpData || !('SkinSensitivityQuestion' in signUpData) || signUpData.SkinSensitivityQuestion === undefined || signUpData.SkinSensitivityQuestion === null) {
        errors.push('SkinSensitivityQuestion is missing');
    } else if (!SKIN_SENSITIVITIES.some(ss => ss.value === signUpData.SkinSensitivityQuestion)) {
        errors.push(`SkinSensitivityQuestion value "${signUpData.SkinSensitivityQuestion}" is not valid. Valid values: ${SKIN_SENSITIVITIES.map(ss => ss.value).join(', ')}`);
    }

    if (!Array.isArray(signUpData?.SkinConcernsQuestion)) {
        errors.push(`SkinConcernsQuestion must be an array, got: ${typeof signUpData?.SkinConcernsQuestion}`);
    } else if (!signUpData.SkinConcernsQuestion.every(c => SKIN_CONCERNS.some(sc => sc.value === c))) {
        const invalidConcerns = signUpData.SkinConcernsQuestion.filter(c => !SKIN_CONCERNS.some(sc => sc.value === c));
        errors.push(`SkinConcernsQuestion contains invalid values: ${invalidConcerns.join(', ')}. Valid values: ${SKIN_CONCERNS.map(sc => sc.value).join(', ')}`);
    }

    if (!signUpData || !('SkinToneQuestion' in signUpData) || signUpData.SkinToneQuestion === undefined || signUpData.SkinToneQuestion === null) {
        errors.push('SkinToneQuestion is missing');
    } else if (!SKIN_TONES.some(st => st.value === signUpData.SkinToneQuestion)) {
        errors.push(`SkinToneQuestion value "${signUpData.SkinToneQuestion}" is not valid. Valid values: ${SKIN_TONES.map(st => st.value).join(', ')}`);
    }

    if (!signUpData || !('SkinTypeQuestion' in signUpData) || signUpData.SkinTypeQuestion === undefined || signUpData.SkinTypeQuestion === null) {
        errors.push('SkinTypeQuestion is missing');
    } else if (!SKIN_TYPES.some(st => st.value === signUpData.SkinTypeQuestion)) {
        errors.push(`SkinTypeQuestion value "${signUpData.SkinTypeQuestion}" is not valid. Valid values: ${SKIN_TYPES.map(st => st.value).join(', ')}`);
    }

    if (!Array.isArray(signUpData?.SkinCareGoalsQuestion)) {
        errors.push(`SkinCareGoalsQuestion must be an array, got: ${typeof signUpData?.SkinCareGoalsQuestion}`);
    } else if (!signUpData.SkinCareGoalsQuestion.every(g => SKINCARE_GOALS.some(sg => sg.value === g))) {
        const invalidGoals = signUpData.SkinCareGoalsQuestion.filter(g => !SKINCARE_GOALS.some(sg => sg.value === g));
        errors.push(`SkinCareGoalsQuestion contains invalid values: ${invalidGoals.join(', ')}. Valid values: ${SKINCARE_GOALS.map(sg => sg.value).join(', ')}`);
    }

    if (errors.length > 0) {
        throw new Error(`SignUp data validation failed: ${errors.join('; ')}`);
    }
    
    return true;
}

exports.createUserAccount = onCall({
}, async (request) => {
    try {
        if (!request?.auth?.uid) {
            throw new HttpsError('unauthenticated', 'User must be logged in to create an account.')
        }

        const userId = request.auth.uid;
        const {signUpData} = request.data;

        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            throw new HttpsError('already-exists', 'This account already exists. Please sign in at the home screen.')
        }

        try {
            verifySignupData(signUpData);
        } catch (error) {
            throw new HttpsError('data-loss', `Sign-up data validation failed: ${error.message}`);
        }

        const newUserData = {
            createdAt: FieldValue.serverTimestamp(),
            notifications: {
                enabled: signUpData.EnableNotificationsOption === 'granted',
            },
            extra: {
                utmSource: signUpData.DiscoverySourceQuestion,
                ...(signUpData?.ReferralCodeQuestion?.code && {
                    referralCode: signUpData.ReferralCodeQuestion.code
                })
            },
            profile: {
                age: signUpData.AgeQuestion,
                gender: signUpData.GenderQuestion,
                skinInfo: {
                    breakoutLocations: signUpData.BreakoutLocationsQuestion,
                    // breakoutSeverity: signUpData.BreakoutPainSeverityQuestion,
                    climate: signUpData.TypicalClimateQuestion,
                    // medications: signUpData?.MedicationRoutineQuestion || [],
                    sensitivities: signUpData.KnownAllergensQuestion,
                    sensitivity: signUpData.SkinSensitivityQuestion,
                    skinConcerns: signUpData.SkinConcernsQuestion,
                    skinTone: signUpData.SkinToneQuestion,
                    skinType: signUpData.SkinTypeQuestion,
                    skincareGoals: signUpData.SkinCareGoalsQuestion,
                }
            }
        }

        // Create user document
        await db.runTransaction(async (transaction) => {
            const userDocRef = db.collection('users').doc(userId);

            // Double-check user doesn't exist within transaction
            const userDocSnapshot = await transaction.get(userDocRef);
            if (userDocSnapshot.exists) {
                throw new HttpsError('already-exists', 'This account already exists. Please sign in at the home screen.');
            }

            // Set user document
            transaction.set(userDocRef, newUserData);
        })

        return { success: true, message: 'User account created successfully' };
    } catch (error) {
        return { success: false, message: error.message}
    }
})
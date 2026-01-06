const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("./firebase-admin");
const { REFERRAL_STATUS, createNotificationDocument } = require("./utils");

function generateCode(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

exports.onUserDocumentCreated = onDocumentCreated(
    'users/{userId}',
    async (event) => {
        try {
            const snapshot = event.data;
            const userId = event.params.userId;
            const userData = snapshot.data();

            // Process referral logic
            await db.runTransaction(async (transaction) => {
                const referralCodesRef = db.collection('referralCodes');
                const influencerCodesRef = db.collection('influencerCodes');
                const referralCodeDocRef = referralCodesRef.doc(userId);
                const pendingReferralDocRef = db.collection('pendingReferrals').doc(userId);

                // Check if user already has a pending referral (no point proceeding if they do)
                const existingPendingReferral = await transaction.get(pendingReferralDocRef);
                const shouldCreatePendingReferral = !existingPendingReferral.exists;

                // Process referral code redemption if provided
                let validReferralCode = null;
                if (shouldCreatePendingReferral && userData?.extra?.referralCode) {
                    const enteredCode = userData.extra.referralCode;

                    // Validate referral code format (length === 6, all alphanumeric capital characters)
                    if (enteredCode.length >= 6 && /^[A-Z0-9]+$/.test(enteredCode)) {
                        // Check if the referral code exists in either referralCodes or influencerCodes
                        const referralCodeQuery = referralCodesRef.where('code', '==', enteredCode).limit(1);
                        const influencerCodeQuery = influencerCodesRef.where('code', '==', enteredCode).limit(1);

                        const referralCodeSnapshot = await transaction.get(referralCodeQuery);
                        const influencerCodeSnapshot = await transaction.get(influencerCodeQuery);

                        if (!referralCodeSnapshot.empty || !influencerCodeSnapshot.empty) {
                            validReferralCode = enteredCode;
                        }
                    }
                }

                // Generate unique personal referral code
                let code;
                let unique = false;
                let attempts = 0;
                const maxAttempts = 10; // Prevent infinite loops

                while (!unique && attempts < maxAttempts) {
                    code = generateCode(6); // 6-char random code

                    // Check for collisions within the transaction
                    const referralCodeQuery = referralCodesRef.where('code', '==', code).limit(1);
                    const influencerCodeQuery = influencerCodesRef.where('code', '==', code).limit(1);

                    const referralCodeSnapshot = await transaction.get(referralCodeQuery);
                    const influencerCodeSnapshot = await transaction.get(influencerCodeQuery);

                    if (referralCodeSnapshot.empty && influencerCodeSnapshot.empty) {
                        unique = true;
                    }
                    attempts++;
                }

                if (!unique) {
                    console.error(`Failed to generate unique referral code for user ${userId} after multiple attempts`);
                    return;
                }

                // Create user's personal referral code document
                const referralCodeDoc = {
                    createdAt: FieldValue.serverTimestamp(),
                    payoutPerReferral: 5,
                    accumulatedPayout: 0,
                    pendingPayout: 0,
                    code,
                };

                transaction.set(referralCodeDocRef, referralCodeDoc);

                // Create pending referral if valid code was provided
                if (validReferralCode) {
                    const pendingReferralDoc = {
                        status: REFERRAL_STATUS.PENDING,
                        code: validReferralCode,
                        createdAt: FieldValue.serverTimestamp(),
                    };

                    transaction.set(pendingReferralDocRef, pendingReferralDoc);
                }
            });

            // Create preemptive notifications for paywall drop-off scenarios
            const now = new Date();

            // Schedule notification 6: 1 day from now
            const notification6Time = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
            await createNotificationDocument(userId, 6, notification6Time);

            // Schedule notification 7: 2 days from now
            const notification7Time = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
            await createNotificationDocument(userId, 7, notification7Time);

            // Schedule notification 8: 3 days from now
            const notification8Time = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            await createNotificationDocument(userId, 8, notification8Time);

        } catch (error) {
            console.error(`Error processing extra user document items for ${userId}:`, error);
        }
    }
);
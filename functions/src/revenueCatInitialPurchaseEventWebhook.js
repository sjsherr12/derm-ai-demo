const { defineSecret } = require("firebase-functions/params");
const { HttpsError, onRequest } = require("firebase-functions/v2/https");
const { REFERRAL_STATUS } = require("./utils");
const { Timestamp } = require("firebase-admin/firestore");
const { db } = require("./firebase-admin");
const revenueCatInitialPurchaseWebhookSecret = defineSecret('REVENUECAT_INITIALPURCHASE_WEBHOOK_SECRET');

exports.revenueCatInitialPurchaseEventWebhook = onRequest({
  secrets: [revenueCatInitialPurchaseWebhookSecret]
}, async (request, result) => {
    try {
        const signature = request.get('Authorization');
        const expectedSignature = `Bearer ${revenueCatInitialPurchaseWebhookSecret.value()}`;

        if (!signature || signature !== expectedSignature) {
            return result.status(401).send('Unauthorized - Invalid signature')
        }

        if (request.method !== 'POST') {
            return result.status(405).send(`Method "${request.method}" is not allowed.`)    
        }

        const purchaseEvent = request.body.event;
        
        const {
            id,
            app_user_id,
            product_id,
        } = purchaseEvent;

        if (!app_user_id || !product_id) {
            return result.status(400).send('Missing required fields');
        }

        await db.runTransaction(async (transaction) => {
            const pendingReferralRef = db.collection('pendingReferrals').doc(`${app_user_id}`);
            const pendingReferralSnapshot = await transaction.get(pendingReferralRef);
            const pendingReferralData = pendingReferralSnapshot.data();

            if (
                pendingReferralSnapshot.exists &&
                pendingReferralData?.status === REFERRAL_STATUS.PENDING &&
                pendingReferralData?.code?.length >= 6 &&
                !pendingReferralData?.paid &&
                !pendingReferralData?.timeToPayout
            ) {
                const usedReferralCode = pendingReferralData.code;

                const influencerCodesRef = db.collection('influencerCodes').where('code', '==', usedReferralCode).limit(1);
                const referralCodesRef = db.collection('referralCodes').where('code', '==', usedReferralCode).limit(1);

                const influencerCodeSnapshot = await transaction.get(influencerCodesRef);
                const referralCodeSnapshot = await transaction.get(referralCodesRef);

                if (
                    !influencerCodeSnapshot.empty ||
                    !referralCodeSnapshot.empty
                ) {
                    const daysToHold = 3; // 3-day free trial
                    const holdingTime = Date.now() + (daysToHold * 24 * 60 * 60 * 1000);

                    transaction.update(pendingReferralRef, {
                        id,
                        paid: false,
                        productId: product_id,
                        status: REFERRAL_STATUS.APPROVED,
                        timeToPayout: Timestamp.fromMillis(holdingTime)
                    })
                } else { // this case shouldn't happen because it should verify it in the create account function
                    throw new HttpsError('not-found', 'The referral code you used was not found')
                }
            }
        });

        return result.status(200).send('OK');
    } catch (error) {
        return result.status(500).send(`Internal server error. Try again later`);
    }
});
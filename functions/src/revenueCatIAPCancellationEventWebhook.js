const { FieldValue } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");
const { onRequest } = require("firebase-functions/v2/https");
const { REFERRAL_STATUS, APPLE_SUBSCRIPTIONS } = require("./utils");
const { db } = require("./firebase-admin");
const revenueCatIAPCancellationWebhookSecret = defineSecret('REVENUECAT_IAPCANCELLATION_WEBHOOK_SECRET');

exports.revenueCatIAPCancellationEventWebhook = onRequest({
  secrets: [revenueCatIAPCancellationWebhookSecret]
}, async (request, result) => {
  try {
    const signature = request.get('Authorization');
    const expectedSignature = `Bearer ${revenueCatIAPCancellationWebhookSecret.value()}`

    if (!signature || signature !== expectedSignature) {
        return result.status(401).send('Unauthorized - Invalid signature')
    }

    if (request.method !== 'POST') {
        return result.status(405).send(`Method "${request.method}" is not allowed.`)    
    }

    const purchaseEvent = request.body.event;
    const {
        product_id,
        period_type,
        app_user_id,
        cancel_reason
    } = purchaseEvent;

    if (!app_user_id) {
        return result.status(400).send('Missing required fields');
    }

    // There are 2 possible cancel cases:
    // 1: the customer requested a refund from Apple and we lost the associated money
    // 2: this cancellation triggered before money had ever been received from the customer as they had only been in a trial
    if (cancel_reason === 'CUSTOMER_SUPPORT' || period_type === 'TRIAL') {
        await db.runTransaction(async (transaction) => {
            const pendingReferralRef = db.collection('pendingReferrals').doc(`${app_user_id}`);
            const pendingReferralSnapshot = await transaction.get(pendingReferralRef);
            const pendingReferralData = pendingReferralSnapshot.data();

            // Perform all reads before any writes
            let influencerCodeSnapshot = null;
            let referralCodeSnapshot = null;

            if (
                pendingReferralSnapshot.exists &&
                pendingReferralData?.paid &&
                pendingReferralData?.status === REFERRAL_STATUS.COMPLETED
            ) {
                const influencerCodesRef = db.collection('influencerCodes');
                const referralCodesRef = db.collection('referralCodes');

                const influencerCodeQuery = influencerCodesRef.where('code', '==', pendingReferralData?.code).limit(1);
                const referralCodeQuery = referralCodesRef.where('code', '==', pendingReferralData?.code).limit(1);

                influencerCodeSnapshot = await transaction.get(influencerCodeQuery);
                referralCodeSnapshot = await transaction.get(referralCodeQuery);
            }

            // Now perform all writes
            if (pendingReferralSnapshot.exists) {
                transaction.update(pendingReferralRef, {
                    status: REFERRAL_STATUS.REFUNDED,
                })

                if ( // case where its already been paid needs extra handling
                    pendingReferralData?.paid &&
                    pendingReferralData?.status === REFERRAL_STATUS.COMPLETED
                ) {
                    if ( // code exists somewhere, although its extremely unlikely that this isnt true as its verified in off limit functions previously
                        !influencerCodeSnapshot.empty ||
                        !referralCodeSnapshot.empty
                    ) {
                        const isInfluencerCode = !influencerCodeSnapshot.empty;
                        const codeDoc = isInfluencerCode ? influencerCodeSnapshot.docs[0] : referralCodeSnapshot.docs[0];
                        const codeDocRef = codeDoc.ref
                        const codeDocData = codeDoc.data();
                        const payoutPerReferral = isInfluencerCode ? parseFloat((APPLE_SUBSCRIPTIONS.find(
                            sub => sub.id === product_id
                        ).proceedPrice * (
                            (codeDocData.percentPerReferral ?? 10) / 100
                        )).toFixed(2)) : codeDocData.payoutPerReferral

                        // this intends to adjust the future pending payout to reflect the refunded payment.
                        // if the influencer / user was just payed out, then they are put in theoretical debt,
                        // which their future referrals will have to break even out of.

                        transaction.update(codeDocRef, {
                            pendingPayout: FieldValue.increment(-(payoutPerReferral)),
                            accumulatedPayout: FieldValue.increment(-(payoutPerReferral)),
                        })
                    }
                }
            }
        })
    }

    return result.status(200).send('Cancellation successfully issued!')
  } catch (error) {
    console.log('Error processing subscription cancellation: ', error)
    return result.status(500).send(`Internal server error. Try again later`);
  }
})
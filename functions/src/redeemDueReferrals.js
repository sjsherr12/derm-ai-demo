const { FieldValue, Timestamp } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { REFERRAL_STATUS, APPLE_SUBSCRIPTIONS, getPayPalAccessToken } = require("./utils");
const { db } = require("./firebase-admin");
const paypalClientId = defineSecret('PAYPAL_CLIENT_ID_PRODUCTION')
const paypalClientSecret = defineSecret('PAYPAL_CLIENT_SECRET_PRODUCTION')

exports.redeemDueReferrals = onSchedule({
    secrets: [paypalClientId, paypalClientSecret],
    schedule: 'every day 00:00'
}, async (event) => {
    try {
        // Get PayPal access token once at the start
        const paypalAccessToken = await getPayPalAccessToken(
            paypalClientId.value(),
            paypalClientSecret.value()
        );

        const eligiblePendingReferrals = await db
            .collection('pendingReferrals')
            .where('status', '==', REFERRAL_STATUS.APPROVED)
            .where('paid', '==', false)
            .where('timeToPayout', '<=', Timestamp.now())
            .get();

        for (const pendingReferral of eligiblePendingReferrals.docs) {
            try {
                const referralData = pendingReferral.data();
                const referralCode = referralData?.code;

                // Skip if already being processed
                if (referralData.processing) {
                    continue;
                }

                // STEP 1: Atomically claim this referral using a transaction
                let claimSuccess = false;
                try {
                    await db.runTransaction(async (transaction) => {
                        const freshReferral = await transaction.get(pendingReferral.ref);
                        const freshData = freshReferral.data();

                        // Double-check it hasn't been claimed or processed
                        if (freshData.processing || freshData.paid) {
                            claimSuccess = false;
                            return;
                        }

                        // Atomically claim it
                        transaction.update(pendingReferral.ref, { processing: true });
                        claimSuccess = true;
                    });
                } catch (txError) {
                    console.error(`Transaction error claiming referral ${pendingReferral.id}:`, txError);
                    continue;
                }

                // If we didn't successfully claim it, skip
                if (!claimSuccess) {
                    continue;
                }

                // STEP 2: Process the payout logic (outside transaction)
                let payoutTransactionRef = null;
                let shouldTriggerPayout = false;
                let payoutAmount = 0;
                let payoutAmountFloat = 0; // Initialize at outer scope
                let codeDocRef = null;
                let isInfluencerCode = false;
                let codeData = null;
                let payoutForReferral = 0;

                try {
                    // Find which collection the code belongs to
                    const influencerCodeSnapshot = await db.collection('influencerCodes').where('code', '==', referralCode).limit(1).get();
                    const referralCodeSnapshot = await db.collection('referralCodes').where('code', '==', referralCode).limit(1).get();

                    isInfluencerCode = !influencerCodeSnapshot.empty;
                    const codeSnapshot = isInfluencerCode ? influencerCodeSnapshot : referralCodeSnapshot;

                    if (codeSnapshot.empty) {
                        throw new Error(`Referral code ${referralCode} not found in either collection`);
                    }

                    const codeDoc = codeSnapshot.docs[0];
                    codeDocRef = codeDoc.ref;

                    // Get fresh code data
                    const freshCodeDoc = await codeDocRef.get();
                    codeData = freshCodeDoc.data();

                    if (isInfluencerCode) {
                        const percentPerReferral = codeData.percentPerReferral ?? 10;
                        payoutForReferral = parseFloat((APPLE_SUBSCRIPTIONS.find(
                            sub => sub.id === referralData.productId
                        ).proceedPrice * (percentPerReferral / 100)).toFixed(2));
                        const currentPendingPayout = codeData.pendingPayout ?? 0;
                        const payoutCeiling = codeData.payoutCeiling;
                        const newPendingPayout = parseFloat((currentPendingPayout + payoutForReferral).toFixed(2));

                        if (newPendingPayout >= payoutCeiling) {
                            shouldTriggerPayout = true;
                            payoutAmount = newPendingPayout;
                        }
                    } else {
                        payoutForReferral = parseFloat(codeData.payoutPerReferral.toFixed(2));
                    }

                    // If payout should be triggered, create transaction doc and call PayPal
                    if (shouldTriggerPayout) {
                        // Format payout amount as string with exactly 2 decimal places for PayPal
                        const payoutAmountString = payoutAmount.toFixed(2);
                        // Parse back to float to use consistently in DB operations
                        payoutAmountFloat = parseFloat(payoutAmountString);

                        // Create payout transaction document
                        payoutTransactionRef = db.collection('payoutTransactions').doc();
                        await payoutTransactionRef.set({
                            referrer: codeDocRef.id,
                            influencerCode: referralCode,
                            createdAt: FieldValue.serverTimestamp(),
                            payout: payoutAmountFloat,
                            email: codeData.email,
                            contact: codeData.contact,
                            status: REFERRAL_STATUS.PENDING,
                        });

                        // Call PayPal API
                        const paypalResponse = await fetch('https://api-m.paypal.com/v1/payments/payouts', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${paypalAccessToken}`,
                                'Content-Type': 'application/json',
                                'Accept-Encoding': 'identity',
                            },
                            body: JSON.stringify({
                                sender_batch_header: {
                                    sender_batch_id: `batch_${payoutTransactionRef.id}`,
                                    recipient_type: 'EMAIL',
                                    email_subject: `Derm AI sent you $${payoutAmountString} for your referrals! 🎉`,
                                    email_message: `Hi ${codeData.contact}, thanks for helping grow the Derm AI community! You've earned $${payoutAmountString} through our referral program. We appreciate your support and can't wait to continue this journey together. - The Derm AI Team`,
                                },
                                items: [
                                    {
                                        amount: {
                                            value: payoutAmountString,
                                            currency: 'USD'
                                        },
                                        sender_item_id: `item_${payoutTransactionRef.id}`,
                                        recipient_wallet: 'PAYPAL',
                                        receiver: codeData.email
                                    }
                                ]
                            })
                        });

                        if (!paypalResponse.ok) {
                            const errorBody = await paypalResponse.text();
                            console.error('PayPal API call failed:', {
                                status: paypalResponse.status,
                                statusText: paypalResponse.statusText,
                                headers: Object.fromEntries(paypalResponse.headers.entries()),
                                body: errorBody,
                                payoutTransactionId: payoutTransactionRef.id,
                                payoutAmount: payoutAmount,
                                email: codeData.email
                            });

                            // Update transaction status to failed
                            await payoutTransactionRef.update({
                                status: REFERRAL_STATUS.FAILED,
                                error: {
                                    paypalStatus: paypalResponse.status,
                                    paypalError: errorBody,
                                    timestamp: FieldValue.serverTimestamp()
                                }
                            });
                            throw new Error(`PayPal API call failed with status ${paypalResponse.status}`);
                        }
                    }

                    // STEP 3: Atomically finalize all updates using a transaction
                    await db.runTransaction(async (transaction) => {
                        // Mark payout transaction as completed if it exists
                        if (payoutTransactionRef) {
                            transaction.update(payoutTransactionRef, {
                                status: REFERRAL_STATUS.COMPLETED,
                            });
                        }

                        // Update code document (use consistent float values)
                        if (isInfluencerCode) {
                            if (shouldTriggerPayout) {
                                transaction.update(codeDocRef, {
                                    pendingPayout: 0,
                                    accumulatedPayout: FieldValue.increment(payoutAmountFloat)
                                });
                            } else {
                                transaction.update(codeDocRef, {
                                    pendingPayout: FieldValue.increment(payoutForReferral),
                                    accumulatedPayout: FieldValue.increment(payoutForReferral)
                                });
                            }
                        } else {
                            transaction.update(codeDocRef, {
                                pendingPayout: FieldValue.increment(payoutForReferral),
                                accumulatedPayout: FieldValue.increment(payoutForReferral)
                            });
                        }

                        // Mark referral as completed
                        transaction.update(pendingReferral.ref, {
                            paid: true,
                            paidAt: FieldValue.serverTimestamp(),
                            status: REFERRAL_STATUS.COMPLETED,
                            processing: false
                        });
                    });

                } catch (processingError) {
                    // Rollback: mark transaction as failed if created
                    if (payoutTransactionRef) {
                        try {
                            await payoutTransactionRef.update({
                                status: REFERRAL_STATUS.FAILED,
                            });
                        } catch (updateError) {
                            console.error(`Error updating failed transaction ${payoutTransactionRef.id}:`, updateError);
                        }
                    }

                    // Clear processing flag
                    await pendingReferral.ref.update({ processing: false });
                    throw processingError;
                }

            } catch (err) {
                console.error(`Error processing referral ${pendingReferral.id}:`, err);
                try {
                    await pendingReferral.ref.update({
                        status: REFERRAL_STATUS.FAILED,
                        processing: false
                    });
                } catch (updateError) {
                    console.error(`Error updating failed referral ${pendingReferral.id}:`, updateError);
                }
            }
        }
    } catch (error) {
        console.error('Error in redeemDueReferrals:', error);
    }
})

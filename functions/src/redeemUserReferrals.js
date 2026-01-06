const { FieldValue } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { REFERRAL_STATUS, getPayPalAccessToken } = require("./utils");
const { db } = require("./firebase-admin");
const admin = require('firebase-admin');
const paypalClientId = defineSecret('PAYPAL_CLIENT_ID_PRODUCTION')
const paypalClientSecret = defineSecret('PAYPAL_CLIENT_SECRET_PRODUCTION')

exports.redeemUserReferrals = onCall({
    secrets: [paypalClientId, paypalClientSecret]
}, async (request) => {
    if (!request.auth.uid) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to withdraw referral payments!');
    }

    const userId = request.auth.uid;
    const referralCodeRef = db.collection('referralCodes').doc(`${userId}`);
    let payoutTransactionRef = null;
    let pendingPayoutAmount = 0;
    let rolledBack = false; // Track if we've already rolled back
    let paypalSucceeded = false; // Track if PayPal payment succeeded

    try {
        // Get PayPal access token
        const paypalAccessToken = await getPayPalAccessToken(
            paypalClientId.value(),
            paypalClientSecret.value()
        );

        // Get user info
        const userRecord = await admin.auth().getUser(userId);
        const userName = userRecord.displayName ?? 'Derm AI User';
        const userEmail = userRecord.email;

        if (!userEmail) {
            throw new HttpsError('not-found', 'An email to send the payment to was not found. Please make sure your email is linked to your account.');
        }

        // STEP 1: Atomically claim the withdrawal using a transaction
        // The transaction will snapshot the exact pendingPayout value at claim time
        await db.runTransaction(async (transaction) => {
            const referralCodeDoc = await transaction.get(referralCodeRef);
            const referralCodeData = referralCodeDoc.data();

            // Check if withdrawal is already in progress
            if (referralCodeData.processing) {
                throw new HttpsError('failed-precondition', 'Withdrawal already in progress. Please wait and try again.');
            }

            const pendingPayout = referralCodeData.pendingPayout ?? 0;
            const payoutPerReferral = referralCodeData.payoutPerReferral ?? 0;

            // Check minimum withdrawal amount
            if (pendingPayout < payoutPerReferral) {
                throw new HttpsError('failed-precondition', `Your pending payout must be $${payoutPerReferral.toFixed(2)} or more to withdraw your payment!`);
            }

            // Store the EXACT amount we're claiming (with proper precision)
            // This is the snapshot value that will be used for payout
            pendingPayoutAmount = parseFloat(pendingPayout.toFixed(2));

            // Atomically claim: decrement by the exact amount we're withdrawing
            // This way if new referrals come in, they won't be lost
            transaction.update(referralCodeRef, {
                pendingPayout: FieldValue.increment(-pendingPayoutAmount),
                processing: true,
                withdrawalStarted: FieldValue.serverTimestamp()
            });
        });

        // STEP 2: Create payout transaction and call PayPal
        const payoutAmountString = pendingPayoutAmount.toFixed(2);

        payoutTransactionRef = db.collection('payoutTransactions').doc();
        await payoutTransactionRef.set({
            referrer: userId,
            createdAt: FieldValue.serverTimestamp(),
            payout: pendingPayoutAmount,
            email: userEmail,
            status: REFERRAL_STATUS.PENDING
        });

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
                    email_message: `Hi ${userName}, thanks for helping grow the Derm AI community! You've earned $${payoutAmountString} through our referral program. We appreciate your support and can't wait to continue this journey together. - The Derm AI Team`,
                },
                items: [
                    {
                        amount: {
                            value: payoutAmountString,
                            currency: 'USD'
                        },
                        sender_item_id: `item_${payoutTransactionRef.id}`,
                        recipient_wallet: 'PAYPAL',
                        receiver: userEmail,
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
                payoutAmount: pendingPayoutAmount,
                email: userEmail
            });

            // Rollback: restore balance and clear processing flag atomically
            // Using increment to add back the amount we subtracted
            await db.runTransaction(async (transaction) => {
                transaction.update(referralCodeRef, {
                    pendingPayout: FieldValue.increment(pendingPayoutAmount),
                    processing: false
                });
                transaction.update(payoutTransactionRef, {
                    status: REFERRAL_STATUS.FAILED,
                    error: {
                        paypalStatus: paypalResponse.status,
                        paypalError: errorBody,
                        timestamp: FieldValue.serverTimestamp()
                    }
                });
            });

            rolledBack = true; // Mark that we've rolled back
            throw new HttpsError('internal', 'Failed to process payout. Your pending payout has been restored. Please try again later.');
        }

        // Mark that PayPal payment succeeded - do NOT rollback after this point
        paypalSucceeded = true;

        // STEP 3: Finalize success atomically
        await db.runTransaction(async (transaction) => {
            transaction.update(referralCodeRef, {
                processing: false,
                accumulatedPayout: FieldValue.increment(pendingPayoutAmount)
            });
            transaction.update(payoutTransactionRef, {
                status: REFERRAL_STATUS.COMPLETED,
            });
        });

        return {
            success: true,
            message: `You have successfully been paid out $${payoutAmountString}! Instructions on how to claim your reward were sent to ${userEmail}. Thank you for helping us grow Derm AI.`
        };

    } catch (error) {
        // CRITICAL: Only rollback if PayPal did NOT succeed
        // If PayPal succeeded, money was sent - we must NOT refund the user
        if (!rolledBack && !paypalSucceeded && payoutTransactionRef && pendingPayoutAmount > 0) {
            try {
                console.error('Attempting rollback due to error:', error.message);
                await db.runTransaction(async (transaction) => {
                    transaction.update(referralCodeRef, {
                        pendingPayout: FieldValue.increment(pendingPayoutAmount),
                        processing: false
                    });
                    transaction.update(payoutTransactionRef, {
                        status: REFERRAL_STATUS.FAILED,
                    });
                });
                console.log('Rollback successful');
            } catch (rollbackError) {
                console.error('CRITICAL: Failed to rollback withdrawal:', rollbackError);
            }
        } else if (!rolledBack && !paypalSucceeded && pendingPayoutAmount > 0) {
            // Payout was claimed but transaction doc not created - still need to rollback
            // Only if PayPal did NOT succeed
            try {
                console.error('Attempting rollback (no transaction doc) due to error:', error.message);
                await referralCodeRef.update({
                    pendingPayout: FieldValue.increment(pendingPayoutAmount),
                    processing: false
                });
                console.log('Rollback successful (no transaction doc)');
            } catch (rollbackError) {
                console.error('CRITICAL: Failed to rollback withdrawal (no transaction doc):', rollbackError);
            }
        } else if (paypalSucceeded) {
            // PayPal succeeded but finalization failed - money was sent, cannot rollback!
            console.error('CRITICAL: PayPal succeeded but DB finalization failed. Transaction stuck in PENDING:', {
                userId,
                payoutTransactionId: payoutTransactionRef?.id,
                amount: pendingPayoutAmount,
                error: error.message
            });
            // Mark transaction as needing manual review
            if (payoutTransactionRef) {
                try {
                    await payoutTransactionRef.update({
                        status: REFERRAL_STATUS.PENDING,
                        manualReviewRequired: true,
                        finalizationError: error.message,
                        timestamp: FieldValue.serverTimestamp()
                    });
                } catch (updateError) {
                    console.error('CRITICAL: Failed to mark transaction for manual review:', updateError);
                }
            }
        }

        // Re-throw HttpsError as-is, wrap others
        if (error instanceof HttpsError) {
            throw error;
        }

        throw new HttpsError('internal', error.message || 'An unexpected error occurred during withdrawal.');
    }
})

const { FieldValue } = require("firebase-admin/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { REFERRAL_STATUS } = require("./utils");
const { db, storage } = require("./firebase-admin");
const admin = require('firebase-admin');

exports.deleteUserAccount = onCall({
}, async (request) => {
    try {
        if (!request.auth.uid) {
            throw new HttpsError('unauthenticated', 'User must be authenticated to delete account!')
        }

        const userId = request.auth.uid;
        const userDocRef = db.collection('users').doc(`${userId}`);
        const userDoc = await userDocRef.get();
        
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'User document to delete not found');
        }

        const userData = userDoc.data();
        
        // Step 1: Delete referral code and associated pending referrals
        const referralCodeDocRef = db.collection('referralCodes').doc(userId);
        const referralCodeDoc = await referralCodeDocRef.get();
        
        if (referralCodeDoc.exists) {
            const referralCode = referralCodeDoc.data().code;
            
            // Delete all pending referrals with this code where paid is false or status is pending
            const pendingReferralsQuery = db.collection('pendingReferrals')
                .where('code', '==', referralCode)
                .where('paid', '==', false);
                
            const pendingReferralsByStatus = db.collection('pendingReferrals')
                .where('code', '==', referralCode)
                .where('status', '==', REFERRAL_STATUS.PENDING);
            
            const [unpaidReferrals, pendingStatusReferrals] = await Promise.all([
                pendingReferralsQuery.get(),
                pendingReferralsByStatus.get()
            ]);
            
            // Combine and delete unique referrals
            const referralsToDelete = new Set();
            unpaidReferrals.docs.forEach(doc => referralsToDelete.add(doc.ref));
            pendingStatusReferrals.docs.forEach(doc => referralsToDelete.add(doc.ref));
            
            const deleteReferralPromises = Array.from(referralsToDelete).map(ref => ref.delete());
            await Promise.all(deleteReferralPromises);
            
            // Delete the user's referral code
            await referralCodeDocRef.delete();
        }

        // Step 2: Delete user's own pending referrals if unpaid/pending
        const userPendingReferralRef = db.collection('pendingReferrals').doc(userId);
        const userPendingReferral = await userPendingReferralRef.get();
        
        if (userPendingReferral.exists) {
            const referralData = userPendingReferral.data();
            if (referralData.paid === false || referralData.status === REFERRAL_STATUS.PENDING) {
                await userPendingReferralRef.delete();
            }
        }

        // Step 3: Check data collection opt-in status
        const optedIntoDataCollection = userData.extra?.dataCollection?.optedIntoDataCollection;
        
        if (!optedIntoDataCollection) {
            // User did not opt into data collection - delete everything
            
            // Delete all subcollections under the user document
            const subcollections = ['chats', 'notifications', 'diagnoses', 'routineProducts'];
            const deleteSubcollectionPromises = subcollections.map(async (subcollection) => {
                const collectionRef = userDocRef.collection(subcollection);
                const snapshot = await collectionRef.get();
                const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
                return Promise.all(deletePromises);
            });
        
            await Promise.all(deleteSubcollectionPromises);
            
            // Delete user document
            await userDocRef.delete();
            
            // Delete Firebase Storage files for this user
            try {
                const bucket = storage.bucket();
                await bucket.deleteFiles({
                    prefix: `users/${userId}/`
                });
            } catch (storageError) {
                // Storage deletion is non-critical, log but don't fail the entire operation
                console.error(`Failed to delete storage files for user ${userId}:`, storageError);
            }
        } else {
            await userDocRef.update({
                'extra.dataCollection.accountDeletedAt': FieldValue.serverTimestamp()
            })
        }
        // If user opted into data collection, we leave their personal data intact
        
        // Unconditionally delete the Firebase Auth user account
        try {
            await admin.auth().deleteUser(userId);
        } catch (authError) {
            console.error(`Failed to delete auth user ${userId}:`, authError);
            throw new HttpsError('internal', 'Failed to delete user authentication');
        }
        
        return {
            success: true,
            message: 'Account deleted. You can create a new account at the home screen.'
        }
    } catch (error) {
        console.error('Error deleting user account:', error);
        return {
            success: false,
            message: error.message || 'Failed to delete account'
        }
    }
})
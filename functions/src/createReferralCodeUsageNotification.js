const { FieldValue } = require("firebase-admin/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { db } = require("./firebase-admin");

exports.createReferralCodeUsageNotification = onDocumentCreated(
    'pendingReferrals/{userId}', 
    async (event) => {
        try {
        const snapshot = event.data;
        const pendingReferralData = snapshot.data();
        
        if (!pendingReferralData?.code) {
            // shouldnt happen, just return.
            return;
        }
        
        // Query referralCodes collection to find the owner of the used code
        const referralCodeQuery = db.collection('referralCodes')
            .where('code', '==', pendingReferralData.code)
            .limit(1);
        
        const referralCodeSnapshot = await referralCodeQuery.get();
        
        if (referralCodeSnapshot.empty) {
            // its an influencer code
            return;
        }

        // Get the owner's user ID from the document path
        const referralCodeDoc = referralCodeSnapshot.docs[0];
        const referralCodeOwnerId = referralCodeDoc.id;

        // Get the referral code owner's user data
        const userDoc = await db.collection('users').doc(referralCodeOwnerId).get();
        
        if (!userDoc.exists) {
            // user not found, return.
            return;
        }

        const userData = userDoc.data();
        
        // Check if user has notifications enabled
        if (!userData?.notifications?.enabled) {
            // user doesnt have notifications enabled, return.
            return;
        }

        // Create notification document
        const notificationData = {
            attempts: 0,
            createdAt: FieldValue.serverTimestamp(),
            scheduledAt: FieldValue.serverTimestamp(),
            sent: false,
            type: 4,
            read: false
        };

        // Add notification to user's notifications subcollection
        await db.collection('users')
            .doc(referralCodeOwnerId)
            .collection('notifications')
            .add(notificationData);

        } catch (error) {
            console.error('Error in createReferralCodeUsageNotification:', error);
        }
    }
)
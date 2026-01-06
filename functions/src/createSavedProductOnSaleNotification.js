const { FieldValue } = require("firebase-admin/firestore");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { db } = require("./firebase-admin");

exports.createSavedProductOnSaleNotification = onDocumentWritten(
    'products/{productId}',
    async (event) => {
        try {
            const snapshot = event.data;
            const productId = event.params.productId;

            const before = snapshot.before;
            const beforeData = before.data();

            const after = snapshot.after;
            const afterData = after.data();

            if (!before.exists || !after.exists) {
                return null;
            }
            
            const beforeTime = beforeData?.updatedAt;
            const afterTime = afterData?.updatedAt;

            if (!afterTime || (beforeTime && beforeTime.isEqual(afterTime))) {
                await after.ref.update({
                    updatedAt: FieldValue.serverTimestamp()
                })
            }

            // if true, product just went on sale: notify users who have it saved.
            if (afterData?.price < beforeData?.price) {
                const usersWhoSavedProductQuery = db
                    .collection('users')
                    .where('routine.likedProducts', 'array-contains', productId)
                
                const usersWhoSavedProduct = await usersWhoSavedProductQuery.get();
                
                const notificationPromises = usersWhoSavedProduct.docs.map(async (user) => {
                    try {
                        const userNotificationsRef = user.ref.collection('notifications');
                        await userNotificationsRef.add({
                            type: 5, // product on sale,
                            productId,
                            attempts: 0,
                            read: false,
                            sent: false,
                            createdAt: FieldValue.serverTimestamp(),
                            scheduledAt: FieldValue.serverTimestamp(),
                        });
                    } catch (userError) {
                        console.error(`Error creating notification for user ${user.id}:`, userError);
                    }
                });
                
                await Promise.all(notificationPromises);
            }
        } catch (error) {
            console.error('Error trying to send on sale notification: ', error)
        }
    }
)
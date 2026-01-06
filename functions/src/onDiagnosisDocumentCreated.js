const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { createNotificationDocument } = require("./utils");
const admin = require("firebase-admin");

exports.onDiagnosisDocumentCreated = onDocumentCreated(
    'users/{userId}/diagnoses/{diagnosisId}',
    async (event) => {
        try {
            const userId = event.params.userId;

            // Delete existing unsent follow-up notifications (types 9, 10, 11, 12)
            const notificationsRef = admin.firestore().collection(`users/${userId}/notifications`);
            const now = new Date();

            const existingNotifications = await notificationsRef
                .where('sent', '==', false)
                .where('scheduledAt', '>', now)
                .where('type', 'in', [9, 10, 11, 12])
                .get();

            const deletePromises = existingNotifications.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises);

            if (deletePromises.length > 0) {
                console.log(`Deleted ${deletePromises.length} existing unsent follow-up notifications for user ${userId}`);
            }

            // Queue all scan-related notifications

            // Schedule notification 1: Scan reminder 48 hours after diagnosis creation
            const scanReminderTime = new Date(now.getTime() + (48 * 60 * 60 * 1000));
            await createNotificationDocument(userId, 1, scanReminderTime);

            // Get the scan ready time (3 days from now at midnight)
            const scanReadyTime = new Date(now);
            scanReadyTime.setDate(scanReadyTime.getDate() + 3);
            scanReadyTime.setHours(0, 0, 0, 0); // Set to midnight

            // Schedule notification 0: Scan ready notification at midnight on the 3rd day
            await createNotificationDocument(userId, 0, scanReadyTime);

            // Schedule notification 9: 1 day after scan becomes available
            const notification9Time = new Date(scanReadyTime.getTime() + 1 * 24 * 60 * 60 * 1000);
            await createNotificationDocument(userId, 9, notification9Time);

            // Schedule notification 10: 2 days after scan becomes available
            const notification10Time = new Date(scanReadyTime.getTime() + 2 * 24 * 60 * 60 * 1000);
            await createNotificationDocument(userId, 10, notification10Time);

            // Schedule notification 11: 3 days after scan becomes available
            const notification11Time = new Date(scanReadyTime.getTime() + 3 * 24 * 60 * 60 * 1000);
            await createNotificationDocument(userId, 11, notification11Time);

            // Schedule notification 12: 7 days after scan becomes available (last resort)
            const notification12Time = new Date(scanReadyTime.getTime() + 7 * 24 * 60 * 60 * 1000);
            await createNotificationDocument(userId, 12, notification12Time);

            console.log(`Successfully queued follow-up scan notifications for user ${userId}`);

        } catch (error) {
            console.error(`Error processing diagnosis document creation for user ${userId}:`, error);
        }
    }
);
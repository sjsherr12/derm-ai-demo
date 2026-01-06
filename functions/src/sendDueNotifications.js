const { onSchedule } = require("firebase-functions/v2/scheduler");
const { db, auth } = require("./firebase-admin");

function getNotificationContent(type) {
    switch (type) {
        case 0: // Scan ready
            return {
                title: 'Scan Ready! 📸',
                body: 'Your next skin scan is now available. Track your progress!'
            };
        case 1: // Scan reminder
            return {
                title: 'Scan Reminder ⏰',
                body: 'Don’t forget - your next scan will be ready tomorrow!'
            };
        case 2: // Morning routine
            return {
                title: 'Morning Routine ☀️',
                body: 'Start your day with your morning skincare routine!'
            };
        case 3: // Evening routine
            return {
                title: 'Evening Routine 🌙',
                body: 'Time for your evening skincare routine before bed!'
            };
        case 4: // Referral code used
            return {
                title: 'Referral Code Used! 🎉',
                body:'Someone just signed up using your referral code!'
            }
        case 5:
            return {
                title:'Limited-Time Sale! 🏷️',
                body:'Your saved {product} from {brand} is discounted to {price} — shop now & save!'
            }
        case 6:
            return {
                title: 'Derm AI',
                body: 'Tired of guessing what’s right for your skin? Let our AI do the work in seconds. ✅'
            }
        case 7:
            return {
                title: 'Derm AI',
                body: 'Your best skin could be one step away — don’t leave your progress unfinished. 📈'
            }
        case 8:
            return {
                title: 'Derm AI',
                body: 'Time is precious. Stop wasting it on trial-and-error routines — let us build yours instantly. ⌛'
            }
        case 9:
            return {
                title: 'Quick Check-In 💡',
                body: 'Your scan is waiting! Stay on track and don’t miss this progress point.'
            };
        case 10:
            return {
                title: 'Keep Your Streak 🌱',
                body: 'Consistency is key for great skin insights. Take your scan today!'
            };
        case 11:
            return {
                title: 'Final Reminder ✨',
                body: 'Don’t let this scan slip by — capture your skin’s progress before it’s too late.'
            };
        case 12:
            return {
                title: 'We miss you 😢',
                body: 'Please come back and take your skin scan — your progress depends on it!'
            };
        default:
        return {
            title: 'Derm AI Notification',
            body: 'You have a skincare reminder!'
        };
    }
}

async function sendExpoNotification(expoPushToken, title, body, data = {}) {
    try {
        const message = {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data: {
                ...data,
                timestamp: Date.now().toString()
            }
        };
        
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        
        const result = await response.json();
        
        if (result.data && result.data.status === 'ok') {
            console.log('Expo notification sent successfully:', result.data.id);
            return { success: true, messageId: result.data.id };
        } else {
            console.error('Expo notification failed:', result);
            
            // Check for invalid token errors
            const isInvalidToken = result.data?.details?.error === 'DeviceNotRegistered' || result.data?.status === 'error';
            
            return { 
                success: false, 
                invalidToken: isInvalidToken, 
                error: result.data?.message || 'Unknown error' 
            };
        }
    } catch (error) {
        console.error('Error sending Expo notification:', error);
        return { success: false, invalidToken: false, error: error.message };
    }
}

// Scheduled function to send due notifications
exports.sendDueNotifications = onSchedule('every 15 minutes', async (event) => {
    try {
        const now = new Date();
        const batchSize = 10000; // Process up to 10000 notifications per run
        
        // Query collection group for due notifications
        const query = db.collectionGroup('notifications')
            .where('sent', '==', false)
            .where('scheduledAt', '<=', now)
            .limit(batchSize);
        
        const querySnapshot = await query.get();
        
        if (querySnapshot.empty) {
            return;
        }

        const batch = db.batch();
        const processedNotifications = [];
        const productCache = new Map(); // Cache for product documents
        
        for (const notificationDoc of querySnapshot.docs) {
            try {
                const notificationData = notificationDoc.data();
                const notificationRef = notificationDoc.ref;
                
                // Extract userId from document path: users/{userId}/notifications/{notificationId}
                const pathParts = notificationRef.path.split('/');
                const userId = pathParts[1];
                
                // Acquire lightweight lock to prevent double processing
                const lockUpdate = {
                    inProgress: true,
                    attempts: (notificationData.attempts || 0) + 1
                };
                
                // Try to acquire lock
                try {
                    await notificationRef.update(lockUpdate);
                } catch (lockError) {
                    console.log(`Failed to acquire lock for notification ${notificationDoc.id}, skipping`);
                    continue;
                }
                
                // Load user document
                const userDoc = await db.collection('users').doc(userId).get();
                if (!userDoc.exists) {
                    console.log(`User ${userId} not found, marking notification as sent`);
                    batch.update(notificationRef, {
                        sent: true,
                        sentAt: now,
                        inProgress: false,
                        error: 'User not found'
                    });
                    continue;
                }
                
                const userData = userDoc.data();

                // Special handling for paywall nudge notifications (types 6, 7, 8)
                if ([6, 7, 8].includes(notificationData.type)) {
                    try {
                        const userRecord = await auth.getUser(userId);

                        // Check if user has any non-anonymous providers
                        const hasNonAnonymousProvider = userRecord.providerData &&
                            userRecord.providerData.some(provider => provider.providerId !== 'anonymous');

                        // If user has linked a non-anonymous provider, delete the notification
                        if (hasNonAnonymousProvider) {
                            console.log(`User ${userId} has linked a non-anonymous provider, deleting paywall nudge notification type ${notificationData.type}`);
                            batch.delete(notificationRef);
                            continue;
                        }

                        // If user is still anonymous-only, proceed with sending the nudge notification
                        console.log(`User ${userId} is still anonymous-only, sending paywall nudge notification type ${notificationData.type}`);
                    } catch (authError) {
                        // If auth.getUser fails, user is anonymous - proceed with sending the notification
                        console.log(`User ${userId} is anonymous (auth error), proceeding with paywall nudge notification type ${notificationData.type}`);
                    }
                }

                // Special handling for scan follow-up notifications (types 9, 10, 11, 12)
                if ([9, 10, 11, 12].includes(notificationData.type)) {
                    try {
                        // Get user's most recent scan to check if they need the reminder
                        const diagnosesRef = db.collection(`users/${userId}/diagnoses`);
                        const querySnapshot = await diagnosesRef
                            .orderBy('createdAt', 'desc')
                            .limit(1)
                            .get();

                        if (!querySnapshot.empty) {
                            const mostRecentScan = querySnapshot.docs[0].data();
                            const mostRecentScanDate = mostRecentScan.createdAt.toDate();
                            const daysSinceLastScan = Math.floor((now - mostRecentScanDate) / (24 * 60 * 60 * 1000));

                            // Define expected days for each notification type
                            const expectedDays = {
                                9: 4,   // 1 day after scan becomes available (4 days total)
                                10: 5,  // 2 days after scan becomes available (5 days total)
                                11: 6,  // 3 days after scan becomes available (6 days total)
                                12: 10  // 7 days after scan becomes available (10 days total)
                            };

                            const expectedDaysSinceLastScan = expectedDays[notificationData.type];

                            // If the user has scanned more recently than expected, delete the notification
                            if (daysSinceLastScan < expectedDaysSinceLastScan) {
                                console.log(`User ${userId} scanned ${daysSinceLastScan} days ago, deleting scan follow-up notification type ${notificationData.type} (expected ${expectedDaysSinceLastScan}+ days)`);
                                batch.delete(notificationRef);
                                continue;
                            }

                            // If user hasn't scanned in the expected timeframe, proceed with sending the reminder
                            console.log(`User ${userId} last scanned ${daysSinceLastScan} days ago, sending scan follow-up notification type ${notificationData.type}`);
                        } else {
                            // No scans found - this shouldn't happen for follow-up notifications, but proceed anyway
                            console.log(`User ${userId} has no scans found, proceeding with scan follow-up notification type ${notificationData.type}`);
                        }
                    } catch (scanCheckError) {
                        console.error(`Error checking scan history for user ${userId}:`, scanCheckError);
                        // If we can't check scan history, proceed with sending the notification to be safe
                        console.log(`Unable to verify scan history for user ${userId}, proceeding with notification type ${notificationData.type}`);
                    }
                }

                // Check if user still has notifications enabled
                if (!userData.notifications?.enabled) {
                    console.log(`User ${userId} has notifications disabled, marking as sent`);
                    batch.update(notificationRef, {
                        sent: true,
                        sentAt: now,
                        inProgress: false,
                        error: 'Notifications disabled'
                    });
                    continue;
                }
                
                // Get Expo push token
                const expoPushToken = userData.notifications?.fcmToken;
                    if (!expoPushToken) {
                    console.log(`No Expo push token for user ${userId}, marking as sent`);
                    batch.update(notificationRef, {
                        sent: true,
                        sentAt: now,
                        inProgress: false,
                        error: 'No Expo push token'
                    });
                    continue;
                }
                
                // Get notification content
                // Check if custom message field exists, otherwise translate from type
                let content;
                if (notificationData.message) {
                    // Handle custom message - can be a string or an object with title/body
                    if (typeof notificationData.message === 'string') {
                        // If message is a string, use it as the body with a default title
                        content = {
                            title: 'Derm AI',
                            body: notificationData.message
                        };
                    } else if (typeof notificationData.message === 'object') {
                        // If message is an object, extract title and body
                        content = {
                            title: notificationData.message.title || 'Derm AI Notification',
                            body: notificationData.message.body || notificationData.message
                        };
                    } else {
                        // Fallback to type-based content if message format is unexpected
                        content = getNotificationContent(notificationData.type);
                    }
                } else {
                    // No custom message, use type-based translation
                    content = getNotificationContent(notificationData.type);
                }
                
                // Handle type 5 notifications (product on sale) with product data
                if (notificationData.type === 5 && notificationData?.productId) {
                    let productData = productCache.get(notificationData.productId);
                    
                    if (!productData) {
                        try {
                            const productDoc = await db.collection('products').doc(notificationData.productId).get();
                            if (productDoc.exists) {
                                productData = productDoc.data();
                                productCache.set(notificationData.productId, productData);
                            } else {
                                // product wasnt found, just delete notification on the spot
                                batch.delete(notificationRef);
                                continue;
                            }
                        } catch (productError) {
                            console.error(`Error fetching product ${notificationData.productId}:`, productError);
                            batch.update(notificationRef, {
                                inProgress: false,
                                lastError: `Product fetch error: ${productError.message}`,
                                lastAttemptAt: now
                            });
                            continue;
                        }
                    }
                
                    // Replace placeholders in the notification body
                    content = {
                        ...content,
                        body: content.body
                        .replace('{product}', productData.name || 'Unknown Product')
                        .replace('{brand}', productData.brand || 'Unknown Brand')
                        .replace('{price}', productData.price ? `$${productData.price.toFixed(2)}` : 'Unknown Price')
                    };
                }
                
                // Send Expo notification
                const fcmResult = await sendExpoNotification(
                    expoPushToken,
                    content.title,
                    content.body,
                    {
                        notificationType: notificationData.type.toString(),
                        userId,
                        ...(notificationData.productId && { productId: notificationData.productId })
                    }
                );
                
                if (fcmResult.success) {
                    console.log(`Successfully sent notification ${notificationDoc.id} to user ${userId}`);
                    batch.update(notificationRef, {
                        sent: true,
                        sentAt: now,
                        inProgress: false,
                        messageId: fcmResult.messageId
                    });
                } else {
                    console.error(`Failed to send notification ${notificationDoc.id}:`, fcmResult.error);
                    
                    const updateData = {
                        inProgress: false,
                        lastError: fcmResult.error,
                        lastAttemptAt: now
                    };
                    
                    // If token is invalid, mark as sent to prevent retries
                    if (fcmResult.invalidToken) {
                        updateData.sent = true;
                        updateData.error = 'Invalid Expo push token';
                        
                        // Optionally clear the invalid token from user document
                        try {
                            await db.collection('users').doc(userId).update({
                                'notifications.fcmToken': null
                            });
                        } catch (tokenUpdateError) {
                            console.error('Error clearing invalid Expo push token:', tokenUpdateError);
                        }
                    }
                    
                    batch.update(notificationRef, updateData);
                }
                
                processedNotifications.push({
                    id: notificationDoc.id,
                    userId,
                    type: notificationData.type,
                    success: fcmResult.success
                });
                
            } catch (processingError) {
                console.error(`Error processing notification ${notificationDoc.id}:`, processingError);
                
                // Mark as failed and release lock
                batch.update(notificationDoc.ref, {
                    inProgress: false,
                    lastError: processingError.message,
                    lastAttemptAt: now
                });
            }
        }
        
        // Commit all updates in batch
        await batch.commit();
        
        const successCount = processedNotifications.filter(n => n.success).length;
        const failureCount = processedNotifications.filter(n => !n.success).length;
        
        console.log(`sendDueNotifications completed: ${successCount} sent, ${failureCount} failed, ${processedNotifications.length} total processed`);
        
    } catch (error) {
        console.error('Error in sendDueNotifications:', error);
        throw error;
    }
});
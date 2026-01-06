const { onSchedule } = require("firebase-functions/v2/scheduler");
const { db } = require("./firebase-admin");
const {
    SKIN_TYPES,
    SKIN_SENSITIVITIES,
    GENERIC_CLIMATES,
    BREAKOUT_LOCATIONS,
    COMMON_ALLERGENS,
    SKIN_CONCERNS,
    SKIN_TONES
} = require("./utils");

// Notification templates - bodies only
const NOTIFICATION_TEMPLATES = [
    "Quick reminder from your skin coach: log today's routine so we can keep tracking what works for you 📊",
    "Tiny habit, big results: did you do your skincare tonight? Tap to mark it done ✅",
    "Future-you is going to thank you for today's routine. Want to check it off? 💪",

    "Oily skin does best with consistency. Did you cleanse yet today?",
    "Your {skinType} skin will be happiest with a light, non-greasy routine tonight. Open the app to see today's steps 🧴",

    "Combo skin needs balancing. Log today's routine so we can keep both sides happy.",

    "Your {sensitivity} skin does best with gentle consistency. Ready to tick off today's gentle routine?",
    "Let's keep your sensitive skin calm today. Tap to confirm you used gentle products so I can track reactions 🌸",

    "Your {climate} weather can clog pores fast. A proper cleanse tonight will help your {primaryConcern} 🌤️",
    "Humid days plus {skinType} skin can cause buildup. Did you wash and use your non-comedogenic products yet?",
    "Cold, dry air can stress your moisture barrier. Don't skip your moisturizer tonight 🧴",
    "Your {climate} climate is rough on dryness and redness. Log today's routine so we can see how your skin is coping ❄️",

    "UV can impact your {skinConcerns}. Did you apply (or reapply) SPF today? ☀️",
    "Sun protection is one of the best ways to help your skin long-term. Quick SPF check-in?",

    "Acne routines work best without skipped days. Did you complete today's anti-breakout steps? ✨",
    "Your skin is healing even when you don't see it. Log today's acne routine so we stay on track 📈",

    "Dark spots fade from consistency. Did you do your brightening routine today? 🌟",

    "How reactive was your skin today—calm, tingling, or irritated? Log it so I can learn what's soothing your redness 🔴",

    "Consistency beats expensive products for fine lines. Tap to log today's routine—I'll track your progress 📊",

    "How smooth did your skin feel today? A quick 5-second check-in helps track texture changes ✨",
    "Tiny routines lead to smoother-looking skin. Did you exfoliate on schedule this week?",

    "Seeing breakouts on your {breakoutLocation}? Log today's breakout level so I can watch the pattern 🔍",
    "Breakouts around your {breakoutLocation} can be stubborn. Did you follow your routine there tonight?",

    "Reminder: your skin prefers to avoid {sensitivities}. Want to double-check today's products? 🛡️",
    "I'm keeping your routine free from {sensitivities}. Log what you used so I can catch any triggers 📝",
    "If you tried anything new today, log it so we can see how your skin reacts—especially with your {sensitivities} sensitivity ⚠️",

    "Gentle reminder for gentle skin: avoid harsh scrubs tonight. Tap to confirm your calm routine instead 💆",

    "SPF matters for every skin tone, including {skinTone}. Did you wear yours today? ☀️",
    "Dark marks can linger longer on {skinTone} skin. Your brightening routine today helps—want to mark it complete? ✨"
];

/**
 * Helper function to get a readable value from a numeric code
 */
function getValueFromMapping(mapping, value) {
    if (value === null || value === undefined) return null;
    const item = mapping.find(m => m.value === value);
    return item ? item.title.toLowerCase() : null;
}

/**
 * Helper function to get the first non-zero breakout location
 */
function getBreakoutLocation(breakoutLocations) {
    if (!Array.isArray(breakoutLocations) || breakoutLocations.length === 0) {
        return null;
    }

    // Find first non-zero location
    const location = breakoutLocations.find(loc => loc && loc !== 0);
    if (!location) return null;

    return getValueFromMapping(BREAKOUT_LOCATIONS, location);
}

/**
 * Helper function to get the primary skin concern
 */
function getPrimaryConcern(skinConcerns) {
    if (!Array.isArray(skinConcerns) || skinConcerns.length === 0) {
        return null;
    }

    // Find first non-zero concern
    const concern = skinConcerns.find(c => c && c !== 0);
    if (!concern) return null;

    const concernObj = SKIN_CONCERNS.find(sc => sc.value === concern);
    return concernObj ? concernObj.title.toLowerCase() : null;
}

/**
 * Helper function to get a list of sensitivities/allergens
 */
function getSensitivities(sensitivities) {
    if (!Array.isArray(sensitivities) || sensitivities.length === 0) {
        return null;
    }

    // Filter out 0 (None) and get titles
    const allergenTitles = sensitivities
        .filter(s => s && s !== 0)
        .map(s => {
            const allergen = COMMON_ALLERGENS.find(a => a.value === s);
            return allergen ? allergen.title.toLowerCase() : null;
        })
        .filter(Boolean);

    if (allergenTitles.length === 0) return null;

    // Join with commas and "and" for the last item
    if (allergenTitles.length === 1) return allergenTitles[0];
    if (allergenTitles.length === 2) return `${allergenTitles[0]} and ${allergenTitles[1]}`;

    const lastItem = allergenTitles.pop();
    return `${allergenTitles.join(', ')}, and ${lastItem}`;
}

/**
 * Helper function to get multiple skin concerns as a string
 */
function getSkinConcernsString(skinConcerns) {
    if (!Array.isArray(skinConcerns) || skinConcerns.length === 0) {
        return null;
    }

    const concernTitles = skinConcerns
        .filter(c => c && c !== 0)
        .map(c => {
            const concern = SKIN_CONCERNS.find(sc => sc.value === c);
            return concern ? concern.title.toLowerCase() : null;
        })
        .filter(Boolean);

    if (concernTitles.length === 0) return null;
    if (concernTitles.length === 1) return concernTitles[0];
    if (concernTitles.length === 2) return `${concernTitles[0]} and ${concernTitles[1]}`;

    const lastItem = concernTitles.pop();
    return `${concernTitles.join(', ')}, and ${lastItem}`;
}

/**
 * Fill template placeholders with user data
 */
function fillTemplate(template, userData) {
    let filled = template;
    const profile = userData.profile || {};
    const skinInfo = profile.skinInfo || {};

    // Build replacement map
    const replacements = {
        skinType: getValueFromMapping(SKIN_TYPES, skinInfo.skinType),
        sensitivity: getValueFromMapping(SKIN_SENSITIVITIES, skinInfo.sensitivity),
        climate: getValueFromMapping(GENERIC_CLIMATES, skinInfo.climate),
        breakoutLocation: getBreakoutLocation(skinInfo.breakoutLocations),
        primaryConcern: getPrimaryConcern(skinInfo.skinConcerns),
        skinConcerns: getSkinConcernsString(skinInfo.skinConcerns),
        sensitivities: getSensitivities(skinInfo.sensitivities),
        skinTone: getValueFromMapping(SKIN_TONES, skinInfo.skinTone)
    };

    // Replace placeholders
    for (const [key, value] of Object.entries(replacements)) {
        const placeholder = `{${key}}`;
        if (filled.includes(placeholder)) {
            if (!value) {
                // If user doesn't have this field, skip this template
                return null;
            }
            filled = filled.replace(new RegExp(placeholder, 'g'), value);
        }
    }

    return filled;
}

/**
 * Select templates appropriate for the user's profile
 */
function selectTemplatesForUser(userData, count = 7) {
    const selectedMessages = [];
    const availableTemplates = [...NOTIFICATION_TEMPLATES];

    // Shuffle templates
    for (let i = availableTemplates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableTemplates[i], availableTemplates[j]] = [availableTemplates[j], availableTemplates[i]];
    }

    // Try to fill templates until we have enough
    for (const template of availableTemplates) {
        if (selectedMessages.length >= count) break;

        const filled = fillTemplate(template, userData);
        if (filled) {
            selectedMessages.push(filled);
        }
    }

    // If we don't have enough, use generic fallbacks
    const genericFallbacks = [
        "Quick reminder from your skin coach: log today's routine so we can keep tracking what works for you 📊",
        "Tiny habit, big results: did you do your skincare tonight? Tap to mark it done ✅",
        "Future-you is going to thank you for today's routine. Want to check it off? 💪"
    ];

    while (selectedMessages.length < count) {
        selectedMessages.push(genericFallbacks[selectedMessages.length % genericFallbacks.length]);
    }

    return selectedMessages.slice(0, count);
}

/**
 * Modified createNotificationDocument to handle custom message field
 */
async function createNotificationDocument(userId, type, scheduledAt, message = null) {
    try {
        const notificationData = {
            type,
            createdAt: new Date(),
            scheduledAt,
            sent: false,
            attempts: 0,
            read: false
        };

        // Add message field if provided
        if (message) {
            notificationData.message = message;
        }

        const notificationRef = db.collection(`users/${userId}/notifications`).doc();
        await notificationRef.set(notificationData);

        return notificationRef.id;
    } catch (error) {
        console.error('Error creating notification document:', error);
        throw error;
    }
}

/**
 * Main scheduled function to queue weekly notifications
 */
exports.queueWeeklyNotifications = onSchedule('0 0 * * 0', async (event) => {
    try {
        console.log('Starting queueWeeklyNotifications...');

        // Query all users with notifications enabled
        const usersSnapshot = await db.collection('users')
            .where('notifications.enabled', '==', true)
            .get();

        if (usersSnapshot.empty) {
            console.log('No users with notifications enabled found');
            return;
        }

        console.log(`Found ${usersSnapshot.size} users with notifications enabled`);

        const now = new Date();
        let totalNotificationsCreated = 0;

        // Process each user
        for (const userDoc of usersSnapshot.docs) {
            try {
                const userId = userDoc.id;
                const userData = userDoc.data();

                // Select 7 personalized messages for this user
                const weeklyMessages = selectTemplatesForUser(userData, 7);

                // Schedule one notification for each day of the upcoming week
                for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
                    const scheduledDate = new Date(now);
                    scheduledDate.setDate(now.getDate() + dayOffset);

                    // Schedule for 8 PM local time (you may want to adjust based on user timezone)
                    scheduledDate.setHours(20, 0, 0, 0);

                    const messageBody = weeklyMessages[dayOffset - 1];

                    // Create notification with custom message
                    await createNotificationDocument(
                        userId,
                        100, // Use type 100 for weekly routine reminders (or any unused type)
                        scheduledDate,
                        messageBody
                    );

                    totalNotificationsCreated++;
                }

                console.log(`Queued 7 notifications for user ${userId}`);

            } catch (userError) {
                console.error(`Error processing user ${userDoc.id}:`, userError);
                // Continue with next user
            }
        }

        console.log(`queueWeeklyNotifications completed: ${totalNotificationsCreated} notifications created for ${usersSnapshot.size} users`);

    } catch (error) {
        console.error('Error in queueWeeklyNotifications:', error);
        throw error;
    }
});

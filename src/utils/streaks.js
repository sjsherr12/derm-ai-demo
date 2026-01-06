import { doc, getDoc, updateDoc, arrayUnion, getFirestore, addDoc, collection } from 'firebase/firestore';
import { getTodayDateString, getLocalDateString } from './routine';

export const getUserRoutineCompletions = async (userId) => {
    try {
        const db = getFirestore();
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                morningRoutine: data.routine?.morningRoutine || [],
                eveningRoutine: data.routine?.eveningRoutine || []
            };
        }

        return {
            morningRoutine: [],
            eveningRoutine: []
        };
    } catch (error) {
        console.error('Error fetching routine completions:', error);
        return {
            morningRoutine: [],
            eveningRoutine: []
        };
    }
};

export const completeRoutine = async (userId, routineType) => {
    try {
        const db = getFirestore();
        const userRef = doc(db, 'users', userId);
        const completionTimestamp = Date.now();
        const fieldName = routineType === 0 ? 'routine.morningRoutine' : 'routine.eveningRoutine';

        // Update routine completion immediately for UI
        await updateDoc(userRef, {
            [fieldName]: arrayUnion(completionTimestamp)
        });
        console.log('doing')
        // Schedule next day's notification asynchronously (non-blocking)
        await scheduleNextRoutineNotification(userId, routineType);

        return completionTimestamp;
    } catch (error) {
        console.error('Error completing routine:', error);
        throw error;
    }
};

// Async notification scheduling (fire-and-forget)
async function scheduleNextRoutineNotification(userId, routineType) {
    try {
        const db = getFirestore();

        // Check if user has notifications enabled
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();

        if (!userDoc.exists() || !userData.notifications?.enabled) {
            return;
        }

        const notificationType = routineType === 0 ? 2 : 3; // 0=morning->2, 1=evening->3

        // Calculate next day's notification time
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let targetTime;
        if (notificationType === 2) { // Morning routine
            targetTime = new Date(tomorrow);
            targetTime.setHours(6, 0, 0, 0); // 6am
        } else { // Evening routine
            targetTime = new Date(tomorrow);
            targetTime.setHours(18, 0, 0, 0); // 6pm
        }

        // For simplicity, just use the target time directly
        // The notification sender will handle any timezone considerations
        const scheduledAt = targetTime;

        // Create notification document
        const notificationData = {
            type: notificationType,
            createdAt: new Date(),
            scheduledAt,
            sent: false,
            attempts: 0,
            read: false
        };

        const notificationRef = collection(db, `users/${userId}/notifications`);
        await addDoc(notificationRef, notificationData);

        console.log(`Scheduled next routine notification for user ${userId}, type ${notificationType}`);
    } catch (error) {
        console.error('Error in scheduleNextRoutineNotification:', error);
        // Don't throw - this is fire-and-forget
    }
}

export const isRoutineCompletedToday = (completions) => {
    const today = getTodayDateString();
    return completions.some(completion => {
        const completionDate = getLocalDateString(new Date(completion));
        return completionDate === today;
    });
};

export const getCompletedDaysForCalendar = (morningCompletions, eveningCompletions) => {
    const completedDays = [];
    const uniqueDates = new Set();

    morningCompletions.forEach(completion => {
        const date = getLocalDateString(new Date(completion));
        uniqueDates.add(date);
    });

    eveningCompletions.forEach(completion => {
        const date = getLocalDateString(new Date(completion));
        if (uniqueDates.has(date)) {
            completedDays.push(new Date(completion).getTime());
        }
    });

    return completedDays;
};

export const getIndividualCompletedDaysForCalendar = (completions) => {
    return completions.map(completion => new Date(completion).getTime());
};
import { collection, getDocs, doc, deleteDoc, getFirestore, addDoc } from 'firebase/firestore';

/**
 * Get all notification documents for a user (for testing/debugging)
 */
export async function getUserNotifications(userId) {
  try {
    const db = getFirestore();
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const snapshot = await getDocs(notificationsRef);
    
    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        scheduledAt: doc.data().scheduledAt?.toDate ? 
          doc.data().scheduledAt.toDate() : 
          new Date(doc.data().scheduledAt)
      });
    });
    
    return notifications.sort((a, b) => a.scheduledAt - b.scheduledAt);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

/**
 * Clear all notification documents for a user (for testing)
 */
export async function clearUserNotifications(userId) {
  try {
    const db = getFirestore();
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const snapshot = await getDocs(notificationsRef);
    
    const deletePromises = [];
    snapshot.forEach(docSnapshot => {
      deletePromises.push(deleteDoc(docSnapshot.ref));
    });
    
    await Promise.all(deletePromises);
    console.log(`Cleared ${deletePromises.length} notifications for user ${userId}`);
    return deletePromises.length;
  } catch (error) {
    console.error('Error clearing user notifications:', error);
    return 0;
  }
}
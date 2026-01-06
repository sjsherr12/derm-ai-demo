import { doc, updateDoc, getFirestore } from 'firebase/firestore';

export async function enableNotificationsForUser(userId) {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      'notifications.enabled': true
    });
    
    console.log('Notifications enabled for user:', userId);
    return true;
  } catch (error) {
    console.error('Error enabling notifications:', error);
    return false;
  }
}

export async function disableNotificationsForUser(userId) {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      'notifications.enabled': false
    });
    
    console.log('Notifications disabled for user:', userId);
    return true;
  } catch (error) {
    console.error('Error disabling notifications:', error);
    return false;
  }
}
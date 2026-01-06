import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    // Get the Expo push token
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    
    console.log('Expo Push Token:', token.data);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token?.data;
}

export async function saveFCMTokenToUser(userId, expoPushToken) {
  if (!userId || !expoPushToken) {
    console.log('Missing userId or expoPushToken');
    return;
  }

  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);

    // Use setDoc with merge to ensure the document exists first
    await setDoc(userRef, {
      notifications: {
        fcmToken: expoPushToken
      }
    }, { merge: true });

    console.log('Expo push token saved to user document');
  } catch (error) {
    console.error('Error saving Expo push token:', error);
    throw error; // Re-throw to see the actual error
  }
}

export async function setupNotifications(userId) {
  try {
    // Register for push notifications
    const expoPushToken = await registerForPushNotificationsAsync();
    
    if (expoPushToken && userId) {
      // Save token to user document
      await saveFCMTokenToUser(userId, expoPushToken);
      return expoPushToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return null;
  }
}

// Listen for notification interactions
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Listen for notifications received while app is foregrounded
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}
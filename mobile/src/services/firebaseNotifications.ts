import * as Notifications from 'expo-notifications';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging/rn';
import { getApiClient } from '../api/client';

const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let initialized = false;

export const setupFirebaseNotifications = async () => {
  if (initialized) return;

  try {
    // Initialize Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      // Send token to backend
      const api = getApiClient();
      await api.post('/notifications/fcm-token', { token });
    }

    // Handle incoming messages
    onMessage(messaging, (payload) => {
      const { notification, data } = payload;

      Notifications.scheduleNotificationAsync({
        content: {
          title: notification?.title,
          body: notification?.body,
          data: data || {},
        },
        trigger: null,
      });
    });

    // Handle notification taps
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });

    // Listen for notification responses
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationTap(data);
    });

    initialized = true;
  } catch (error) {
    console.error('Firebase setup error:', error);
  }
};

const handleNotificationTap = (data: Record<string, any>) => {
  // Handle notification tap based on type
  if (data.type === 'message') {
    // Navigate to conversation
  } else if (data.type === 'listing') {
    // Navigate to listing detail
  }
};

export const requestNotificationPermission = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === 'granted';
    }
    return true;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
};

export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null,
  });
};

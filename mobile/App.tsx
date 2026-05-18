import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import NetInfo from '@react-native-community/netinfo';

import { initializeApiClient } from './src/api/client';
import { initializeDatabase } from './src/db/index';
import { setupFirebaseNotifications, requestNotificationPermission } from './src/services/firebaseNotifications';
import { registerBackgroundSync } from './src/services/backgroundSync';
import { RootNavigator } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize API client
        initializeApiClient();

        // Initialize database
        await initializeDatabase();

        // Setup Firebase notifications
        await setupFirebaseNotifications();

        // Request notification permission
        await requestNotificationPermission();

        // Register background sync
        await registerBackgroundSync();

        // Load fonts if needed
        // await Font.loadAsync({...})

        // Setup network change listener
        const unsubscribe = NetInfo.addEventListener((state) => {
          console.log('Network state:', state);
          if (state.isConnected) {
            // Trigger sync when connection restored
            // triggerBackgroundSync();
          }
        });

        setIsReady(true);

        return unsubscribe;
      } catch (error) {
        console.error('App initialization error:', error);
      }
    }

    const cleanup = prepare();
    return () => {
      cleanup?.then((unsubscribe) => unsubscribe?.());
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return <RootNavigator />;
}

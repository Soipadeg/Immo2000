# Phase 6: Mobile App (React Native) - Plan Complet

**Status**: 🔄 IN PROGRESS
**Timeline**: 3-4 semaines
**Objective**: Étendre Immo2000 sur iOS et Android avec React Native

---

## 🎯 Objectif Phase 6

Créer une **application mobile native** (iOS + Android) qui:
- ✅ Partage 80%+ du code avec le web (React Native)
- ✅ Utilise l'API REST existante du backend
- ✅ Fournit notifications natives (Firebase)
- ✅ Accès aux caméra/galerie du téléphone
- ✅ Mode offline complet
- ✅ Performance native (~60 FPS)

---

## 📊 Architecture Phase 6

```
┌─────────────────────────────────────────────────────────────┐
│                        MOBILE APP (RN)                      │
├─────────────────────────────────────────────────────────────┤
│ 6.1: Setup Project                                          │
│  ├─ React Native 0.73+                                      │
│  ├─ Expo CLI (development)                                  │
│  ├─ EAS Build (iOS/Android builds)                          │
│  └─ Navigation (React Navigation)                           │
├─────────────────────────────────────────────────────────────┤
│ 6.2: Shared Code Layer                                      │
│  ├─ Common hooks (useAuth, useNotifications)                │
│  ├─ Common utilities (api client, validation)               │
│  ├─ Shared stores (Zustand)                                 │
│  └─ Constants & types (TypeScript)                          │
├─────────────────────────────────────────────────────────────┤
│ 6.3: Native Features                                        │
│  ├─ Push Notifications (Firebase Cloud Messaging)           │
│  ├─ Camera & Gallery (expo-image-picker)                    │
│  ├─ Location Services (expo-location)                       │
│  ├─ Biometric Auth (expo-local-authentication)              │
│  └─ File System (expo-file-system)                          │
├─────────────────────────────────────────────────────────────┤
│ 6.4: Core Screens                                           │
│  ├─ Auth (login, signup, 2FA)                               │
│  ├─ Listings (list, detail, create)                         │
│  ├─ Messages (conversations, real-time)                     │
│  ├─ Notifications (push, in-app)                            │
│  ├─ Profile (user settings, preferences)                    │
│  └─ Search & Filters                                        │
├─────────────────────────────────────────────────────────────┤
│ 6.5: Offline & Sync                                         │
│  ├─ AsyncStorage (persistent state)                         │
│  ├─ Background sync (expo-task-manager)                     │
│  ├─ WatermelonDB (local database)                           │
│  └─ Conflict resolution                                     │
├─────────────────────────────────────────────────────────────┤
│ 6.6: Performance                                            │
│  ├─ Image lazy loading                                      │
│  ├─ FlatList virtualization                                 │
│  ├─ Code splitting (hermes engine)                          │
│  ├─ Memory optimization                                     │
│  └─ Battery optimization                                    │
├─────────────────────────────────────────────────────────────┤
│ 6.7: Testing & Build                                        │
│  ├─ Unit tests (Jest)                                       │
│  ├─ Integration tests                                       │
│  ├─ EAS build iOS                                           │
│  ├─ EAS build Android                                       │
│  └─ App Store Connect submission                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Sub-Phases Détaillées

### **Phase 6.1: Setup & Project Structure** (~3 heures)

**Objectif**: Initialiser React Native avec Expo, configuration de base

**Fichiers à créer**:
```
mobile/
├── app.json (Expo config)
├── package.json
├── .env.example
├── eas.json (build config)
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── AppNavigator.tsx
│   ├── screens/
│   │   ├── auth/
│   │   ├── listings/
│   │   ├── messages/
│   │   ├── notifications/
│   │   └── profile/
│   ├── components/
│   │   ├── common/
│   │   └── ui/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   └── useOffline.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── notifications.ts
│   │   └── storage.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── appStore.ts
│   ├── utils/
│   │   └── constants.ts
│   └── App.tsx
└── assets/
    ├── icons/
    └── images/
```

**Stack** :
- `react-native`: 0.73+
- `expo`: Latest stable
- `expo-router`: Navigation
- `react-navigation`: Navigation library
- `typescript`: Type safety

**Résultats**:
- ✅ Expo project initialized
- ✅ TypeScript configured
- ✅ Navigation structure ready
- ✅ Environment variables setup

---

### **Phase 6.2: Shared Code Layer** (~2 heures)

**Objectif**: Code réutilisable entre web et mobile

**Concept**: Dossier `shared/` contenant code commun

```
shared/
├── hooks/
│   ├── useAuth.ts (shared logic)
│   ├── useApi.ts (API client hook)
│   ├── useNotifications.ts
│   ├── useOfflineSync.ts
│   └── useWebSocket.ts
├── stores/
│   ├── authStore.ts (Zustand)
│   ├── notificationStore.ts
│   └── appStore.ts
├── api/
│   ├── client.ts (Axios + interceptors)
│   ├── types.ts (TypeScript types)
│   ├── auth.api.ts
│   ├── listings.api.ts
│   ├── messages.api.ts
│   └── notifications.api.ts
├── utils/
│   ├── validation.ts (Zod schemas)
│   ├── constants.ts
│   ├── errorHandler.ts
│   └── logger.ts
├── types/
│   ├── auth.ts
│   ├── listing.ts
│   ├── message.ts
│   └── user.ts
└── README.md (shared code guide)
```

**Stratégie**:
- Même Zustand stores pour web + mobile
- Même validation Zod
- Même API client (Axios)
- Même types TypeScript
- Différences: UI components seulement

**Résultats**:
- ✅ 80% code réutilisé
- ✅ Type safety garantie
- ✅ Single source of truth

---

### **Phase 6.3: Native Features Integration** (~3 heures)

**Objectif**: Intégrer Firebase, camera, location, etc.

**A. Push Notifications (Firebase)**
```typescript
// services/firebaseNotifications.ts

import * as Notifications from 'expo-notifications';
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/rn';

export const setupFirebaseNotifications = async () => {
  // 1. Initialize Firebase
  const app = initializeApp(FIREBASE_CONFIG);
  const messaging = getMessaging(app);

  // 2. Get FCM token
  const fcmToken = await getToken(messaging);

  // 3. Send to backend
  await apiClient.post('/notifications/fcm-token', {
    token: fcmToken
  });

  // 4. Handle notifications
  onMessage(messaging, (payload) => {
    showLocalNotification(payload);
  });
};

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
```

**B. Camera & Gallery**
```typescript
// services/mediaService.ts

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.9,
  });

  if (!result.cancelled) {
    return result.assets[0];
  }
};

export const takePhoto = async () => {
  const permission = await Camera.requestCameraPermissionsAsync();
  if (permission.granted) {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });
    return result.assets[0];
  }
};

// Compress image
export const compressImage = async (uri: string) => {
  // Use native compression
  const compressed = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return compressedUri;
};
```

**C. Location Services**
```typescript
// services/locationService.ts

import * as Location from 'expo-location';

export const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }
};

export const geocode = async (latitude: number, longitude: number) => {
  const addresses = await Location.reverseGeocodeAsync({
    latitude,
    longitude,
  });
  return addresses[0];
};
```

**D. Biometric Authentication**
```typescript
// services/biometricAuth.ts

import * as LocalAuthentication from 'expo-local-authentication';

export const isBiometricAvailable = async () => {
  return await LocalAuthentication.hasHardwareAsync();
};

export const authenticate = async () => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      reason: 'Authentifiez-vous pour accéder à Immo2000',
    });
    return result.success;
  } catch (error) {
    console.error('Biometric auth failed:', error);
    return false;
  }
};
```

**Stack**:
- `expo-notifications`: Local notifications
- `firebase-admin`: Backend FCM
- `expo-image-picker`: Camera & gallery
- `expo-location`: GPS
- `expo-local-authentication`: Biometric

**Résultats**:
- ✅ Firebase notifications configured
- ✅ Camera integration working
- ✅ Location services enabled
- ✅ Biometric auth functional

---

### **Phase 6.4: Core Screens** (~4 heures)

**Objectif**: Implémenter les écrans principaux

#### **A. AuthStack** (Login + Signup + 2FA)
```typescript
// screens/auth/LoginScreen.tsx

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../shared/hooks/useAuth';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    await login(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Immo2000</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={handleLogin} disabled={loading}>
        <Text style={styles.button}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};
```

#### **B. ListingsStack** (List + Detail + Create)
```typescript
// screens/listings/ListingsScreen.tsx

import React, { useEffect } from 'react';
import { FlatList, View, Text } from 'react-native';
import { useListings } from '../../shared/hooks/useListings';

export const ListingsScreen = ({ navigation }) => {
  const { listings, loading } = useListings();

  useEffect(() => {
    // Load listings on mount
  }, []);

  return (
    <FlatList
      data={listings}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
        >
          <Image source={{ uri: item.image }} />
          <Text>{item.title}</Text>
          <Text>{item.price} €</Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
    />
  );
};
```

#### **C. MessagesStack** (Conversations + Real-time)
```typescript
// screens/messages/ConversationsScreen.tsx

import React, { useEffect } from 'react';
import { FlatList } from 'react-native';
import { useConversations } from '../../shared/hooks/useConversations';

export const ConversationsScreen = ({ navigation }) => {
  const { conversations } = useConversations();

  return (
    <FlatList
      data={conversations}
      renderItem={({ item }) => (
        <ConversationItem
          conversation={item}
          onPress={() => navigation.navigate('Messages', { id: item.id })}
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
};
```

#### **D. NotificationsStack**
```typescript
// screens/notifications/NotificationsScreen.tsx

import React from 'react';
import { FlatList, View } from 'react-native';
import { useNotifications } from '../../shared/stores/notificationStore';

export const NotificationsScreen = () => {
  const notifications = useNotifications();

  return (
    <FlatList
      data={notifications}
      renderItem={({ item }) => <NotificationItem notification={item} />}
      keyExtractor={(item) => item.id}
    />
  );
};
```

**Stack**:
- `react-navigation/native`: Navigation
- `react-navigation/bottom-tabs`: Tab navigator
- `react-navigation/stack`: Stack navigator

**Résultats**:
- ✅ Auth flow complete (login → 2FA → home)
- ✅ Listings CRUD working
- ✅ Real-time messages
- ✅ Notification center
- ✅ Profile/settings screen

---

### **Phase 6.5: Offline & Sync** (~2.5 heures)

**Objectif**: Offline-first architecture avec local database

#### **A. AsyncStorage (Persistent State)**
```typescript
// services/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { zustandStorage } from 'zustand-storage';

export const persistAuthStore = async () => {
  return {
    name: 'auth-store',
    storage: zustandStorage(AsyncStorage),
  };
};
```

#### **B. WatermelonDB (Local Database)**
```typescript
// db/schema.ts

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'listings',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'image_url', type: 'string' },
        { name: 'synced_at', type: 'number' },
        { name: 'is_local', type: 'boolean', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'conversation_id', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'sender_id', type: 'string' },
        { name: 'is_pending', type: 'boolean', isOptional: true },
      ],
    }),
  ],
});

// db/index.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'immo2000',
});

export const database = new Database({
  adapter,
  modelClasses: [Listing, Message],
});
```

#### **C. Background Sync**
```typescript
// services/backgroundSync.ts

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_SYNC_TASK = 'sync-pending-requests';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Get pending requests from WatermelonDB
    const pendingRequests = await getPendingRequests();

    // Sync each request
    for (const request of pendingRequests) {
      try {
        const response = await apiClient[request.method](
          request.url,
          request.data
        );
        await markSynced(request.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background sync
export const registerBackgroundSync = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
};
```

**Stack**:
- `@react-native-async-storage/async-storage`: Key-value storage
- `@nozbe/watermelondb`: Local SQLite database
- `expo-background-fetch`: Background tasks
- `expo-task-manager`: Task scheduling

**Résultats**:
- ✅ Persistent state (auth, settings)
- ✅ Local database (listings, messages)
- ✅ Background sync (every 15 min)
- ✅ Conflict resolution strategy

---

### **Phase 6.6: Performance Optimization** (~2 heures)

**Objectif**: Optimiser pour performances natives (~60 FPS)

#### **A. Image Lazy Loading**
```typescript
// components/CachedImage.tsx

import React from 'react';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useMemoOne } from 'use-memo-one';

export const CachedImage = ({ uri, style }) => {
  const [localUri, setLocalUri] = React.useState(null);

  const cacheDir = `${FileSystem.cacheDirectory}images/`;

  React.useEffect(() => {
    const cacheImage = async () => {
      const filename = uri.split('/').pop();
      const filepath = `${cacheDir}${filename}`;

      const fileInfo = await FileSystem.getInfoAsync(filepath);
      if (fileInfo.exists) {
        setLocalUri(filepath);
      } else {
        await FileSystem.downloadAsync(uri, filepath);
        setLocalUri(filepath);
      }
    };

    cacheImage();
  }, [uri]);

  return <Image source={{ uri: localUri || uri }} style={style} />;
};
```

#### **B. FlatList Virtualization**
```typescript
// Optimized FlatList
<FlatList
  data={listings}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}

  // Virtualization settings
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}

  // Memory optimization
  removeClippedSubviews={true}
  scrollIndicatorInsets={{ right: 1 }}

  // Performance tracking
  onEndReachedThreshold={0.5}
  onEndReached={loadMore}
/>
```

#### **C. Code Splitting (Hermes)**
```json
// app.json
{
  "expo": {
    "jsEngine": "hermes",
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "enableHermesEngine": true
          },
          "android": {
            "enableHermesEngine": true
          }
        }
      ]
    ]
  }
}
```

#### **D. Memory Management**
```typescript
// utils/memoryOptimization.ts

import { useCallback, useRef } from 'react';

// Memoize expensive computations
export const useMemoList = (items: any[]) => {
  return useMemoOne(() => items, [items]);
};

// Debounce search
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [value]);

  return debouncedValue;
};
```

**Résultats**:
- ✅ 60 FPS smooth scrolling
- ✅ ~50 MB memory footprint
- ✅ Fast startup (<2s)
- ✅ Battery optimized

---

### **Phase 6.7: Testing & Build** (~2.5 heures)

**Objectif**: Tests + iOS/Android builds

#### **A. Unit Tests**
```typescript
// __tests__/auth.test.ts

import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../shared/hooks/useAuth';

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toBeDefined();
  });
});
```

#### **B. EAS Build**
```json
// eas.json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildType": "ipa"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "1234567890",
        "appleId": "dev@example.com",
        "appleTeamId": "ABC123DEF"
      },
      "android": {
        "serviceAccount": "@/path/to/service-account.json"
      }
    }
  }
}
```

#### **C. Deploy to App Stores**
```bash
# iOS
eas build --platform ios --auto-submit

# Android
eas build --platform android --auto-submit
```

**Stack**:
- `jest`: Testing framework
- `@testing-library/react-native`: Testing utilities
- `eas-cli`: Build & deployment
- `expo-dev-client`: Development client

**Résultats**:
- ✅ Test coverage 80%+
- ✅ iOS build ready
- ✅ Android build ready
- ✅ App Store submission ready

---

## 📊 Statistiques Phase 6

```
Code:
├─ Mobile app:    ~3000 lignes (React Native/TypeScript)
├─ Shared code:   ~1500 lignes (réutilisé web + mobile)
├─ Tests:         ~500 lignes
├─ Config:        ~200 lignes
└─ TOTAL:         ~5200 lignes

Commits: 7
├─ 6.1 Setup:     1
├─ 6.2 Shared:    1
├─ 6.3 Features:  2
├─ 6.4 Screens:   2
├─ 6.5 Offline:   1
├─ 6.6 Perf:      1
└─ 6.7 Build:     1

Performance:
├─ Bundle:        5-8 MB (iOS), 3-5 MB (Android)
├─ Startup:       <2s
├─ Memory:        ~50 MB
├─ Frame rate:    60 FPS
└─ Battery:       Optimized

Features:
├─ Firebase notifications:     ✅
├─ Biometric auth:            ✅
├─ Camera/Gallery:            ✅
├─ Location services:         ✅
├─ Offline mode:              ✅
├─ Background sync:           ✅
├─ Real-time messaging:       ✅
└─ Push notifications:        ✅
```

---

## 🎯 Success Criteria

**Phase 6 sera complète quand**:

```
✅ Setup
  □ React Native project initialized
  □ Expo CLI configured
  □ TypeScript working
  □ Navigation structure ready

✅ Shared Code
  □ API client abstracted
  □ Zustand stores shared
  □ Validation schemas shared
  □ Types shared

✅ Native Features
  □ Firebase push working
  □ Camera/gallery functional
  □ Location enabled
  □ Biometric auth working

✅ Core Screens
  □ Auth flow complete
  □ Listings CRUD working
  □ Real-time messages working
  □ Notifications display

✅ Offline & Sync
  □ AsyncStorage persisting
  □ WatermelonDB storing
  □ Background sync scheduling
  □ Conflict resolution

✅ Performance
  □ 60 FPS scrolling
  □ <2s startup
  □ Lighthouse-equivalent metrics

✅ Testing & Build
  □ Test coverage 80%+
  □ iOS build passing
  □ Android build passing
  □ Ready for App Store
```

---

## 🚀 Démarrage Phase 6

**Commandes initiales**:
```bash
# 1. Create React Native project
npx create-expo-app Immo2000Mobile

# 2. Setup TypeScript
npm install -D typescript @types/react-native

# 3. Install dependencies
npm install \
  react-navigation react-native-screens react-native-safe-area-context \
  expo-router \
  zustand axios \
  react-hook-form zod \
  firebase \
  expo-notifications \
  expo-image-picker \
  expo-location \
  expo-local-authentication \
  @react-native-async-storage/async-storage \
  @nozbe/watermelondb \
  expo-background-fetch

# 4. Configure EAS
npx eas-cli build:configure
```

---

## 📚 Prochaines Étapes

1. **6.1 Setup** (3h): Initialiser project React Native
2. **6.2 Shared** (2h): Extraire code commun
3. **6.3 Features** (3h): Intégrer Firebase, camera, location
4. **6.4 Screens** (4h): Implémenter écrans principaux
5. **6.5 Offline** (2.5h): WatermelonDB + background sync
6. **6.6 Perf** (2h): Optimisations de performance
7. **6.7 Build** (2.5h): Testing + iOS/Android builds

---

**Total Phase 6**: ~19 heures (3 jours intensifs)

Prêt? 🚀 Commençons!

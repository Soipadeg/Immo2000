import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import NetInfo from '@react-native-community/netinfo';
import { getApiClient } from '../api/client';
import {
  getPendingRequests,
  removePendingRequest,
  incrementRetryCount,
} from '../db/index';

const BACKGROUND_SYNC_TASK = 'background-sync-pending-requests';
const MAX_RETRY_ATTEMPTS = 3;

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Check network status
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Get pending requests
    const pendingRequests = await getPendingRequests();

    if (pendingRequests.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const api = getApiClient();
    let syncedCount = 0;

    for (const request of pendingRequests) {
      try {
        if (request.retryCount >= MAX_RETRY_ATTEMPTS) {
          // Remove after max retries
          await removePendingRequest(request.id);
          continue;
        }

        // Execute pending request
        const response = await api({
          method: request.method.toLowerCase(),
          url: request.url,
          data: request.data,
        });

        if (response.status === 200 || response.status === 201) {
          await removePendingRequest(request.id);
          syncedCount++;
        } else {
          await incrementRetryCount(request.id);
        }
      } catch (error) {
        await incrementRetryCount(request.id);
      }
    }

    return syncedCount > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background sync error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundSync = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background sync registered');
  } catch (error) {
    console.error('Failed to register background sync:', error);
  }
};

export const unregisterBackgroundSync = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    console.log('Background sync unregistered');
  } catch (error) {
    console.error('Failed to unregister background sync:', error);
  }
};

export const triggerBackgroundSync = async () => {
  try {
    const taskDefined = TaskManager.isTaskDefined(BACKGROUND_SYNC_TASK);
    if (!taskDefined) {
      return;
    }

    await BackgroundFetch.fireTaskAsync(BACKGROUND_SYNC_TASK);
  } catch (error) {
    console.error('Failed to trigger background sync:', error);
  }
};

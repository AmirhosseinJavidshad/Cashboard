// src/services/syncService.js
import { syncAllData } from '../database/db';
import { getAccessToken } from '../api/auth';
import { storage } from '../storage';

const LAST_SYNC_KEY = 'last_sync';

/**
 * Get current token
 */
async function getToken() {
  const token = await getAccessToken();
  return token || null;
}

/**
 * Generic function to store last sync time
 */
function setLastSyncTime() {
  const now = new Date().toISOString();
  storage.set(LAST_SYNC_KEY, now);
  return now;
}

/**
 * Sync local changes with server (push + pull)
 */
export async function syncData() {
  try {
    const token = await getToken();
    if (!token) {
      console.log('Guest mode – skipping sync');
      return;
    }

    // syncAllData handles pushing local -> server, then pulling server -> local
    await syncAllData(token); 

    const now = setLastSyncTime();
    console.log('Sync successful at', now);
  } catch (err) {
    console.error('Sync error:', err);
  }
}

/**
 * Push only (local -> server)
 */
export async function pushLocalData() {
  try {
    const token = await getToken();
    if (!token) {
      console.log('Guest mode – skipping push');
      return;
    }

    await syncAllData(token, { pushOnly: true });

    const now = setLastSyncTime();
    console.log('Push successful at', now);
  } catch (err) {
    console.error('Push error:', err);
  }
}

/**
 * Pull only (server -> local)
 */
export async function pullServerData() {
  try {
    const token = await getToken();
    if (!token) {
      console.log('Guest mode – skipping pull');
      return;
    }

    await syncAllData(token, { pullOnly: true });

    const now = setLastSyncTime();
    console.log('Pull successful at', now);
  } catch (err) {
    console.error('Pull error:', err);
  }
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTime() {
  return storage.getString(LAST_SYNC_KEY) || null;
}

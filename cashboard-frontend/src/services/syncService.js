// syncservice.js
import { syncAllData } from '../db';
import { storage } from '../storage';

const LAST_SYNC_KEY = 'last_sync';

export async function pushLocalData(userId, token) {
  try {
    await syncAllData(userId, token); // handles axios inside db.js
    const now = new Date().toISOString();
    storage.set(LAST_SYNC_KEY, now);
    console.log('Push successful at', now);
  } catch (err) {
    console.error('Push error:', err);
  }
}

export async function pullServerData(userId, token) {
  try {
    await syncAllData(userId, token);
    const now = new Date().toISOString();
    storage.set(LAST_SYNC_KEY, now);
    console.log('Pull successful at', now);
  } catch (err) {
    console.error('Pull error:', err);
  }
}

export function getLastSyncTime() {
  return storage.getString(LAST_SYNC_KEY) || null;
}

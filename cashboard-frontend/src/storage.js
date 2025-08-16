import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'cashboard_storage',
});

export function getClientUUID(key) {
  let uuid = storage.getString(key);
  if (!uuid) {
    uuid = crypto.randomUUID(); // RN 0.79+
    storage.set(key, uuid);
  }
  return uuid;
}

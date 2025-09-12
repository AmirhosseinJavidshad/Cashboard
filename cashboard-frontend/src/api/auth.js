// src/api/auth.js
import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'cashboard_token';
const REFRESH_KEY = 'cashboard_refresh';
const GUEST_ID_KEY = 'cashboard_guest_id';

/** Save tokens to AsyncStorage */
async function saveTokens({ access, refresh }) {
  if (access) await AsyncStorage.setItem(TOKEN_KEY, access);
  if (refresh) await AsyncStorage.setItem(REFRESH_KEY, refresh);
}

/** Remove tokens from AsyncStorage */
async function clearTokens() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_KEY);
}

/** Get stored tokens */
export async function getAccessToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}

/** Guest mode – get or create a guest ID */
export async function getOrCreateGuestId() {
  let guestId = await AsyncStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await AsyncStorage.setItem(GUEST_ID_KEY, guestId);

    try {
      await api.post('/guest/create/', { guest_id: guestId });
    } catch (e) {
      console.warn('Guest creation failed (offline?)', e.message);
    }
  }
  return guestId;
}

/** Register new user */
export async function register(username, password) {
  const response = await api.post('/api/register/', { username, password });
  return response.data;
}

/** Login user */
export async function login(username, password) {
  const response = await api.post('/api/token/', { username, password });
  const data = response.data; // { access, refresh }
  await saveTokens(data);
  return data;
}

/** Refresh access token using stored refresh token */
export async function refreshToken() {
  const refresh = await getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await api.post('/api/token/refresh/', { refresh });
    const { access } = response.data;
    await saveTokens({ access, refresh }); // keep refresh token
    return access;
  } catch (err) {
    await clearTokens();
    throw err;
  }
}

/** Logout user – clear tokens */
export async function logout() {
  await clearTokens();
}

/** Helper for authenticated API calls with auto-refresh */
export async function authRequest(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.response?.status === 401) {
      const newAccess = await refreshToken();
      if (newAccess) return await fn(); // retry
    }
    throw err;
  }
}

// src/api/axios.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshToken, getAccessToken } from './auth';

const TOKEN_KEY = 'cashboard_token';

const api = axios.create({
  baseURL: 'https://api.cashboardapp.ir/',
  timeout: 5000,
});

// Request interceptor to attach access token
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401 and try refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccess = await refreshToken();
        if (newAccess) {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (err) {
        // Refresh failed, let the app handle logout
        console.warn('Token refresh failed:', err.message);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

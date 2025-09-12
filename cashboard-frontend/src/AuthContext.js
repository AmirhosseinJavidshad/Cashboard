// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as auth from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { username, guest: true/false }
  const [guestId, setGuestId] = useState(null); // purely local
  const [token, setToken] = useState(null); // in-memory access token
  const [loading, setLoading] = useState(true);

  // Initialize user on app start
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const storedToken = await auth.getAccessToken();
        if (storedToken) {
          try {
            const newAccess = await auth.refreshToken();
            if (newAccess) {
              setToken(newAccess);
              // Optional: fetch username from server if you have profile endpoint
              setUser({ username: 'LoggedUser', guest: false });
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn('Token refresh failed:', err.message);
          }
        }

        // fallback to guest
        const gId = await auth.getOrCreateGuestId();
        setGuestId(gId);
        setUser({ username: gId, guest: true });
      } catch (err) {
        console.warn('Auth initialization failed:', err.message);
        const gId = await auth.getOrCreateGuestId();
        setGuestId(gId);
        setUser({ username: gId, guest: true });
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await auth.login(username, password);
      setToken(data.access);
      setUser({ username, guest: false });
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username, password) => {
    setLoading(true);
    try {
      await auth.register(username, password);
      return login(username, password); // auto-login after register
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await auth.logout();
      setToken(null);
      // revert to local guest
      const gId = await auth.getOrCreateGuestId();
      setGuestId(gId);
      setUser({ username: gId, guest: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        guestId,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access auth context
export const useAuth = () => useContext(AuthContext);

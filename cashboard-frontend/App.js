import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/db/db';
import api from './src/api/axios'; // your axios.js
import 'react-native-get-random-values';

export default function App() {
  useEffect(() => {
    initDB();

    // Quick backend test
    const checkBackend = async () => {
      try {
        const response = await api.get('/health/');
        console.log('Backend reachable:', response.status); // should print 200
      } catch (err) {
        console.error('Backend unreachable:', err.message);
      }
    };

    checkBackend();
  }, []);

  return <AppNavigator />;
}

// App.js
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/db';  // adjust path if db.js is inside /src/db/

export default function App() {
  useEffect(() => {
    initDB();
  }, []);

  return <AppNavigator />;
}

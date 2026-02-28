import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <PWAInstallPrompt />
    </AppProvider>
  );
}

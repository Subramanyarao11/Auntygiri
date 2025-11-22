/**
 * Main App Component
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store';
import { checkAuthStatus } from './store/slices/authSlice';
import { activityUpdate, idleStatusChanged } from './store/slices/monitoringSlice';
import { addRecommendation } from './store/slices/recommendationsSlice';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './features/auth/components/LoginPage';
import RegisterPage from './features/auth/components/RegisterPage';
import DashboardPage from './features/dashboard/components/DashboardPage';
import MonitoringPage from './features/monitoring/components/MonitoringPage';
import RecommendationsPage from './features/recommendations/components/RecommendationsPage';
import SettingsPage from './features/settings/components/SettingsPage';
import FocusModePage from './features/focus/components/FocusModePage';

// Styles
import './styles/index.css';

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Debug: Check if electron API is available
    console.log('Electron API available:', !!window.electron);
    console.log('Electron auth API:', window.electron?.auth);
    
    // Check authentication status on mount
    dispatch(checkAuthStatus());

    // Setup IPC listeners only if electron API is available
    if (!window.electron) {
      console.error('Electron API not available - preload script may have failed');
      return;
    }

    const unsubscribeActivity = window.electron.monitoring.onActivityUpdate((activity) => {
      dispatch(activityUpdate(activity));
    });

    const unsubscribeIdle = window.electron.monitoring.onIdleStatusChanged((isIdle) => {
      dispatch(idleStatusChanged(isIdle));
    });

    const unsubscribeRecommendation = window.electron.recommendations.onNewRecommendation(
      (recommendation) => {
        dispatch(addRecommendation(recommendation));
      }
    );

    return () => {
      unsubscribeActivity();
      unsubscribeIdle();
      unsubscribeRecommendation();
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/focus" element={<FocusModePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </MainLayout>
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}


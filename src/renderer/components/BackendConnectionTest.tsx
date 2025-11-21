/**
 * Backend Connection Test Component
 * Tests connectivity to the backend API server
 */

import React, { useState, useEffect } from 'react';
import { API_URLS, testApiConnection } from '../config/api';

interface BackendConnectionTestProps {
  className?: string;
}

export const BackendConnectionTest: React.FC<BackendConnectionTestProps> = ({ className = '' }) => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    
    try {
      const isConnected = await testApiConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
      setLastChecked(new Date());
      
      if (!isConnected) {
        setError('Could not reach backend server');
      }
    } catch (err) {
      setConnectionStatus('failed');
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLastChecked(new Date());
    }
  };

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅';
      case 'failed': return '❌';
      case 'testing': return '🔄';
      default: return '❓';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'failed': return 'Connection Failed';
      case 'testing': return 'Testing...';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Backend Connection</h3>
        <button
          onClick={testConnection}
          disabled={connectionStatus === 'testing'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <div className={`text-lg font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            <div className="text-sm text-gray-600">
              Backend API Server
            </div>
          </div>
        </div>

        {lastChecked && (
          <div className="text-xs text-gray-500">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}

        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            Error: {error}
          </div>
        )}
      </div>

      {/* API Configuration */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 className="font-semibold text-blue-800 mb-2">API Configuration</h4>
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">Base URL:</span>{' '}
            <code className="bg-blue-100 px-1 rounded">{API_URLS.BASE}</code>
          </div>
          <div>
            <span className="font-medium">Health Check:</span>{' '}
            <code className="bg-blue-100 px-1 rounded">{API_URLS.HEALTH}</code>
          </div>
          <div>
            <span className="font-medium">Monitor API:</span>{' '}
            <code className="bg-blue-100 px-1 rounded">{API_URLS.MONITOR_BASE}</code>
          </div>
        </div>
      </div>

      {/* Available Endpoints */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-semibold text-green-800 mb-2">Available Endpoints</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="w-16 text-green-600 font-mono">POST</span>
            <code>/activity</code>
          </div>
          <div className="flex items-center">
            <span className="w-16 text-blue-600 font-mono">GET</span>
            <code>/activities</code>
          </div>
          <div className="flex items-center">
            <span className="w-16 text-green-600 font-mono">POST</span>
            <code>/keystrokes</code>
          </div>
          <div className="flex items-center">
            <span className="w-16 text-blue-600 font-mono">GET</span>
            <code>/keystrokes</code>
          </div>
          <div className="flex items-center">
            <span className="w-16 text-green-600 font-mono">POST</span>
            <code>/metrics</code>
          </div>
          <div className="flex items-center">
            <span className="w-16 text-blue-600 font-mono">GET</span>
            <code>/metrics</code>
          </div>
        </div>
      </div>

      {/* Connection Instructions */}
      {connectionStatus === 'failed' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Ensure backend server is running on <code>localhost:3000</code></li>
            <li>• Check if PostgreSQL database is accessible</li>
            <li>• Verify no firewall is blocking the connection</li>
            <li>• Try accessing <a href={API_URLS.HEALTH} target="_blank" rel="noopener noreferrer" className="underline">{API_URLS.HEALTH}</a> in browser</li>
          </ul>
        </div>
      )}

      {/* Success Message */}
      {connectionStatus === 'connected' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">🎉</span>
            <div>
              <div className="font-semibold text-green-800">Backend Connected!</div>
              <div className="text-sm text-green-700">
                Your Electron app is now connected to the backend API. All activity monitoring data will be automatically synced.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendConnectionTest;

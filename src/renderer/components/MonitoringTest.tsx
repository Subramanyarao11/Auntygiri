/**
 * Monitoring Test Component
 * Test component to manually trigger and verify activity monitoring
 */

import React, { useState, useEffect } from 'react';

export const MonitoringTest: React.FC = () => {
  const [monitoringStatus, setMonitoringStatus] = useState<string>('Checking...');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const testWindowTracking = async () => {
    try {
      addLog('🔍 Testing window tracking...');
      
      if (window.electron?.monitoring) {
        // Start window tracking
        await window.electron.monitoring.startTracking();
        addLog('✅ Window tracking started successfully');
        
        // Get current status
        const status = await window.electron.monitoring.getMonitoringStatus();
        addLog(`📊 Monitoring status: ${JSON.stringify(status)}`);
        setMonitoringStatus(`Tracking: ${status.isTracking}, Idle: ${status.isIdle}`);
      } else {
        addLog('❌ Monitoring API not available');
        setMonitoringStatus('API not available');
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMonitoringStatus('Error occurred');
    }
  };

  const stopMonitoring = async () => {
    try {
      addLog('🛑 Stopping monitoring...');
      
      if (window.electron?.monitoring) {
        await window.electron.monitoring.stopTracking();
        addLog('✅ Monitoring stopped');
        setMonitoringStatus('Stopped');
      }
    } catch (error) {
      addLog(`❌ Stop error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Set up event listeners for monitoring events
  useEffect(() => {
    if (!window.electron?.monitoring) return;

    const cleanupFunctions: (() => void)[] = [];

    // Listen for window events
    const cleanupWindow = window.electron.monitoring.onWindowEvent((activity) => {
      addLog(`🪟 Window: ${activity.appName} - ${activity.windowTitle}`);
    });
    cleanupFunctions.push(cleanupWindow);

    // Listen for URL events
    const cleanupUrl = window.electron.monitoring.onUrlEvent((activity) => {
      addLog(`🌐 URL: ${activity.domain} - ${activity.title}`);
    });
    cleanupFunctions.push(cleanupUrl);

    // Listen for idle events
    const cleanupIdle = window.electron.monitoring.onIdleEvent((isIdle) => {
      addLog(`⏰ Idle status: ${isIdle ? 'IDLE' : 'ACTIVE'}`);
    });
    cleanupFunctions.push(cleanupIdle);

    // Listen for productivity updates
    const cleanupProductivity = window.electron.monitoring.onProductivityUpdate((stats) => {
      addLog(`📈 Productivity: ${stats.productivityScore.toFixed(2)}%`);
    });
    cleanupFunctions.push(cleanupProductivity);

    // Listen for system metrics
    const cleanupMetrics = window.electron.monitoring.onSystemMetricsUpdate((metrics) => {
      addLog(`💻 CPU: ${metrics.cpuUsage.toFixed(1)}%, Memory: ${metrics.memoryUsage.toFixed(1)}%`);
    });
    cleanupFunctions.push(cleanupMetrics);

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 Activity Monitoring Test</h3>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Status: <span className="font-mono">{monitoringStatus}</span></div>
        
        <div className="flex gap-3">
          <button
            onClick={testWindowTracking}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Start Monitoring
          </button>
          
          <button
            onClick={stopMonitoring}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop Monitoring
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">📋 Activity Log (Last 10 events)</h4>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-sm">No activity logged yet. Click "Start Monitoring" to begin.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono text-gray-700 bg-white p-2 rounded">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div>💡 This component tests the activity monitoring system</div>
        <div>🔄 Events should appear every 10 seconds when monitoring is active</div>
        <div>📊 Check the main terminal logs for detailed system output</div>
      </div>
    </div>
  );
};

export default MonitoringTest;

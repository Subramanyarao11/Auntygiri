/**
 * API Integration Demo Component
 * Demonstrates integration with the backend API endpoints
 */

import React, { useState, useEffect } from 'react';
import { 
  useLogActivityMutation,
  useGetActivitiesQuery,
  useGetActivitySummaryQuery,
  useLogKeystrokesMutation,
  useLogMetricsMutation,
  useGetMetricsQuery,
  useGetMetricsSummaryQuery
} from '../services/api/activityApi';

interface ApiIntegrationDemoProps {
  className?: string;
}

export const ApiIntegrationDemo: React.FC<ApiIntegrationDemoProps> = ({ className = '' }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  // API mutations
  const [logActivity, { isLoading: isLoggingActivity }] = useLogActivityMutation();
  const [logKeystrokes, { isLoading: isLoggingKeystrokes }] = useLogKeystrokesMutation();
  const [logMetrics, { isLoading: isLoggingMetrics }] = useLogMetricsMutation();

  // API queries
  const { 
    data: activitiesData, 
    isLoading: isLoadingActivities,
    refetch: refetchActivities 
  } = useGetActivitiesQuery({
    startDate: `${startDate}T00:00:00Z`,
    endDate: `${endDate}T23:59:59Z`,
    limit: 10
  });

  const { 
    data: summaryData, 
    isLoading: isLoadingSummary 
  } = useGetActivitySummaryQuery({
    startDate: `${startDate}T00:00:00Z`,
    endDate: `${endDate}T23:59:59Z`
  });

  const { 
    data: metricsData, 
    isLoading: isLoadingMetrics 
  } = useGetMetricsQuery({
    start_date: `${startDate}T00:00:00Z`,
    end_date: `${endDate}T23:59:59Z`,
    limit: 5
  });

  const { 
    data: metricsSummaryData 
  } = useGetMetricsSummaryQuery({
    start_date: `${startDate}T00:00:00Z`,
    end_date: `${endDate}T23:59:59Z`
  });

  // Get current system metrics
  useEffect(() => {
    const getMetrics = async () => {
      if (window.monitoring) {
        try {
          const metrics = await window.monitoring.getCurrentMetrics();
          setSystemMetrics(metrics);
        } catch (error) {
          console.error('Failed to get system metrics:', error);
        }
      }
    };

    getMetrics();
    const interval = setInterval(getMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Test activity logging
  const handleLogTestActivity = async () => {
    try {
      await logActivity({
        window_title: 'API Integration Demo',
        app_name: 'Student Monitor App',
        start_time: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        end_time: new Date().toISOString(),
        activity_type: 'application',
        metadata: {
          test: true,
          demo: 'API Integration'
        }
      }).unwrap();
      
      // Refetch activities to show the new one
      refetchActivities();
      alert('Activity logged successfully!');
    } catch (error) {
      console.error('Failed to log activity:', error);
      alert('Failed to log activity. Check console for details.');
    }
  };

  // Test keystroke logging
  const handleLogTestKeystrokes = async () => {
    try {
      await logKeystrokes({
        key_log: [
          {
            key_code: 65, // 'A'
            key_char: 'A',
            key_type: 'alphanumeric',
            timestamp: new Date(Date.now() - 5000).toISOString(),
            window_title: 'API Integration Demo',
            app_name: 'Student Monitor App',
            is_shortcut: false,
            modifiers: []
          },
          {
            key_code: 66, // 'B'
            key_char: 'B',
            key_type: 'alphanumeric',
            timestamp: new Date(Date.now() - 4000).toISOString(),
            window_title: 'API Integration Demo',
            app_name: 'Student Monitor App',
            is_shortcut: false,
            modifiers: []
          }
        ]
      }).unwrap();
      
      alert('Keystrokes logged successfully!');
    } catch (error) {
      console.error('Failed to log keystrokes:', error);
      alert('Failed to log keystrokes. Check console for details.');
    }
  };

  // Test metrics logging
  const handleLogTestMetrics = async () => {
    if (!systemMetrics) {
      alert('No system metrics available');
      return;
    }

    try {
      await logMetrics({
        cpu: {
          usage: systemMetrics.cpu.usage,
          temperature: systemMetrics.cpu.temperature
        },
        memory: {
          usage: systemMetrics.memory.usage
        },
        disk: {
          usage: systemMetrics.disk.usage,
          read: systemMetrics.disk.read,
          write: systemMetrics.disk.write
        },
        network: {
          in: systemMetrics.network.in,
          out: systemMetrics.network.out
        }
      }).unwrap();
      
      alert('System metrics logged successfully!');
    } catch (error) {
      console.error('Failed to log metrics:', error);
      alert('Failed to log metrics. Check console for details.');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">API Integration Demo</h2>
        <div className="text-sm text-gray-600">
          Backend: /api/v1/monitor/*
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Date Range</h3>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleLogTestActivity}
          disabled={isLoggingActivity}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoggingActivity ? 'Logging...' : 'Log Test Activity'}
        </button>
        
        <button
          onClick={handleLogTestKeystrokes}
          disabled={isLoggingKeystrokes}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isLoggingKeystrokes ? 'Logging...' : 'Log Test Keystrokes'}
        </button>
        
        <button
          onClick={handleLogTestMetrics}
          disabled={isLoggingMetrics || !systemMetrics}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoggingMetrics ? 'Logging...' : 'Log System Metrics'}
        </button>
      </div>

      {/* Current System Metrics */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Current System Metrics</h3>
        {systemMetrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {systemMetrics.cpu.usage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">CPU Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {systemMetrics.memory.usage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Memory Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemMetrics.disk.usage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Disk Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {systemMetrics.cpu.temperature ? `${systemMetrics.cpu.temperature.toFixed(1)}°C` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">CPU Temp</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading system metrics...</div>
        )}
      </div>

      {/* Activities Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">Recent Activities</h3>
          {isLoadingActivities ? (
            <div className="text-blue-600">Loading activities...</div>
          ) : activitiesData?.data ? (
            <div className="space-y-2">
              <div className="text-sm text-blue-600 mb-2">
                Total: {activitiesData.data.total} activities
              </div>
              {activitiesData.data.activities && activitiesData.data.activities.length > 0 ? activitiesData.data.activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="bg-white p-2 rounded text-sm">
                  <div className="font-medium">{activity.app_name}</div>
                  <div className="text-gray-600 truncate">{activity.window_title}</div>
                  <div className="text-xs text-gray-500">
                    {activity.duration}s • {activity.activity_type}
                  </div>
                </div>
              )) : (
                <div className="text-gray-500 text-sm">No activities available</div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No activities found</div>
          )}
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-3">Activity Summary</h3>
          {isLoadingSummary ? (
            <div className="text-green-600">Loading summary...</div>
          ) : summaryData?.data ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(summaryData.data.total_time / 60)} min
                </div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Top Apps:</div>
                {summaryData.data.by_app && summaryData.data.by_app.length > 0 ? summaryData.data.by_app.slice(0, 3).map((app, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate">{app.app_name}</span>
                    <span className="text-gray-600">{Math.floor(app.total_duration / 60)}m</span>
                  </div>
                )) : (
                  <div className="text-gray-500 text-sm">No app data available</div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">By Type:</div>
                {summaryData.data.by_type && summaryData.data.by_type.length > 0 ? summaryData.data.by_type.map((type, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="capitalize">{type.activity_type}</span>
                    <span className="text-gray-600">{Math.floor(type.total_duration / 60)}m</span>
                  </div>
                )) : (
                  <div className="text-gray-500 text-sm">No type data available</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No summary data</div>
          )}
        </div>
      </div>

      {/* Metrics Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-3">Recent Metrics</h3>
          {isLoadingMetrics ? (
            <div className="text-purple-600">Loading metrics...</div>
          ) : metricsData?.data ? (
            <div className="space-y-2">
              <div className="text-sm text-purple-600 mb-2">
                Total: {metricsData.data.total} metric records
              </div>
              {metricsData.data.metrics && metricsData.data.metrics.length > 0 ? metricsData.data.metrics.slice(0, 3).map((metric) => (
                <div key={metric.id} className="bg-white p-2 rounded text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="font-medium">CPU</div>
                      <div className="text-purple-600">{metric.cpu_usage.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="font-medium">Memory</div>
                      <div className="text-blue-600">{metric.memory_usage.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="font-medium">Disk</div>
                      <div className="text-green-600">{metric.disk_usage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(metric.created_at).toLocaleString()}
                  </div>
                </div>
              )) : (
                <div className="text-gray-500 text-sm">No metrics available</div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No metrics found</div>
          )}
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-3">Metrics Summary</h3>
          {metricsSummaryData?.data ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">
                  {metricsSummaryData.data.avg_cpu_usage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Avg CPU</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {metricsSummaryData.data.avg_memory_usage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Avg Memory</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {metricsSummaryData.data.avg_disk_usage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Avg Disk</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">
                  {metricsSummaryData.data.avg_cpu_temp ? 
                    `${metricsSummaryData.data.avg_cpu_temp.toFixed(1)}°C` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Avg Temp</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No summary data</div>
          )}
        </div>
      </div>

      {/* API Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-2">API Integration Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Activity Logging
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Activity Retrieval
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Metrics Logging
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Keystroke Logging
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiIntegrationDemo;

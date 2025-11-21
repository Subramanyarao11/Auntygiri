/**
 * Simple Activity Monitor Component
 * Basic version to test Redux integration without complex hooks
 */

import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { selectIsLoading, selectError, selectTrackingStatus } from '../features/activity/activitySlice';

interface SimpleActivityMonitorProps {
  className?: string;
}

export const SimpleActivityMonitor: React.FC<SimpleActivityMonitorProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const trackingStatus = useAppSelector(selectTrackingStatus);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Simple Activity Monitor</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${trackingStatus.window ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            Redux Connected
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Redux State Display */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Redux State</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded">
            <div className="text-sm font-medium text-gray-600">Loading</div>
            <div className={`text-lg font-bold ${isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
              {isLoading ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="text-sm font-medium text-gray-600">Window Tracking</div>
            <div className={`text-lg font-bold ${trackingStatus.window ? 'text-green-600' : 'text-gray-600'}`}>
              {trackingStatus.window ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="text-sm font-medium text-gray-600">Browser Tracking</div>
            <div className={`text-lg font-bold ${trackingStatus.browser ? 'text-green-600' : 'text-gray-600'}`}>
              {trackingStatus.browser ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-center">
          <div className="text-green-500 mr-2">✅</div>
          <div>
            <div className="font-semibold text-green-800">Redux Integration Working!</div>
            <div className="text-sm text-green-700">
              The Redux store is properly connected and the Provider is working.
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="font-semibold mb-2">Next Steps:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Redux Provider is now properly configured</li>
            <li>Activity slice is connected to the store</li>
            <li>You can now use the full ActivityMonitor component</li>
            <li>All Redux hooks should work without errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleActivityMonitor;

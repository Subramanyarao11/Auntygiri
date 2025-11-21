/**
 * Activity Monitor Component
 * Demonstrates the real-time activity monitoring system
 */

import React, { useState } from 'react';
import { useActivityStream, useFocusSession, useProductivityTracker } from '../features/activity/useActivityStream';
import { ActivityState } from '../../shared/types/activity';

interface ActivityMonitorProps {
  className?: string;
}

export const ActivityMonitor: React.FC<ActivityMonitorProps> = ({ className = '' }) => {
  const {
    stream,
    currentWindow,
    currentBrowser,
    currentState,
    isTracking,
    trackingStatus,
    isLoading,
    error,
    startAllTracking,
    stopAllTracking
  } = useActivityStream({ autoStart: true });

  const {
    session: focusSession,
    isActive: isFocusActive,
    duration: focusDuration,
    start: startFocus,
    end: endFocus,
    pause: pauseFocus,
    resume: resumeFocus
  } = useFocusSession();

  const {
    stats: productivityStats,
    productivityPercentage,
    isProductive
  } = useProductivityTracker();

  const [focusTarget, setFocusTarget] = useState(25 * 60); // 25 minutes default

  // Format time helper
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format productivity score color
  const getProductivityColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Handle focus session start
  const handleStartFocus = async () => {
    try {
      await startFocus(focusTarget, 'pomodoro');
    } catch (error) {
      console.error('Failed to start focus session:', error);
    }
  };

  // Handle focus session end
  const handleEndFocus = async () => {
    try {
      await endFocus('completed');
    } catch (error) {
      console.error('Failed to end focus session:', error);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Activity Monitor</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={startAllTracking}
          disabled={isLoading || isTracking}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Start Tracking
        </button>
        <button
          onClick={stopAllTracking}
          disabled={isLoading || !isTracking}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Stop Tracking
        </button>
      </div>

      {/* Tracking Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Window Tracking</h3>
          <div className={`text-sm ${trackingStatus.window ? 'text-green-600' : 'text-gray-500'}`}>
            {trackingStatus.window ? '✓ Active' : '○ Inactive'}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Browser Tracking</h3>
          <div className={`text-sm ${trackingStatus.browser ? 'text-green-600' : 'text-gray-500'}`}>
            {trackingStatus.browser ? '✓ Active' : '○ Inactive'}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Idle Monitor</h3>
          <div className={`text-sm ${trackingStatus.idle ? 'text-green-600' : 'text-gray-500'}`}>
            {trackingStatus.idle ? '✓ Active' : '○ Inactive'}
          </div>
        </div>
      </div>

      {/* Current Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Current Window */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">Current Window</h3>
          {currentWindow ? (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">App:</span> {currentWindow.appName}
              </div>
              <div className="text-sm">
                <span className="font-medium">Title:</span> {currentWindow.windowTitle}
              </div>
              <div className="text-sm">
                <span className="font-medium">Process:</span> {currentWindow.processName}
              </div>
              <div className="text-sm">
                <span className="font-medium">Platform:</span> {currentWindow.platform}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No active window detected</div>
          )}
        </div>

        {/* Current Browser */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-3">Current Browser</h3>
          {currentBrowser ? (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Browser:</span> {currentBrowser.browserName}
              </div>
              <div className="text-sm">
                <span className="font-medium">Domain:</span> {currentBrowser.domain}
              </div>
              <div className="text-sm">
                <span className="font-medium">Title:</span> 
                <span className="ml-1 truncate block">{currentBrowser.title}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">URL:</span>
                <span className="ml-1 truncate block text-blue-600">{currentBrowser.url}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No browser activity detected</div>
          )}
        </div>
      </div>

      {/* Activity State */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Activity State</h3>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentState === ActivityState.ACTIVE ? 'bg-green-100 text-green-800' :
            currentState === ActivityState.IDLE ? 'bg-yellow-100 text-yellow-800' :
            currentState === ActivityState.FOCUS_ACTIVE ? 'bg-blue-100 text-blue-800' :
            currentState === ActivityState.FOCUS_PAUSED ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {currentState.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-sm text-gray-600">
            Last update: {new Date(stream.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Productivity Stats */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Productivity Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatTime(productivityStats.productiveTime)}
            </div>
            <div className="text-sm text-gray-600">Productive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {formatTime(productivityStats.neutralTime)}
            </div>
            <div className="text-sm text-gray-600">Neutral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatTime(productivityStats.unproductiveTime)}
            </div>
            <div className="text-sm text-gray-600">Unproductive</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getProductivityColor(productivityStats.score)}`}>
              {productivityStats.score}%
            </div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isProductive ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${productivityPercentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {productivityPercentage}% productive today
          </div>
        </div>
      </div>

      {/* Focus Session */}
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="font-semibold text-indigo-800 mb-3">Focus Session</h3>
        
        {focusSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">
                Session: {focusSession.id.split('_')[1]}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isFocusActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {focusSession.status.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-indigo-600">
                  {formatTime(focusDuration)}
                </div>
                <div className="text-sm text-gray-600">Current</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-700">
                  {formatTime(focusSession.targetDuration)}
                </div>
                <div className="text-sm text-gray-600">Target</div>
              </div>
              <div>
                <div className="text-xl font-bold text-yellow-600">
                  {focusSession.productivityScore}%
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 bg-indigo-500 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((focusDuration / focusSession.targetDuration) * 100, 100)}%` 
                }}
              ></div>
            </div>

            <div className="flex space-x-2">
              {isFocusActive ? (
                <>
                  <button
                    onClick={pauseFocus}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Pause
                  </button>
                  <button
                    onClick={handleEndFocus}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    End Session
                  </button>
                </>
              ) : (
                <button
                  onClick={resumeFocus}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-600">No active focus session</div>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={Math.floor(focusTarget / 60)}
                onChange={(e) => setFocusTarget(parseInt(e.target.value) * 60)}
                className="w-20 px-3 py-2 border border-gray-300 rounded"
                min="1"
                max="120"
              />
              <span className="text-sm text-gray-600">minutes</span>
              <button
                onClick={handleStartFocus}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Start Focus Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityMonitor;

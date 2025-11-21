/**
 * Quick API Test Component
 * Simple component to test backend API connectivity
 */

import React, { useState } from 'react';
import { API_URLS } from '../config/api';

export const QuickApiTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testHealthEndpoint = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      const response = await fetch(API_URLS.HEALTH);
      const data = await response.text();
      
      if (response.ok) {
        setTestResult(`✅ Success: ${data}`);
      } else {
        setTestResult(`❌ Error: ${response.status} - ${data}`);
      }
    } catch (error) {
      setTestResult(`❌ Connection Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testActivityEndpoint = async () => {
    setIsLoading(true);
    setTestResult('Testing activity endpoint...');
    
    try {
      const testActivity = {
        app_name: 'Test App',
        window_title: 'Test Window',
        activity_type: 'window_change',
        duration: 5,
        metadata: { test: true }
      };

      const response = await fetch(API_URLS.ACTIVITY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testActivity)
      });

      const data = await response.json();
      
      if (response.ok) {
        setTestResult(`✅ Activity logged successfully: ID ${data.data?.id || 'unknown'}`);
      } else {
        setTestResult(`❌ Activity logging failed: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setTestResult(`❌ Activity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🚀 Quick API Test</h3>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={testHealthEndpoint}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Health
          </button>
          
          <button
            onClick={testActivityEndpoint}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Activity API
          </button>
        </div>

        {testResult && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-mono whitespace-pre-wrap">
              {testResult}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <div>Health URL: <code>{API_URLS.HEALTH}</code></div>
          <div>Activity URL: <code>{API_URLS.ACTIVITY}</code></div>
        </div>
      </div>
    </div>
  );
};

export default QuickApiTest;

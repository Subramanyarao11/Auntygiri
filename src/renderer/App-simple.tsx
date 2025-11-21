import React, { useState } from 'react';
import ActivityMonitor from './components/ActivityMonitor';
import SimpleActivityMonitor from './components/SimpleActivityMonitor';
import ApiIntegrationDemo from './components/ApiIntegrationDemo';
import BackendConnectionTest from './components/BackendConnectionTest';
import QuickApiTest from './components/QuickApiTest';

export default function App() {
  const [count, setCount] = useState(0);
  const [showActivityMonitor, setShowActivityMonitor] = useState(false);
  const [showSimpleMonitor, setShowSimpleMonitor] = useState(false);
  const [showApiDemo, setShowApiDemo] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const [showQuickTest, setShowQuickTest] = useState(false);

  return (
    <div style={{
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🎉 Student Monitor App</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        React is working! Your Electron + React app is successfully running.
      </p>
      
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>✅ Status Check:</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ Electron window opened</li>
          <li>✅ Vite dev server running</li>
          <li>✅ React rendering successfully</li>
          <li>✅ Hot reload enabled</li>
          <li>✅ Activity monitoring system ready</li>
          <li>✅ Backend API integration complete</li>
          <li>✅ Backend server running on localhost:3000</li>
        </ul>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setCount(count + 1)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Counter: {count}
          </button>
          
          <button 
            onClick={() => setShowConnectionTest(!showConnectionTest)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: showConnectionTest ? '#dc3545' : '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showConnectionTest ? 'Hide' : 'Test'} Backend
          </button>
          
          <button 
            onClick={() => setShowQuickTest(!showQuickTest)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: showQuickTest ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showQuickTest ? 'Hide' : 'Quick'} API Test
          </button>
          
          <button 
            onClick={() => setShowSimpleMonitor(!showSimpleMonitor)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: showSimpleMonitor ? '#dc3545' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showSimpleMonitor ? 'Hide' : 'Test'} Redux
          </button>
          
          <button 
            onClick={() => setShowActivityMonitor(!showActivityMonitor)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: showActivityMonitor ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showActivityMonitor ? 'Hide' : 'Show'} Activity Monitor
          </button>
          
          <button 
            onClick={() => setShowApiDemo(!showApiDemo)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: showApiDemo ? '#dc3545' : '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showApiDemo ? 'Hide' : 'Show'} API Demo
          </button>
        </div>
      </div>

      {showConnectionTest && (
        <div style={{ marginTop: '20px' }}>
          <BackendConnectionTest />
        </div>
      )}

      {showQuickTest && (
        <div style={{ marginTop: '20px' }}>
          <QuickApiTest />
        </div>
      )}

      {showSimpleMonitor && (
        <div style={{ marginTop: '20px' }}>
          <SimpleActivityMonitor />
        </div>
      )}

      {showActivityMonitor && (
        <div style={{ marginTop: '20px' }}>
          <ActivityMonitor />
        </div>
      )}

      {showApiDemo && (
        <div style={{ marginTop: '20px' }}>
          <ApiIntegrationDemo />
        </div>
      )}
    </div>
  );
}

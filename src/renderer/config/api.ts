/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// API Base URL - hardcoded for Electron app
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINTS: {
    MONITOR: '/api/v1/monitor',
    HEALTH: '/health'
  },
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3
};

// Full API URLs
export const API_URLS = {
  BASE: API_CONFIG.BASE_URL,
  MONITOR_BASE: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}`,
  HEALTH: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`,
  
  // Activity endpoints
  ACTIVITY: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/activity`,
  ACTIVITIES: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/activities`,
  ACTIVITY_SUMMARY: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/activities/summary`,
  
  // Keystroke endpoints
  KEYSTROKES: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/keystrokes`,
  
  // Metrics endpoints
  METRICS: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/metrics`,
  METRICS_SUMMARY: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/metrics/summary`,
};

// Test API connectivity
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(API_URLS.HEALTH, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

export default API_CONFIG;

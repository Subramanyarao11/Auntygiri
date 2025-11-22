/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// API Base URL - hardcoded for Electron app
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINTS: {
    AUTH: '/api/v1/auth',
    MONITOR: '/api/v1/monitor',
    DASHBOARD: '/api/v1/dashboard',
    HEALTH: '/health'
  },
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3
};

// Full API URLs
export const API_URLS = {
  BASE: API_CONFIG.BASE_URL,
  AUTH_BASE: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}`,
  MONITOR_BASE: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}`,
  DASHBOARD_BASE: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DASHBOARD}`,
  HEALTH: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`,
  
  // Auth endpoints
  AUTH_LOGIN: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}/login`,
  AUTH_REGISTER_PARENT_STUDENT: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}/register-parent-student`,
  AUTH_REFRESH_TOKEN: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}/refresh-token`,
  AUTH_LOGOUT: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}/logout`,
  
  // Activity endpoints
  ACTIVITY: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/activity`,
  ACTIVITIES: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/activities`,
  ACTIVITY_SUMMARY: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/activities/summary`,
  
  // Screenshot endpoints
  SCREENSHOT: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/screenshot`,
  
  // Keystroke endpoints
  KEYSTROKES: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/keystrokes`,
  
  // Metrics endpoints
  METRICS: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/metrics`,
  METRICS_SUMMARY: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MONITOR}/metrics/summary`,
  
  // Dashboard endpoints
  DASHBOARD_SUMMARY: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DASHBOARD}/summary`,
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

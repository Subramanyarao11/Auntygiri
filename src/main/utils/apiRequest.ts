/**
 * API Request Utility
 * Helper for making authenticated API requests from main process
 */

import log from 'electron-log';
import * as authService from '../services/authService';

const API_BASE_URL = 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Make an authenticated API request
 * Automatically includes Bearer token and handles 401 errors with token refresh
 */
export async function makeAuthenticatedRequest(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  try {
    // Get access token
    let accessToken = await authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available. Please login.');
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    };

    // Make request
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - token expired
    if (response.status === 401) {
      log.info('Access token expired, attempting refresh...');

      try {
        // Try to refresh the token
        const newTokens = await authService.refreshAccessToken();
        accessToken = newTokens.accessToken;

        // Retry the request with new token
        headers.Authorization = `Bearer ${accessToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        log.info('Request retried successfully with new token');
      } catch (refreshError) {
        log.error('Token refresh failed:', refreshError);
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error: any) {
    log.error('API request error:', error);
    throw error;
  }
}

/**
 * Helper for making POST requests with JSON body
 */
export async function postJSON(endpoint: string, data: unknown): Promise<Response> {
  return makeAuthenticatedRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Helper for making GET requests
 */
export async function get(endpoint: string): Promise<Response> {
  return makeAuthenticatedRequest(endpoint, {
    method: 'GET',
  });
}

/**
 * Helper for uploading files (e.g., screenshots)
 */
export async function uploadFile(
  endpoint: string,
  formData: FormData
): Promise<Response> {
  try {
    let accessToken = await authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available. Please login.');
    }

    // Make request (don't set Content-Type for FormData, let browser set it with boundary)
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    // Handle 401 - token expired
    if (response.status === 401) {
      log.info('Access token expired, attempting refresh...');

      try {
        const newTokens = await authService.refreshAccessToken();
        accessToken = newTokens.accessToken;

        // Retry the request
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        log.info('File upload retried successfully with new token');
      } catch (refreshError) {
        log.error('Token refresh failed:', refreshError);
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error: any) {
    log.error('File upload error:', error);
    throw error;
  }
}

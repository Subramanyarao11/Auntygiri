/**
 * Authentication Service
 * Handles API communication and secure token storage
 */

import log from 'electron-log';
import Store from 'electron-store';
import * as keytar from 'keytar';
import type {
  LoginCredentials,
  RegisterParentStudentData,
  AuthResponse,
  User,
} from '../../shared/types';

const SERVICE_NAME = 'StudentMonitorApp';
const API_BASE_URL = 'http://localhost:3000';
const USER_KEY = 'user_data';
const PARENT_KEY = 'parent_data';
const STUDENT_KEY = 'student_data';

/**
 * Store tokens securely in system keychain
 */
export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE_NAME, 'accessToken', accessToken);
    await keytar.setPassword(SERVICE_NAME, 'refreshToken', refreshToken);
    log.info('Tokens stored securely');
  } catch (error) {
    log.error('Failed to store tokens:', error);
    throw new Error('Failed to store authentication tokens securely');
  }
}

/**
 * Retrieve access token from keychain
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await keytar.getPassword(SERVICE_NAME, 'accessToken');
  } catch (error) {
    log.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Retrieve refresh token from keychain
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await keytar.getPassword(SERVICE_NAME, 'refreshToken');
  } catch (error) {
    log.error('Failed to get refresh token:', error);
    return null;
  }
}

/**
 * Clear all tokens from keychain
 */
export async function clearTokens(): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE_NAME, 'accessToken');
    await keytar.deletePassword(SERVICE_NAME, 'refreshToken');
    log.info('Tokens cleared from keychain');
  } catch (error) {
    log.error('Failed to clear tokens:', error);
  }
}

/**
 * Login user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    log.info('Attempting login for:', credentials.email);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store tokens securely
    await storeTokens(data.data.accessToken, data.data.refreshToken);

    // Return formatted response
    const authResponse: AuthResponse = {
      user: data.data.user,
      tokens: {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresIn: data.data.expiresIn,
      },
    };

    log.info('Login successful for:', credentials.email);
    return authResponse;
  } catch (error: any) {
    log.error('Login error:', error);
    throw new Error(error.message || 'Login failed. Please check your credentials.');
  }
}

/**
 * Register parent and student accounts
 */
export async function registerParentStudent(
  data: RegisterParentStudentData
): Promise<AuthResponse> {
  try {
    log.info('Attempting parent-student registration');

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register-parent-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = (await response.json()) as any;

    if (!response.ok) {
      throw new Error(responseData.message || 'Registration failed');
    }

    // Store tokens securely
    await storeTokens(responseData.data.accessToken, responseData.data.refreshToken);

    // Return formatted response
    const authResponse: AuthResponse = {
      user: responseData.data.primaryUser,
      tokens: {
        accessToken: responseData.data.accessToken,
        refreshToken: responseData.data.refreshToken,
        expiresIn: responseData.data.expiresIn,
      },
      parent: responseData.data.parent,
      student: responseData.data.student,
      primaryUser: responseData.data.primaryUser,
    };

    log.info('Registration successful');
    return authResponse;
  } catch (error: any) {
    log.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    // Store new tokens
    await storeTokens(data.data.accessToken, data.data.refreshToken);

    log.info('Token refresh successful');
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  } catch (error: any) {
    log.error('Token refresh error:', error);
    throw new Error(error.message || 'Session expired. Please login again.');
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const accessToken = await getAccessToken();

    if (accessToken) {
      // Call logout endpoint
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    // Clear tokens regardless of API call result
    await clearTokens();
    log.info('Logout successful');
  } catch (error) {
    log.error('Logout error:', error);
    // Still clear tokens even if API call fails
    await clearTokens();
  }
}

/**
 * Store user data in electron-store
 */
export function storeUserData(store: Store, user: User): void {
  store.set(USER_KEY, user);
}

/**
 * Store parent and student data
 */
export function storeParentStudentData(store: Store, parent: User, student: User): void {
  store.set(PARENT_KEY, parent);
  store.set(STUDENT_KEY, student);
  store.set(USER_KEY, parent); // Primary user is parent
}

/**
 * Get stored user data
 */
export function getUserData(store: Store): User | null {
  return store.get(USER_KEY) as User | null;
}

/**
 * Clear user data
 */
export function clearUserData(store: Store): void {
  store.delete(USER_KEY);
  store.delete(PARENT_KEY);
  store.delete(STUDENT_KEY);
}

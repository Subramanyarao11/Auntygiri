/**
 * Auth Slice
 * Manages authentication state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginCredentials, AuthResponse, RegisterParentStudentData } from '@shared/types';

interface AuthState {
  user: User | null;
  parent: User | null;
  student: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  parent: null,
  student: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  'auth/login',
  async (credentials) => {
    const response = await window.electron.auth.login(credentials);
    return response;
  }
);

export const registerParentStudent = createAsyncThunk<AuthResponse, RegisterParentStudentData>(
  'auth/registerParentStudent',
  async (data) => {
    const response = await window.electron.auth.registerParentStudent(data);
    return response;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await window.electron.auth.logout();
});

export const checkAuthStatus = createAsyncThunk('auth/checkStatus', async () => {
  const isAuthenticated = await window.electron.auth.checkAuthStatus();
  if (isAuthenticated) {
    const token = await window.electron.auth.getStoredToken();
    return { token };
  }
  throw new Error('Not authenticated');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Login failed';
    });

    // Registration
    builder.addCase(registerParentStudent.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerParentStudent.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.parent = action.payload.parent || null;
      state.student = action.payload.student || null;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
    });
    builder.addCase(registerParentStudent.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Registration failed';
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.parent = null;
      state.student = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    });

    // Check auth status
    builder.addCase(checkAuthStatus.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.token;
    });
    builder.addCase(checkAuthStatus.rejected, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.parent = null;
      state.student = null;
      state.accessToken = null;
      state.refreshToken = null;
    });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;


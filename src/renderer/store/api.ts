/**
 * RTK Query API Configuration
 * Defines API endpoints using RTK Query
 */

import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

// Using fakeBaseQuery since we're using IPC instead of HTTP
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Productivity', 'Screenshots', 'BadWebsites'],
  endpoints: (builder) => ({
    // Productivity endpoints
    getProductivityStats: builder.query({
      queryFn: async ({ startDate, endDate }) => {
        try {
          const data = await window.electron.productivity.getStats(startDate, endDate);
          return { data };
        } catch (error) {
          return { error: { status: 500, data: error } };
        }
      },
      providesTags: ['Productivity'],
    }),

    // Screenshots endpoints
    getScreenshots: builder.query({
      queryFn: async ({ startDate, endDate }) => {
        try {
          const data = await window.electron.screenshot.getAll(startDate, endDate);
          return { data };
        } catch (error) {
          return { error: { status: 500, data: error } };
        }
      },
      providesTags: ['Screenshots'],
    }),

    captureScreenshot: builder.mutation({
      queryFn: async () => {
        try {
          const data = await window.electron.screenshot.capture();
          return { data };
        } catch (error) {
          return { error: { status: 500, data: error } };
        }
      },
      invalidatesTags: ['Screenshots'],
    }),

    // Bad websites endpoints
    getBadWebsites: builder.query({
      queryFn: async () => {
        try {
          const data = await window.electron.badWebsite.getList();
          return { data };
        } catch (error) {
          return { error: { status: 500, data: error } };
        }
      },
      providesTags: ['BadWebsites'],
    }),
  }),
});

export const {
  useGetProductivityStatsQuery,
  useGetScreenshotsQuery,
  useCaptureScreenshotMutation,
  useGetBadWebsitesQuery,
} = api;


import { WorkoutSession } from './types';

// Use a relative URL so it hits the Vite dev server, which will proxy it to the backend.
// This allows the app to work on other devices (like your phone) on the same network.
const API_BASE_URL = '/api';

export const api = {
  /**
   * Fetches the merged workout history data from the FastAPI backend.
   */
  fetchWorkoutHistory: async (): Promise<WorkoutSession[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch workout history');
      }
      const data = await response.json();
      return data as WorkoutSession[];
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Triggers a Strava data sync in the backend.
   */
  syncStravaData: async (): Promise<{ status: string; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/strava/sync`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to trigger Strava sync');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

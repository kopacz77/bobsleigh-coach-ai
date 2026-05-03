import axios from "axios";

import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Supabase access token as Bearer header
api.interceptors.request.use(
  async (config) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid -- redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  me: () => api.get("/api/auth/me"),
};

export const athleteAPI = {
  getProfile: (athleteId: number) => api.get(`/api/athletes/${athleteId}`),
  updateProfile: (athleteId: number, data: any) => api.put(`/api/athletes/${athleteId}`, data),
};

export const trainingAPI = {
  getWorkouts: (athleteId: number, limit = 10) =>
    api.get(`/api/training/workouts?athlete_id=${athleteId}&limit=${limit}`),
  getWorkout: (workoutId: number) => api.get(`/api/training/workouts/${workoutId}`),
  createWorkout: (data: any) => api.post("/api/training/workouts", data),
  getRecommendations: (athleteId: number) =>
    api.get(`/api/training/recommendations?athlete_id=${athleteId}`),
};

export const performanceAPI = {
  getMetrics: (athleteId: number) => api.get(`/api/performance/metrics/${athleteId}`),
  getTrends: (athleteId: number, metric: string, days = 90) =>
    api.get(`/api/performance/trends/${athleteId}?metric=${metric}&days=${days}`),
  getTrainingLoad: (athleteId: number, days = 90) =>
    api.get(`/api/performance/load/${athleteId}?days=${days}`),
  getComparison: (athleteId: number) => api.get(`/api/performance/comparison/${athleteId}`),
};

export default api;

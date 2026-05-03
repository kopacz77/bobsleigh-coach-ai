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
  getWorkouts: (athleteId: string, limit = 10) =>
    api.get(`/api/training/workouts?athlete_id=${athleteId}&limit=${limit}`),
  getWorkout: (workoutId: string) => api.get(`/api/training/workouts/${workoutId}`),
  createWorkout: (data: Record<string, unknown>) => api.post("/api/training/workouts", data),
  updateWorkout: (workoutId: string, data: Record<string, unknown>) =>
    api.patch(`/api/training/workouts/${workoutId}`, data),
  getRecommendations: (athleteId: string) =>
    api.get(`/api/training/recommendations?athlete_id=${athleteId}`),
};

export const exerciseAPI = {
  search: (params: {
    search?: string;
    category?: string;
    muscle_group?: string;
    equipment?: string;
    measurement_type?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return api.get(`/api/exercises?${queryString}`);
  },
  getCategories: () => api.get("/api/exercises/categories"),
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

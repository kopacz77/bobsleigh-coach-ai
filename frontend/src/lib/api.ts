import axios from "axios";

import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE || "dev";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach auth token as Bearer header
api.interceptors.request.use(
  async (config) => {
    if (AUTH_MODE === "dev") {
      // In dev mode the backend DevAuthProvider ignores the token value
      config.headers.Authorization = "Bearer dev-token";
    } else {
      // In supabase mode, attach the real access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: redirect to login on 401 (supabase mode only)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && AUTH_MODE !== "dev") {
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
  getWorkouts: (params: Record<string, string | number | undefined> = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`/api/training/workouts?${queryString}`);
  },
  getWorkout: (workoutId: string) => api.get(`/api/training/workouts/${workoutId}`),
  createWorkout: (data: Record<string, unknown>) => api.post("/api/training/workouts", data),
  updateWorkout: (workoutId: string, data: Record<string, unknown>) =>
    api.patch(`/api/training/workouts/${workoutId}`, data),
  getRecommendations: (athleteId: string) =>
    api.get(`/api/training/recommendations?athlete_id=${athleteId}`),
  getAthleteWorkoutsForCoach: (
    athleteId: string,
    params?: { limit?: number; date_from?: string; date_to?: string }
  ) => {
    const queryString = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return api.get(
      `/api/training/coach/athletes/${athleteId}/workouts${queryString ? `?${queryString}` : ""}`
    );
  },
  getAthletesWorkoutStatus: (days = 7) =>
    api.get(`/api/training/coach/athletes/workout-status?days=${days}`),
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
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`/api/exercises?${queryString}`);
  },
  getCategories: () => api.get("/api/exercises/categories"),
};

export const wellbeingAPI = {
  submitCheckIn: (data: {
    sleep_quality: number;
    stress_level: number;
    nutrition_quality: number;
    physical_readiness: number;
    mental_clarity: number;
    notes?: string;
    flag_concern?: boolean;
  }) => api.post("/api/wellbeing/checkin", data),
  getCheckInToday: () => api.get("/api/wellbeing/checkin/today"),
  getHistory: (days = 30) => api.get(`/api/wellbeing/history?days=${days}`),
  getCoachReadiness: () => api.get("/api/wellbeing/coach/readiness"),
};

export const performanceAPI = {
  getMetrics: (athleteId: string) => api.get(`/api/performance/metrics/${athleteId}`),
  getTrends: (athleteId: string, metric: string, days = 90) =>
    api.get(`/api/performance/trends/${athleteId}?metric=${metric}&days=${days}`),
  getTrainingLoad: (athleteId: string, days = 90) =>
    api.get(`/api/performance/load/${athleteId}?days=${days}`),
  getComparison: (athleteId: string) => api.get(`/api/performance/comparison/${athleteId}`),
};

export const coachAPI = {
  getRoster: () => api.get("/api/coach/roster"),
  getPMCSummary: () => api.get("/api/coach/athletes/pmc-summary"),
  getAlerts: () => api.get("/api/coach/alerts"),
  addAthlete: (athleteId: string, relationshipType = "primary") =>
    api.post(`/api/coach/athletes/${athleteId}?relationship_type=${relationshipType}`),
  removeAthlete: (athleteId: string) => api.delete(`/api/coach/athletes/${athleteId}`),
};

export const plansAPI = {
  getPending: () => api.get("/api/plans/pending"),
  getPlan: (planId: string) => api.get(`/api/plans/${planId}`),
  getCurrent: () => api.get("/api/plans/current"),
  getToday: () => api.get("/api/plans/today"),
  generate: (athleteId: string, weekStart: string) =>
    api.post("/api/plans/generate", { athlete_id: athleteId, week_start: weekStart }),
  generateBatch: (weekStart: string) =>
    api.post("/api/plans/generate-batch", { week_start: weekStart }),
  approve: (planId: string) => api.post(`/api/plans/${planId}/approve`),
  reject: (planId: string, rejectionNotes: string) =>
    api.post(`/api/plans/${planId}/reject`, { rejection_notes: rejectionNotes }),
};

export default api;

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    // Get token from localStorage or elsewhere
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
    api.post('/api/auth/token', credentials),
  googleLogin: () => 
    api.post('/api/auth/google'),
};

export const athleteAPI = {
  getProfile: (athleteId: number) => 
    api.get(`/api/athletes/${athleteId}`),
  updateProfile: (athleteId: number, data: any) => 
    api.put(`/api/athletes/${athleteId}`, data),
};

export const trainingAPI = {
  getWorkouts: (athleteId: number, limit: number = 10) => 
    api.get(`/api/training/workouts?athlete_id=${athleteId}&limit=${limit}`),
  getWorkout: (workoutId: number) => 
    api.get(`/api/training/workouts/${workoutId}`),
  createWorkout: (data: any) => 
    api.post('/api/training/workouts', data),
  getRecommendations: (athleteId: number) => 
    api.get(`/api/training/recommendations?athlete_id=${athleteId}`),
};

export const performanceAPI = {
  getMetrics: (athleteId: number) => 
    api.get(`/api/performance/metrics/${athleteId}`),
  getTrends: (athleteId: number, metric: string, days: number = 90) => 
    api.get(`/api/performance/trends/${athleteId}?metric=${metric}&days=${days}`),
  getTrainingLoad: (athleteId: number, days: number = 90) => 
    api.get(`/api/performance/load/${athleteId}?days=${days}`),
  getComparison: (athleteId: number) => 
    api.get(`/api/performance/comparison/${athleteId}`),
};

export default api;

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8085/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Add response interceptor for 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (fullName, email, password, role = 'student') => api.post('/auth/register', { fullName, email, password, role });

// Intelligence
export const getRecommendations = () => api.get('/intelligence/recommendations');

// Resume
export const uploadResume = (formData) => api.post('/resumes/upload', formData);

// Profile
export const getProfile = () => api.get('/profile/me');
export const updateProfile = (data) => api.post('/profile/me', data);

// Skills
export const getMySkills = () => api.get('/skills/mine');
export const addSkill = (name, category = 'General') => api.post('/skills/add', { name, category });
export const removeSkill = (skillId) => api.delete(`/skills/${skillId}`);

export default api;

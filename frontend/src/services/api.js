import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'https://civiltrack-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (userData) => api.post('/auth/register', userData);
export const login = (userData) => api.post('/auth/login', userData);
export const googleAuth = (userData) => api.post('/auth/google', userData);
export const getCurrentUser = () => api.get('/auth/me');

// Complaints
export const createComplaint = (data) => api.post('/complaints', data);
export const getComplaints = () => api.get('/complaints');
export const getComplaint = (id) => api.get(`/complaints/${id}`);
export const updateComplaintStatus = (id, data) => api.put(`/complaints/${id}/status`, data);
export const upvoteComplaint = (id) => api.post(`/complaints/${id}/upvote`);
export const getDashboardStats = () => api.get('/complaints/stats/dashboard');

export default api;

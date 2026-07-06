import axios from 'axios';

// All API calls go to Spring Boot backend
// VITE_API_URL can be set at build time — defaults to localhost for local dev
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// Interceptor — runs before EVERY request
// Reads token from localStorage and adds it to Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

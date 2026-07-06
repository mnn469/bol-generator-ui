import axios from 'axios';

// All API calls go to Spring Boot backend
const api = axios.create({
  baseURL: 'http://localhost:8080',
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

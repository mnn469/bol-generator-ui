import axios from 'axios';

// In Docker: Nginx proxies /api/* to the Spring Boot backend (no hardcoded URL needed)
// In local dev (npm run dev): Vite proxy in vite.config.ts forwards /api/* to localhost:8080
const api = axios.create({
  baseURL: '',
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

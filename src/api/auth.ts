import api from './axios';
import type { AuthResponse } from '../types';

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/login', { email, password });

export const register = (name: string, email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/register', { name, email, password });

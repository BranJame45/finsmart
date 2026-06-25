import { api } from './api';

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: { id: string; email: string; name: string };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>('/auth/login', { email, password });
  localStorage.setItem('finsmart_token', data.token);
  if (data.refreshToken) localStorage.setItem('finsmart_refresh', data.refreshToken);
  return data;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>('/auth/register', { email, password, name });
  localStorage.setItem('finsmart_token', data.token);
  if (data.refreshToken) localStorage.setItem('finsmart_refresh', data.refreshToken);
  return data;
}

export function logout(): void {
  localStorage.removeItem('finsmart_token');
  localStorage.removeItem('finsmart_refresh');
  window.location.href = '/login';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('finsmart_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

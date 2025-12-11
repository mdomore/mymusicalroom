import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Token helpers
const TOKEN_KEY = 'mmr_token';

export const setAuthToken = (token?: string) => {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const loadStoredToken = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
};

// Load token on import (client-side)
if (typeof window !== 'undefined') {
  loadStoredToken();
}

export interface Page {
  id: number;
  name: string;
  type: 'song' | 'technical';
  is_favorite: boolean;
  created_at: string;
  resources?: Resource[];
}

export interface Resource {
  id: number;
  page_id: number;
  title: string;
  description?: string;
  resource_type: 'video' | 'photo' | 'document' | 'music_sheet';
  file_path?: string;
  external_url?: string;
  order: number;
  is_expanded: boolean;
  created_at: string;
}

export const pagesApi = {
  getAll: () => api.get<Page[]>('/api/pages/'),
  getById: (id: number) => api.get<Page>(`/api/pages/${id}`),
  create: (data: { name: string; type: 'song' | 'technical'; is_favorite?: boolean }) =>
    api.post<Page>('/api/pages/', data),
  update: (id: number, data: Partial<Page>) =>
    api.put<Page>(`/api/pages/${id}`, data),
  delete: (id: number) => api.delete(`/api/pages/${id}`),
};

export const resourcesApi = {
  getAll: (pageId?: number) =>
    api.get<Resource[]>('/api/resources/', { params: { page_id: pageId } }),
  getById: (id: number) => api.get<Resource>(`/api/resources/${id}`),
  create: (data: Partial<Resource> & { page_id: number }) =>
    api.post<Resource>('/api/resources/', data),
  upload: (pageId: number, file: File, title?: string, description?: string, resourceType?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (resourceType) formData.append('resource_type', resourceType);
    return api.post<Resource>(`/api/resources/upload/${pageId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: number, data: Partial<Resource>) =>
    api.put<Resource>(`/api/resources/${id}`, data),
  reorder: (orders: Record<number, number>) =>
    api.put<Resource[]>('/api/resources/reorder', orders),
  delete: (id: number) => api.delete(`/api/resources/${id}`),
};

// Auth
export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  register: (data: { email: string; password: string }) =>
    api.post<User>('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<TokenResponse>('/api/auth/login', data),
  me: () => api.get<User>('/api/auth/me'),
  logout: () => api.post('/api/auth/logout', {}),
};


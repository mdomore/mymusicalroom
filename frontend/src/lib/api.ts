import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Token helpers - get token from Supabase session
export const getAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

export const setAuthToken = async (token?: string) => {
  if (!token) {
    delete api.defaults.headers.common['Authorization'];
    return;
  }
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Load token from Supabase session on API calls
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      // Sign out from Supabase and redirect to login
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out:', signOutError);
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/mymusicalroom/login';
      }
    }
    // Ensure error has a message
    if (error && !error.message) {
      error.message = error?.response?.data?.detail || error?.response?.statusText || 'An error occurred';
    }
    return Promise.reject(error);
  }
);

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
  resource_type: 'video' | 'photo' | 'document' | 'music_sheet' | 'audio';
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

// Auth - using Supabase directly
export interface User {
  id: string;  // UUID string
  email: string;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  register: async (data: { email: string; password: string }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;
    return { data: authData.user! };
  },
  login: async (data: { username: string; password: string }) => {
    // Call backend API which handles username lookup and Supabase login
    const response = await api.post<TokenResponse & { email?: string; refresh_token?: string }>('/api/auth/login', {
      username: data.username,
      password: data.password,
    });
    
    // Set the Supabase session using the tokens from backend
    if (response.data.access_token && response.data.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      });
      if (error) {
        console.warn('Failed to set Supabase session:', error);
        // Fallback: sign in directly with email if we have it
        if (response.data.email) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: response.data.email,
            password: data.password,
          });
          if (signInError) throw signInError;
        }
      }
    }
    
    return response;
  },
  me: async () => {
    const response = await api.get<User>('/api/auth/me');
    return response;
  },
  logout: async () => {
    await api.post('/api/auth/logout');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { data: { message: 'Logged out' } };
  },
};


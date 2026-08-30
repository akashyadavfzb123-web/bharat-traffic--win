import apiClient from './apiClient';
import type { TokenResponse, UserOut } from '../types/auth';

export const authApi = {
  register: async (data: { name: string; email: string; password: string }): Promise<UserOut> => {
    const response = await apiClient.post<UserOut>('/auth/register', {
      name: data.name,
      full_name: data.name,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  login: async (credentials: { email: string; password: string }): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data;
  },

  getMe: async (): Promise<UserOut> => {
    const response = await apiClient.get<UserOut>('/auth/me');
    return response.data;
  },
};

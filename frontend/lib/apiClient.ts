import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from './auth';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshClient = axios.create({
        baseURL,
        withCredentials: true,
      });

      const refreshResponse = await refreshClient.post('/api/auth/refresh');
      const newAccessToken = refreshResponse.data?.accessToken;

      if (!newAccessToken || typeof newAccessToken !== 'string') {
        throw new Error('Missing accessToken in refresh response');
      }

      useAuthStore.getState().login(newAccessToken);
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);

      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }

      return Promise.reject(refreshError);
    }
  },
);

export { apiClient };

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://tbt-backend-hwu3.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-platform': 'mobile',
  },
});

// Request interceptor to attach Bearer token if user is logged in
apiClient.interceptors.request.use(
  async config => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        const authData = await AsyncStorage.getItem('auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          token = parsed?.token || parsed?.tokens?.accessToken;
        }
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore token read errors
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      // Token expired or invalid - clear all session keys
      Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('refreshToken'),
        AsyncStorage.removeItem('auth'),
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('role'),
      ]).catch(() => {});
    }
    return Promise.reject(error);
  },
);

export default apiClient;

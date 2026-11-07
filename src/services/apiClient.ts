import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  API_WARMUP_PATH,
  SERVER_ORIGIN,
} from '@/constants/config';
import { getToken } from './tokenStorage';
import { normalizeApiError, ApiError } from './apiError';
import { triggerCleanLogout } from './authEvents';

// Re-export constants for backward compatibility
export { API_BASE_URL };

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS, // 60s for Render cold starts
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-platform': 'mobile',
  },
});

// Request interceptor to attach Bearer token securely from Keychain
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore token read errors silently
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(normalizeApiError(error));
  },
);

// Max retries for cold start on GET requests
const MAX_COLD_START_RETRIES = 2;

// Response interceptor: cold start retry on GET, 401 clean logout, and error normalization
apiClient.interceptors.response.use(
  response => response,
  async (error: any) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;
    const status = error?.response?.status;
    const code = error?.code;
    const isColdStart =
      code === 'ECONNABORTED' ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      Boolean(error?.message && error.message.toLowerCase().includes('timeout'));

    // Retry with exponential backoff for cold start errors on GET requests only
    if (
      originalRequest &&
      originalRequest.method?.toUpperCase() === 'GET' &&
      isColdStart &&
      (!originalRequest.__retryCount || originalRequest.__retryCount < MAX_COLD_START_RETRIES)
    ) {
      originalRequest.__retryCount = (originalRequest.__retryCount || 0) + 1;
      const backoffDelay = originalRequest.__retryCount * 1500; // 1.5s, 3.0s
      await new Promise(resolve => setTimeout(() => resolve(undefined), backoffDelay));
      return apiClient(originalRequest);
    }

    // 401 Unauthorized handling:
    // Only authenticated requests that carried a stored token trigger clean logout.
    // Login (wrong password), change-password (wrong current password), register, OTP, etc.
    // must NOT trigger logout; they must return the normal error message to the UI.
    if (status === 401) {
      const requestUrl = (originalRequest?.url || '').toLowerCase();
      const isExemptEndpoint =
        requestUrl.includes('/login') ||
        requestUrl.includes('change-password') ||
        requestUrl.includes('/register') ||
        requestUrl.includes('verify-otp') ||
        requestUrl.includes('resend-otp') ||
        requestUrl.includes('forgot-password') ||
        requestUrl.includes('reset-password');

      if (!isExemptEndpoint) {
        const authHeader =
          originalRequest?.headers?.Authorization ||
          originalRequest?.headers?.authorization;
        const storedToken = await getToken().catch(() => null);

        // Only trigger clean logout if the request was authenticated with a real stored token
        if (authHeader && storedToken) {
          triggerCleanLogout().catch(() => {});
        }
      }
    }

    // Normalize error into standard ApiError shape
    const normalized = normalizeApiError(error);
    return Promise.reject(normalized);
  },
);

let warmupInitiated = false;

/**
 * Silent warm-up request to ping the lightweight endpoint at app startup
 * to wake up Render instances without user-facing impact.
 */
export async function warmupApiServer(): Promise<void> {
  if (warmupInitiated) return;
  warmupInitiated = true;

  try {
    await axios.get(`${SERVER_ORIGIN}${API_WARMUP_PATH}`, {
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'x-platform': 'mobile',
      },
    });
  } catch {
    // Silent warm-up: ignore cold start delays or non-200 responses
  }
}

export { ApiError, normalizeApiError };
export default apiClient;

/**
 * Central App Configuration
 * Switch between development and release environments seamlessly.
 * No secrets or sensitive keys belong in this file.
 */

/**
 * Central App Configuration
 * Switch between development and release environments seamlessly.
 * No secrets or sensitive keys belong in this file.
 */

/**
 * LOCAL_LAN_IP:
 * Set this constant to your machine's local LAN IP (e.g. 'http://192.168.1.100:5000')
 * when debugging against a local backend instance from a physical phone.
 * Keep as `null` by default to connect directly to the live Render cloud backend in both dev and release.
 * NOTE: Never use 'localhost' or '127.0.0.1' because physical devices cannot resolve host localhost.
 */
export const LOCAL_LAN_IP: string | null = null;

// Default Cloud Render origin (reachable from all physical phones over cellular/WiFi)
const RENDER_SERVER_ORIGIN = 'https://tbt-backend-hwu3.onrender.com';

export const SERVER_ORIGIN = LOCAL_LAN_IP || RENDER_SERVER_ORIGIN;
export const API_BASE_URL = `${SERVER_ORIGIN}/api`;
export const SOCKET_URL = SERVER_ORIGIN;

// Web app URLs (retains /en/ locale path for future i18n support)
export const WEB_BASE_URL = 'https://cti-frontend-zeta.vercel.app';
export const WEB_LOGIN_URL = 'https://cti-frontend-zeta.vercel.app/en/auth/login';
export const WEB_ADD_JOB_URL = 'https://cti-frontend-zeta.vercel.app/en/my-account/add-job';

// Network & Cold Start Configuration
export const API_TIMEOUT_MS = 60000; // 60s to accommodate Render free-tier cold starts
export const API_WARMUP_PATH = '/check'; // Lightweight root endpoint on tbt-server

export const APP_CONFIG = {
  isDev: __DEV__,
  serverOrigin: SERVER_ORIGIN,
  apiBaseUrl: API_BASE_URL,
  socketUrl: SOCKET_URL,
  webLoginUrl: WEB_LOGIN_URL,
  webAddJobUrl: WEB_ADD_JOB_URL,
  timeoutMs: API_TIMEOUT_MS,
  warmupPath: API_WARMUP_PATH,
} as const;

export default APP_CONFIG;


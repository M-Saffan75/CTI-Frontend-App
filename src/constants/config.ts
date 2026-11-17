/**
 * Central App Configuration
 * Switch between development and release environments seamlessly.
 * No secrets or sensitive keys belong in this file.
 */

import { getWebLocaleSegment } from '@/i18n/locale';

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

// Web app URLs. The path starts with the website language (/tr/ or /en/) that follows the app language,
// so these are functions: call them when the link is opened, never store the result.
export const WEB_BASE_URL = 'https://cti-frontend-zeta.vercel.app';
const webUrl = (path: string) => `${WEB_BASE_URL}/${getWebLocaleSegment()}${path}`;

export const getWebLoginUrl = () => webUrl('/auth/login');
export const getWebAcademyCourseUrl = (slug: string) => webUrl(`/academy/academy-listing/${slug}`);
export const getWebAddJobUrl = () => webUrl('/my-account/add-job');

// Seller web pages (operations that stay on the website)
export const getWebSellerProductsUrl = () => webUrl('/seller/product');
export const getWebSellerProductAddUrl = () => `${getWebSellerProductsUrl()}/add`;
export const getWebSellerProductEditUrl = (productId: string) => `${getWebSellerProductsUrl()}/${productId}/edit`;
export const getWebSellerProductVariantsUrl = (productId: string) =>
  `${getWebSellerProductsUrl()}/${productId}/variants`;
export const getWebSellerOrdersUrl = () => webUrl('/seller/order');
export const getWebSellerOrderUrl = (orderId: string) => `${getWebSellerOrdersUrl()}/${orderId}`;
export const getWebSellerReportsUrl = () => webUrl('/seller/reports');
export const getWebSellerProfileEditUrl = () => webUrl('/seller/profile');
export const getWebSellerAdsUrl = () => webUrl('/seller/ads');
export const getWebSellerAdsPaymentUrl = () => `${getWebSellerAdsUrl()}/payment`;
export const getWebSellerAdEditUrl = (adId: string) => `${getWebSellerAdsUrl()}/${adId}/edit`;
export const getWebSellerInvoicesUrl = () => webUrl('/seller/invoice');
export const getWebSellerImportExportUrl = () => `${getWebSellerProductsUrl()}/import-export`;

// Repairman web pages (operations that stay on the website)
export const getWebRepairmanUrl = () => webUrl('/repair-man');
export const getWebRepairmanProfileEditUrl = () => `${getWebRepairmanUrl()}/profile/edit-profile`;
export const getWebRepairmanAdsUrl = () => `${getWebRepairmanUrl()}/ads`;
export const getWebRepairmanServiceCatalogUrl = () => `${getWebRepairmanUrl()}/service-catalog`;
export const getWebRepairmanServiceAddUrl = () => `${getWebRepairmanServiceCatalogUrl()}/add`;
export const getWebRepairmanServiceEditUrl = (serviceId: string) =>
  `${getWebRepairmanServiceCatalogUrl()}/${serviceId}/edit`;
export const getWebRepairmanEarningsUrl = () => `${getWebRepairmanUrl()}/earning`;
export const getWebRepairmanOfferEditUrl = (offerId: string) =>
  `${getWebRepairmanUrl()}/my-offers/${offerId}/edit`;

// Network & Cold Start Configuration
export const API_TIMEOUT_MS = 60000; // 60s to accommodate Render free-tier cold starts
export const API_WARMUP_PATH = '/check'; // Lightweight root endpoint on tbt-server

export const APP_CONFIG = {
  isDev: __DEV__,
  serverOrigin: SERVER_ORIGIN,
  apiBaseUrl: API_BASE_URL,
  socketUrl: SOCKET_URL,
  timeoutMs: API_TIMEOUT_MS,
  warmupPath: API_WARMUP_PATH,
} as const;

export default APP_CONFIG;

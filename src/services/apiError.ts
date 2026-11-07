export interface NormalizedApiErrorData {
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
  data?: any;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  canRetry?: boolean;
  originalError?: any;
}

export class ApiError extends Error {
  public status?: number;
  public fieldErrors?: Record<string, string>;
  public data?: any;
  public isNetworkError: boolean;
  public isTimeout: boolean;
  public canRetry: boolean;
  public originalError?: any;

  constructor(normalized: NormalizedApiErrorData) {
    super(normalized.message);
    this.name = 'ApiError';
    this.status = normalized.status;
    this.fieldErrors = normalized.fieldErrors;
    this.data = normalized.data;
    this.isNetworkError = Boolean(normalized.isNetworkError);
    this.isTimeout = Boolean(normalized.isTimeout);
    this.canRetry = Boolean(normalized.canRetry);
    this.originalError = normalized.originalError;

    // Restore prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Extracts and maps field-level validation errors into a key-value map.
 * Supports express-validator array formats and nested dictionary formats.
 */
function extractFieldErrors(data: any): Record<string, string> | undefined {
  if (!data) return undefined;

  const fieldErrors: Record<string, string> = {};

  // Case 1: errors is an array of objects: [{ path/param/field: 'email', msg/message: 'Invalid' }]
  if (Array.isArray(data.errors)) {
    for (const item of data.errors) {
      if (typeof item === 'object' && item !== null) {
        const fieldName = item.path || item.param || item.field;
        const msg = item.msg || item.message || (typeof item === 'string' ? item : null);
        if (fieldName && msg) {
          fieldErrors[fieldName] = String(msg);
        }
      }
    }
  }

  // Case 2: errors is an object/map: { email: 'Invalid email', password: 'Required' }
  if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    for (const [key, val] of Object.entries(data.errors)) {
      if (typeof val === 'string') {
        fieldErrors[key] = val;
      } else if (typeof val === 'object' && val !== null && (val as any).msg) {
        fieldErrors[key] = String((val as any).msg);
      }
    }
  }

  // Case 3: data itself contains a fields object
  if (data.fieldErrors && typeof data.fieldErrors === 'object') {
    Object.assign(fieldErrors, data.fieldErrors);
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

/**
 * Normalizes any error (AxiosError, NetworkError, standard Error, or custom payload)
 * into a single unified ApiError instance.
 */
export function normalizeApiError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const status = error?.response?.status;
  const resData = error?.response?.data;
  const code = error?.code;
  const rawMsg = error?.message;

  const isTimeout =
    code === 'ECONNABORTED' ||
    Boolean(rawMsg && rawMsg.toLowerCase().includes('timeout')) ||
    status === 504;

  const isNetwork =
    rawMsg === 'Network Error' ||
    code === 'ERR_NETWORK' ||
    (!error?.response && Boolean(error?.request));

  let statusMessage: string | null = null;
  let canRetry = false;

  // Handle specific status codes
  if (status === 401) {
    statusMessage = 'Session expired. Please log in again.';
  } else if (status === 403) {
    statusMessage = 'You do not have permission to perform this action.';
  } else if (status === 410) {
    // 410: Incomplete KYC - Provider onboarding required on website
    statusMessage =
      (typeof resData === 'object' && (resData?.message || resData?.error)) ||
      'Please complete your identity verification on the website.';
  } else if (status === 422) {
    statusMessage = 'Please review and correct the errors below.';
  } else if (status === 502 || status === 503) {
    statusMessage =
      'The server is currently waking up or busy. Please wait a moment and try again.';
    canRetry = true;
  } else if (status && status >= 500) {
    statusMessage = 'A server error occurred. Please try again.';
    canRetry = true;
  } else if (isTimeout) {
    statusMessage =
      'The request timed out while waiting for the server. It may be waking up, please try again.';
    canRetry = true;
  } else if (isNetwork) {
    statusMessage =
      'Unable to connect to the server. Please check your internet connection and try again.';
    canRetry = true;
  }

  // Extract explicit message from backend response if available
  let backendMessage: string | null = null;
  if (typeof resData === 'string' && resData.trim()) {
    backendMessage = resData.trim();
  } else if (resData && typeof resData === 'object') {
    backendMessage = resData.message || resData.error || null;
    if (!backendMessage && Array.isArray(resData.errors) && resData.errors.length > 0) {
      const first = resData.errors[0];
      if (typeof first === 'string') backendMessage = first;
      else if (first?.msg) backendMessage = first.msg;
      else if (first?.message) backendMessage = first.message;
    }
  }

  // Use backend message when suitable, fallback to statusMessage, then error.message, then generic
  const finalMessage =
    (status === 410 && backendMessage) ? backendMessage :
    (status === 403 && backendMessage) ? backendMessage :
    (backendMessage && status !== 500 && status !== 502 && status !== 503) ? backendMessage :
    statusMessage ||
    backendMessage ||
    rawMsg ||
    'An unexpected error occurred. Please try again.';

  const fieldErrors = extractFieldErrors(resData);

  // Preserve response data payload (crucial for 410 KYC data)
  const data = resData?.data !== undefined ? resData.data : resData;

  return new ApiError({
    message: finalMessage,
    status,
    fieldErrors,
    data,
    isNetworkError: isNetwork,
    isTimeout,
    canRetry,
    originalError: error,
  });
}

export default normalizeApiError;


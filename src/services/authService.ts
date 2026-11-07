import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import { tokenStorage } from './tokenStorage';
import { triggerCleanLogout } from './authEvents';
import { normalizeApiError, ApiError } from './apiError';

export interface AuthUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  isProfileComplete?: boolean;
  isKycCompleted?: boolean;
  kycStatus?: string;
  [key: string]: any;
}

export interface LoginParams {
  email: string;
  password: string;
  role?: string;
  rememberMe?: boolean;
}

export interface RegisterParams {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

export interface VerifyOtpParams {
  email: string;
  otp: string;
  role?: string;
}

export interface ResetPasswordParams {
  email: string;
  otp: string;
  password: string;
  confirmPassword?: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
  role?: string;
}

let memoryUser: AuthUser | null = null;
let memoryRole: string | null = null;

export class AuthService {
  /**
   * Get synchronously cached user from memory
   */
  static getCachedUser(): AuthUser | null {
    return memoryUser;
  }

  /**
   * Get synchronously cached role from memory
   */
  static getCachedRole(): string | null {
    return memoryRole;
  }

  /**
   * Set cached session in memory
   */
  static setCachedSession(user: AuthUser | null, role: string | null) {
    memoryUser = user;
    memoryRole = role;
  }

  /**
   * Login with email and password
   */
  static async login({ email, password, role, rememberMe = true }: LoginParams) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();

      const response = await apiClient.post('/auth/login', {
        email: cleanEmail,
        password,
        rememberMe,
      });

      const resData = response.data;
      const dataPayload = resData?.data || resData;

      // Handle unverified email redirect requirement
      if (resData?.requiresVerification) {
        return {
          ok: false,
          requiresVerification: true,
          email: dataPayload?.email || cleanEmail,
          userId: dataPayload?.userId,
          role: dataPayload?.role || role,
          message: resData?.message || 'Please verify your email first.',
        };
      }

      const token =
        dataPayload?.tokens?.accessToken ||
        dataPayload?.token ||
        dataPayload?.accessToken;
      const refreshToken =
        dataPayload?.tokens?.refreshToken ||
        dataPayload?.refreshToken;
      const user = dataPayload?.user || dataPayload;
      const userRole = user?.role || role;

      // Store tokens securely in Keychain (never in AsyncStorage)
      if (token) {
        await tokenStorage.setToken(token);
      }
      if (refreshToken) {
        await tokenStorage.setRefreshToken(refreshToken);
      }

      // Store non-sensitive user info and preferences in AsyncStorage
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      if (userRole) {
        await AsyncStorage.setItem('role', userRole);
      }
      if (user || userRole) {
        await AsyncStorage.setItem(
          'auth',
          JSON.stringify({ user, role: userRole }),
        );
      }

      memoryUser = user || null;
      memoryRole = userRole || null;

      return {
        ok: true,
        token,
        refreshToken,
        user,
        role: userRole,
        message: resData?.message || 'Login successful',
      };
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  }

  /**
   * Register a new user (Customer, Seller, Repairman)
   */
  static async register({ name, email, phone, password, role }: RegisterParams) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const payload = {
        name: (name || '').trim(),
        email: cleanEmail,
        phone: (phone || '').trim(),
        password,
        role,
      };

      let response;
      if (role === 'seller') {
        try {
          response = await apiClient.post('/seller/auth/register', payload);
        } catch (err: any) {
          if (err?.status === 404 || err?.response?.status === 404) {
            response = await apiClient.post('/auth/register', payload);
          } else {
            throw err;
          }
        }
      } else {
        response = await apiClient.post('/auth/register', payload);
      }

      const resData = response.data;
      return {
        ok: true,
        email: cleanEmail,
        role,
        data: resData?.data,
        message: resData?.message || 'Registration successful. Please verify OTP.',
      };
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  }

  /**
   * Request OTP for password reset
   */
  static async forgotPassword(emailOrPhone: string) {
    try {
      const cleanEmail = (emailOrPhone || '').trim().toLowerCase();
      const response = await apiClient.post('/auth/forgot-password', {
        email: cleanEmail,
        platform: 'mobile',
      });

      return {
        ok: true,
        email: cleanEmail,
        message: response.data?.message || 'Verification code sent to your email.',
      };
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  }

  /**
   * Verify OTP during signup or reset
   */
  static async verifyOtp({ email, otp, role }: VerifyOtpParams) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanOtp = (otp || '').trim();

      const payload = {
        email: cleanEmail,
        otp: cleanOtp,
      };

      let response;
      if (role === 'seller') {
        try {
          response = await apiClient.post('/seller/auth/verify-otp', payload);
        } catch (err: any) {
          if (err?.status === 404 || err?.response?.status === 404) {
            response = await apiClient.post('/auth/verify-otp', payload);
          } else {
            throw err;
          }
        }
      } else {
        response = await apiClient.post('/auth/verify-otp', payload);
      }

      const resData = response.data;
      const dataPayload = resData?.data || resData;

      const token =
        dataPayload?.tokens?.accessToken ||
        dataPayload?.token ||
        dataPayload?.accessToken;
      const refreshToken =
        dataPayload?.tokens?.refreshToken ||
        dataPayload?.refreshToken;

      // Store tokens securely in Keychain (never in AsyncStorage)
      if (token) {
        await tokenStorage.setToken(token);
      }
      if (refreshToken) {
        await tokenStorage.setRefreshToken(refreshToken);
      }

      // Store non-sensitive profile info in AsyncStorage
      if (dataPayload?.user) {
        await AsyncStorage.setItem('user', JSON.stringify(dataPayload.user));
      }
      const verifiedRole = role || dataPayload?.user?.role;
      if (verifiedRole) {
        await AsyncStorage.setItem('role', verifiedRole);
      }
      if (dataPayload?.user || verifiedRole) {
        await AsyncStorage.setItem(
          'auth',
          JSON.stringify({
            user: dataPayload?.user,
            role: verifiedRole,
          }),
        );
      }

      return {
        ok: true,
        token,
        refreshToken,
        user: dataPayload?.user,
        message: resData?.message || 'OTP verified successfully',
      };
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  }

  /**
   * Resend OTP code
   */
  static async resendOtp(email: string, role?: string) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const payload = { email: cleanEmail };

      let response;
      if (role === 'seller') {
        try {
          response = await apiClient.post('/seller/auth/resend-otp', payload);
        } catch (err: any) {
          if (err?.status === 404 || err?.response?.status === 404) {
            response = await apiClient.post('/auth/resend-otp', payload);
          } else {
            throw err;
          }
        }
      } else {
        response = await apiClient.post('/auth/resend-otp', payload);
      }

      return {
        ok: true,
        message: response.data?.message || 'OTP resent successfully.',
      };
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  }

  /**
   * Reset Password with OTP
   */
  static async resetPassword({ email, otp, password, confirmPassword }: ResetPasswordParams) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanOtp = (otp || '').trim();
      const confPassword = confirmPassword || password;

      const payload = {
        platform: 'mobile',
        email: cleanEmail,
        otp: cleanOtp,
        token: cleanOtp,
        newPassword: password,
        confirmPassword: confPassword,
      };

      const response = await apiClient.post('/auth/reset-password', payload);
      return {
        ok: true,
        message: response.data?.message || 'Password reset successfully.',
      };
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  }

  /**
   * Change password for logged in user
   */
  static async changePassword({
    currentPassword,
    newPassword,
    confirmPassword,
    role,
  }: ChangePasswordParams) {
    try {
      const payload = {
        currentPassword,
        newPassword,
        confirmPassword: confirmPassword || newPassword,
      };

      const effectiveRole = (
        role ||
        AuthService.getCachedRole() ||
        (await AuthService.getStoredRole()) ||
        ''
      ).toLowerCase();

      let response;
      if (effectiveRole === 'seller') {
        try {
          response = await apiClient.post('/seller/auth/change-password', payload);
        } catch (err: any) {
          if (err?.status === 404 || err?.response?.status === 404) {
            response = await apiClient.post('/auth/change-password', payload);
          } else {
            throw err;
          }
        }
      } else if (effectiveRole === 'customer') {
        try {
          response = await apiClient.put('/customer/profile/change-password', payload);
        } catch (err: any) {
          if (err?.status === 404 || err?.response?.status === 404) {
            response = await apiClient.post('/auth/change-password', payload);
          } else {
            throw err;
          }
        }
      } else {
        response = await apiClient.post('/auth/change-password', payload);
      }

      return {
        ok: true,
        message: response.data?.message || 'Password changed successfully.',
      };
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  }

  /**
   * Fetch latest user profile from backend (GET /auth/user-details)
   * Updates cached user in memory and AsyncStorage with the latest kycStatus and isKycCompleted.
   */
  static async fetchUserProfile(): Promise<AuthUser | null> {
    try {
      const response = await apiClient.get('/auth/user-details');
      const resData = response.data;
      const rawUser = resData?.data || resData?.user || resData;
      if (!rawUser) return null;

      const isKycCompleted = Boolean(
        rawUser.isKycCompleted ??
        rawUser.repairmanProfile?.kycInfo?.isKycCompleted ??
        rawUser.sellerProfile?.isKycCompleted ??
        false
      );

      const kycStatus =
        rawUser.kycStatus ||
        rawUser.repairmanProfile?.kycInfo?.kycStatus ||
        rawUser.sellerProfile?.kycStatus ||
        (isKycCompleted ? 'approved' : 'incomplete');

      const updatedUser: AuthUser = {
        ...rawUser,
        isKycCompleted,
        kycStatus,
      };

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      const currentRole = memoryRole || updatedUser.role;
      if (currentRole) {
        await AsyncStorage.setItem(
          'auth',
          JSON.stringify({ user: updatedUser, role: currentRole }),
        );
      }
      memoryUser = updatedUser;
      return updatedUser;
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  }

  /**
   * Get cached user session from secure Keychain and AsyncStorage
   */
  static async getStoredSession(): Promise<{ token: string; user: AuthUser | null; role: string } | null> {
    try {
      const [token, userStr, role, authStr] = await Promise.all([
        tokenStorage.getToken(),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('role'),
        AsyncStorage.getItem('auth'),
      ]);

      const authObj = authStr ? JSON.parse(authStr) : null;
      const finalRole = role || authObj?.role || authObj?.user?.role;
      const user = userStr ? JSON.parse(userStr) : authObj?.user || null;

      if (token && finalRole) {
        memoryUser = user || null;
        memoryRole = finalRole;
        return { token, user, role: finalRole };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clear local storage and memory
   */
  static async clearStoredAuth(): Promise<void> {
    memoryUser = null;
    memoryRole = null;
    await Promise.all([
      AsyncStorage.removeItem('user'),
      AsyncStorage.removeItem('role'),
      AsyncStorage.removeItem('auth'),
    ]).catch(() => {});
  }

  /**
   * Logout user cleanly: clear tokens from keychain, query cache, socket, FCM, and session keys
   */
  static async logout(): Promise<boolean> {
    try {
      memoryUser = null;
      memoryRole = null;
      await triggerCleanLogout();
      return true;
    } catch {
      return false;
    }
  }
}

export { ApiError };
export default AuthService;

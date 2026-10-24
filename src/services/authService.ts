import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

export interface AuthUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  isProfileComplete?: boolean;
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

function extractErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data?.message && typeof data.message === 'string') return data.message;
  if (data?.error && typeof data.error === 'string') return data.error;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first === 'string') return first;
    if (first?.msg && typeof first.msg === 'string') return first.msg;
    if (first?.message && typeof first.message === 'string') return first.message;
  }
  if (error?.message && typeof error.message === 'string') return error.message;
  return fallback;
}

export class AuthService {
  /**
   * Login with email and password
   */
  static async login({ email, password, role, rememberMe = true }: LoginParams) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();

      // Demo login support for testing all roles and screens
      if (cleanEmail === 'demo@cti.com' || cleanEmail.startsWith('demo') || cleanEmail === 'guest@cti.com') {
        const userRole = role || 'customer';
        const demoUser = {
          id: 'demo-user-101',
          _id: 'demo-user-101',
          name: userRole === 'seller' ? 'Shahid Tech Store' : userRole === 'repairman' ? 'Farhan Repair Tech' : 'Muhammad Zubair',
          email: cleanEmail,
          role: userRole,
          avatar: '',
          isProfileComplete: true,
        };
        const demoToken = 'demo-jwt-token-active';
        await AsyncStorage.setItem('token', demoToken);
        await AsyncStorage.setItem('user', JSON.stringify(demoUser));
        await AsyncStorage.setItem('role', userRole);
        return {
          ok: true,
          token: demoToken,
          user: demoUser,
          role: userRole,
          message: 'Demo login successful',
        };
      }

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

      const token = dataPayload?.token;
      const user = dataPayload?.user || dataPayload;
      const userRole = user?.role || role;

      if (token) {
        await AsyncStorage.setItem('token', token);
      }
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      if (userRole) {
        await AsyncStorage.setItem('role', userRole);
      }

      return {
        ok: true,
        token,
        user,
        role: userRole,
        message: resData?.message || 'Login successful',
      };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Login failed. Please check your credentials.'));
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
          if (err?.response?.status === 404) {
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
      throw new Error(extractErrorMessage(error, 'Registration failed. Please try again.'));
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
      throw new Error(extractErrorMessage(error, 'Failed to process forgot password request.'));
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
          if (err?.response?.status === 404) {
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

      if (dataPayload?.token) {
        await AsyncStorage.setItem('token', dataPayload.token);
      }
      if (dataPayload?.user) {
        await AsyncStorage.setItem('user', JSON.stringify(dataPayload.user));
      }
      if (role || dataPayload?.user?.role) {
        await AsyncStorage.setItem('role', role || dataPayload.user.role);
      }

      return {
        ok: true,
        token: dataPayload?.token,
        user: dataPayload?.user,
        message: resData?.message || 'OTP verified successfully',
      };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'OTP verification failed. Please check the code.'));
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
          if (err?.response?.status === 404) {
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
      throw new Error(extractErrorMessage(error, 'Failed to resend OTP.'));
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
      throw new Error(extractErrorMessage(error, 'Failed to reset password.'));
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

      let response;
      if (role === 'seller') {
        try {
          response = await apiClient.post('/seller/auth/change-password', payload);
        } catch (err: any) {
          if (err?.response?.status === 404) {
            response = await apiClient.post('/auth/change-password', payload);
          } else {
            throw err;
          }
        }
      } else if (role === 'customer') {
        try {
          response = await apiClient.put('/customer/profile/change-password', payload);
        } catch (err: any) {
          if (err?.response?.status === 404) {
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
      throw new Error(extractErrorMessage(error, 'Failed to change password.'));
    }
  }

  /**
   * Get cached user session from storage
   */
  static async getStoredSession() {
    try {
      const [token, userStr, role] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('role'),
      ]);

      if (token && role) {
        const user = userStr ? JSON.parse(userStr) : null;
        return { token, user, role };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Logout user and clear stored keys
   */
  static async logout() {
    try {
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('role'),
        AsyncStorage.removeItem('auth'),
      ]);
      return true;
    } catch {
      return false;
    }
  }
}

export default AuthService;

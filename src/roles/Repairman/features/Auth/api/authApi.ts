import { ROLES } from '@/constants/roles';
import AuthService, {
  LoginParams,
  RegisterParams,
  VerifyOtpParams,
  ResetPasswordParams,
  ChangePasswordParams,
} from '@/services/authService';

const ROLE = ROLES.REPAIRMAN;

export async function login({ email, password, rememberMe }: Partial<LoginParams>) {
  return AuthService.login({
    email: email || '',
    password: password || '',
    role: ROLE,
    rememberMe,
  });
}

export async function register({ name, email, phone, password }: Omit<RegisterParams, 'role'>) {
  return AuthService.register({
    name,
    email,
    phone,
    password,
    role: ROLE,
  });
}

export async function forgotPassword({ emailOrPhone }: { emailOrPhone: string }) {
  return AuthService.forgotPassword(emailOrPhone);
}

export async function verifyOtp({ email, otp }: Partial<VerifyOtpParams>) {
  return AuthService.verifyOtp({
    email: email || '',
    otp: otp || '',
    role: ROLE,
  });
}

export async function resendOtp(email?: string) {
  return AuthService.resendOtp(email || '', ROLE);
}

export async function resetPassword({
  email,
  otp,
  password,
  confirmPassword,
}: ResetPasswordParams) {
  return AuthService.resetPassword({
    email,
    otp,
    password,
    confirmPassword,
  });
}

export async function changePassword({
  currentPassword,
  newPassword,
  confirmPassword,
}: Omit<ChangePasswordParams, 'role'>) {
  return AuthService.changePassword({
    currentPassword,
    newPassword,
    confirmPassword,
    role: ROLE,
  });
}

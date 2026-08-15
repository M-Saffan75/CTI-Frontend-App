import { ROLES } from '@/constants/roles';

/**
 * Customer auth calls. The role is hardcoded here — the Seller and Repairman
 * copies of this file send their own role, so no screen ever branches on it.
 *
 * These are stubs. When the backend is ready, replace each body with the axios
 * call; the arguments and return shape stay as they are, so screens won't change.
 */

const ROLE = ROLES.CUSTOMER;

const fakeDelay = () =>
  new Promise(resolve => {
    setTimeout(() => resolve(null), 700);
  });

export async function login({ email, password }) {
  await fakeDelay();
  // return api.post('/auth/login', { email, password, role: ROLE });
  return { ok: true, role: ROLE, email, password };
}

export async function register({ name, email, phone, password }) {
  await fakeDelay();
  // return api.post('/auth/register', { name, email, phone, password, role: ROLE });
  return { ok: true, role: ROLE, name, email, phone, password };
}

export async function forgotPassword({ emailOrPhone }) {
  await fakeDelay();
  // return api.post('/auth/forgot-password', { emailOrPhone, role: ROLE });
  return { ok: true, role: ROLE, emailOrPhone };
}

export async function verifyOtp({ otp }) {
  await fakeDelay();
  // return api.post('/auth/verify-otp', { otp, role: ROLE });
  return { ok: true, role: ROLE, otp };
}

export async function resendOtp() {
  await fakeDelay();
  // return api.post('/auth/resend-otp', { role: ROLE });
  return { ok: true, role: ROLE };
}

export async function resetPassword({ password }) {
  await fakeDelay();
  // return api.post('/auth/reset-password', { password, role: ROLE });
  return { ok: true, role: ROLE, password };
}

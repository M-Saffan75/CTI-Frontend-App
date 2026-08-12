const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+\-\s()]{7,15}$/;

export function validateEmail(value) {
  if (!value?.trim()) return 'Email is required';
  if (!EMAIL.test(value.trim())) return 'Enter a valid email';
  return '';
}

export function validateEmailOrPhone(value) {
  if (!value?.trim()) return 'Email or phone is required';
  const input = value.trim();
  if (EMAIL.test(input) || PHONE.test(input)) return '';
  return 'Enter a valid email or phone';
}

export const PASSWORD_MIN = 5;
export const PASSWORD_MAX = 20;

export function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (value.length > PASSWORD_MAX) return `Password cannot be more than ${PASSWORD_MAX} characters`;
  return '';
}

export function validateConfirmPassword(value, password) {
  if (!value) return 'Confirm your password';
  if (value !== password) return 'Passwords do not match';
  return '';
}

export function validateOtp(value, length = 4) {
  if (value.length < length) return `Enter all ${length} digits`;
  return '';
}

/** 0-4. Drives the strength dashes under a password field. */
export function passwordScore(value) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  return score;
}

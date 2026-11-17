import i18n from '@/i18n';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+\-\s()]{7,15}$/;

export function validateName(value) {
  if (!value?.trim()) return i18n.t('validation.nameRequired');
  if (value.trim().length < 2) return i18n.t('validation.nameFull');
  return '';
}

export function validatePhone(value) {
  if (!value?.trim()) return i18n.t('validation.phoneRequired');
  if (!PHONE.test(value.trim())) return i18n.t('validation.phoneInvalid');
  return '';
}

export function validateEmail(value) {
  if (!value?.trim()) return i18n.t('validation.emailRequired');
  if (!EMAIL.test(value.trim())) return i18n.t('validation.emailInvalid');
  return '';
}

export function validateEmailOrPhone(value) {
  if (!value?.trim()) return i18n.t('validation.emailOrPhoneRequired');
  const input = value.trim();
  if (EMAIL.test(input) || PHONE.test(input)) return '';
  return i18n.t('validation.emailOrPhoneInvalid');
}

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 20;

export function validatePassword(value) {
  if (!value) return i18n.t('validation.passwordRequired');
  if (value.length < PASSWORD_MIN) return i18n.t('validation.passwordMin', { count: PASSWORD_MIN });
  if (value.length > PASSWORD_MAX) return i18n.t('validation.passwordMax', { count: PASSWORD_MAX });
  return '';
}

// Login only needs a password, not the length rule of a new one (older accounts may be shorter)
export function validateLoginPassword(value) {
  return value ? '' : i18n.t('validation.passwordRequired');
}

export function validateConfirmPassword(value, password) {
  if (!value) return i18n.t('validation.confirmPassword');
  if (value !== password) return i18n.t('validation.passwordsMismatch');
  return '';
}

export function validateOtp(value, length = 6) {
  if (!value || value.length < length) return i18n.t('validation.otpDigits', { count: length });
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

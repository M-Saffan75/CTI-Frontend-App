import { WithdrawStatus } from '@/roles/Repairman/api/repairmanApi';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

export type WithdrawTone = 'primary' | 'success' | 'error' | 'textMuted';

export const WITHDRAW_FILTERS: { label: string; value: WithdrawStatus | '' }[] =
  [
    { get label() { return i18n.t('customer.all'); }, value: '' },
    { get label() { return i18n.t('repairman.requested'); }, value: 'requested' },
    { get label() { return i18n.t('repairman.processing'); }, value: 'processing' },
    { get label() { return i18n.t('repairman.completed'); }, value: 'completed' },
    { get label() { return i18n.t('repairman.rejected'); }, value: 'rejected' },
  ];

export function withdrawLabel(status: string): string {
  return statusLabel(status);
}

export function withdrawTone(status: string): WithdrawTone {
  if (status === 'completed') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'processing') return 'primary';
  return 'textMuted';
}

// Account number and IBAN are shown with the middle hidden
export function maskValue(
  value: string | null | undefined,
  keepStart: number,
  keepEnd: number,
): string {
  const text = (value || '').trim();
  if (!text) return '';
  if (text.length <= keepStart + keepEnd) return text;
  return `${text.slice(0, keepStart)}${'•'.repeat(
    text.length - keepStart - keepEnd,
  )}${text.slice(-keepEnd)}`;
}

// The backend rule for the IBAN of the bank details: two letters, two digits, then letters or digits
export const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]+$/;

export function parseAmount(text: string): number {
  return Number(text.replace(',', '.').trim());
}

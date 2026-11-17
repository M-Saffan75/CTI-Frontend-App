import i18n from '@/i18n';
import { statusLabel as sharedStatusLabel } from '@/utils/labels';

// Booking status from the backend (snake_case) to the label and colour token shown in the app
export function statusLabel(status?: string): string {
  if (!status) return i18n.t('repairmanMsg.status.unknown');
  return sharedStatusLabel(status);
}

// The job distribution groups come from the backend by name; each keeps its own colour
const DISTRIBUTION_COLORS: Record<string, string> = {
  Confirmed: '#448AFF',
  'In Progress': '#FEA620',
  Scheduled: '#8B5CF6',
  Pending: '#14B8A6',
  Cancelled: '#EE454D',
  Disputed: '#64748B',
  Delivered: '#00A63E',
};

export function distributionColor(name: string): string {
  return DISTRIBUTION_COLORS[name] || '#94A3B8';
}

export type StatusTone = 'success' | 'error' | 'primary' | 'textMuted';

export function statusTone(status?: string): StatusTone {
  if (status === 'completed' || status === 'delivered') return 'success';
  if (status === 'cancelled' || status === 'disputed') return 'error';
  if (status === 'closed') return 'textMuted';
  return 'primary';
}

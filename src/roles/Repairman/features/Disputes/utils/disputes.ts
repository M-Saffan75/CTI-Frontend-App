import {
  DisputeParty,
  DisputeStatus,
  RepairmanDispute,
} from '@/roles/Repairman/api/repairmanApi';
import i18n from '@/i18n';
import { priorityLabel as sharedPriorityLabel, statusLabel as sharedStatusLabel } from '@/utils/labels';

export type Tone = 'primary' | 'success' | 'error' | 'textMuted';

export const STATUS_FILTERS: { label: string; value?: DisputeStatus }[] = [
  { get label() { return i18n.t('customer.all'); } },
  { get label() { return i18n.t('repairman.open'); }, value: 'open' },
  { get label() { return i18n.t('repairman.underReview'); }, value: 'under_review' },
  { get label() { return i18n.t('repairman.pending'); }, value: 'pending' },
  { get label() { return i18n.t('repairman.resolved'); }, value: 'resolved' },
  { get label() { return i18n.t('repairman.closed'); }, value: 'closed' },
];

const words = (value?: string) =>
  (value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

export const categoryLabel = (value?: string) =>
  value ? i18n.t(`dispute.categories.${value}`, { defaultValue: words(value) }) : '';
export const priorityLabel = (value?: string) => sharedPriorityLabel(value);

export function statusLabel(status?: string): string {
  return (
    STATUS_FILTERS.find(item => item.value === status)?.label || sharedStatusLabel(status)
  );
}

export function statusTone(status?: string): Tone {
  if (status === 'resolved') return 'success';
  if (status === 'open' || status === 'under_review') return 'primary';
  return 'textMuted';
}

export function priorityTone(priority?: string): Tone {
  if (priority === 'urgent' || priority === 'high') return 'error';
  return 'textMuted';
}

// The reply endpoint refuses a dispute that is resolved or closed
export const canReply = (dispute: Pick<RepairmanDispute, 'status'>) =>
  dispute.status !== 'resolved' && dispute.status !== 'closed';

// The person on the other side of the dispute is the customer
export function otherParty(dispute: RepairmanDispute): DisputeParty {
  return dispute.raisedBy?.userType === 'customer'
    ? dispute.raisedBy
    : dispute.againstUser;
}

export const raisedByMe = (dispute: RepairmanDispute) =>
  dispute.raisedBy?.userType === 'repairman';

export function bookingIdOf(dispute: RepairmanDispute): string {
  const booking = dispute.bookingId;
  if (!booking) return '';
  return typeof booking === 'string' ? booking : String(booking._id || '');
}

export const resolutionLabel = (value?: string): string =>
  value ? i18n.t(`repairmanMsg.resolution.${value}`, { defaultValue: categoryLabel(value) }) : '';

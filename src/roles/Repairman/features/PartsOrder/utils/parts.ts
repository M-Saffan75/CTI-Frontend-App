import { PartsOrder } from '@/roles/Repairman/api/repairmanApi';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

export type Tone = 'primary' | 'success' | 'error' | 'textMuted';

// The filter values are the ones the backend model accepts
export const ORDER_STATUS_OPTIONS = [
  { get label() { return i18n.t('repairman.pending'); }, value: 'pending' },
  { get label() { return i18n.t('repairman.confirmed'); }, value: 'confirmed' },
  { get label() { return i18n.t('repairman.processing'); }, value: 'processing' },
  { get label() { return i18n.t('repairman.readyForPickup'); }, value: 'ready-for-pickup' },
  { get label() { return i18n.t('repairman.shipped'); }, value: 'shipped' },
  { get label() { return i18n.t('repairman.delivered'); }, value: 'delivered' },
  { get label() { return i18n.t('repairman.cancelled'); }, value: 'cancelled' },
  { get label() { return i18n.t('repairman.returned'); }, value: 'returned' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { get label() { return i18n.t('repairman.pending'); }, value: 'Pending' },
  { get label() { return i18n.t('repairman.partiallyPaid'); }, value: 'Partially Paid' },
  { get label() { return i18n.t('repairman.paid'); }, value: 'Paid' },
  { get label() { return i18n.t('repairman.failed'); }, value: 'Failed' },
  { get label() { return i18n.t('repairman.refunded'); }, value: 'Refunded' },
];

export const SHIPPING_OPTIONS = [
  { get label() { return i18n.t('repairman.pickup'); }, value: 'Pickup' },
  { get label() { return i18n.t('repairman.delivery'); }, value: 'Delivery' },
  { get label() { return i18n.t('repairman.courier'); }, value: 'Courier' },
];

export function orderStatusLabel(status?: string): string {
  const found = ORDER_STATUS_OPTIONS.find(option => option.value === status);
  if (found) return found.label;
  return status ? statusLabel(status) : statusLabel('unknown');
}

export function orderStatusTone(status?: string): Tone {
  if (status === 'delivered') return 'success';
  if (status === 'cancelled' || status === 'returned') return 'error';
  if (status === 'pending') return 'textMuted';
  return 'primary';
}

export function paymentTone(status?: string): Tone {
  if (status === 'Paid') return 'success';
  if (status === 'Failed' || status === 'Refunded') return 'error';
  return 'primary';
}

// The parts can be marked as received once the order is delivered and was not marked before
export const canMarkReceived = (
  order: Pick<PartsOrder, 'orderStatus' | 'isReceived'>,
) => order.orderStatus === 'delivered' && !order.isReceived;

export function formatAddress(address?: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}): string {
  if (!address) return '';
  return [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function shippingLabel(value?: string): string {
  return SHIPPING_OPTIONS.find(option => option.value === value)?.label || String(value || '');
}

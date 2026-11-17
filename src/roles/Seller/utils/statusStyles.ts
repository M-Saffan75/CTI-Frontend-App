import i18n from '@/i18n';
import { upper } from '@/i18n/locale';

export const AMBER = '#F59E0B';

// label is a translation key; getStatusStyle gives the translated text
export interface StatusStyle {
  label: string;
  color: string;
}

type Group = 'order' | 'return' | 'payment' | 'earning' | 'withdraw' | 'ad' | 'invoice' | 'import';

const style = (group: Group, key: string, color: string): StatusStyle => ({
  label: `seller.status.${group}.${key}`,
  color,
});

export const ORDER_STATUS_STYLE: Record<string, StatusStyle> = {
  pending: style('order', 'pending', '#F59E0B'),
  processing: style('order', 'processing', '#3B82F6'),
  shipping: style('order', 'shipping', '#06B6D4'),
  shipped: style('order', 'shipped', '#8B5CF6'),
  delivered: style('order', 'delivered', '#10B981'),
  cancelled: style('order', 'cancelled', '#EF4444'),
};

export const RETURN_STATUS_STYLE: Record<string, StatusStyle> = {
  requested: style('return', 'requested', '#F59E0B'),
  shipped: style('return', 'shipped', '#8B5CF6'),
  approved: style('return', 'approved', '#10B981'),
  rejected: style('return', 'rejected', '#EF4444'),
};

export const PAYMENT_STATUS_STYLE: Record<string, StatusStyle> = {
  PAID: style('payment', 'PAID', '#10B981'),
  PENDING: style('payment', 'PENDING', '#F59E0B'),
  FAILED: style('payment', 'FAILED', '#EF4444'),
  REFUNDED: style('payment', 'REFUNDED', '#3B82F6'),
  NA: style('payment', 'NA', '#6B7280'),
};

export const EARNING_STATUS_STYLE: Record<string, StatusStyle> = {
  pending_release: style('earning', 'pending_release', '#F59E0B'),
  available: style('earning', 'available', '#10B981'),
  withdrawn: style('earning', 'withdrawn', '#8B5CF6'),
};

export const WITHDRAW_STATUS_STYLE: Record<string, StatusStyle> = {
  pending: style('withdraw', 'pending', '#F59E0B'),
  processing: style('withdraw', 'processing', '#3B82F6'),
  completed: style('withdraw', 'completed', '#10B981'),
  rejected: style('withdraw', 'rejected', '#EF4444'),
};

export const AD_STATUS_STYLE: Record<string, StatusStyle> = {
  draft: style('ad', 'draft', '#6B7280'),
  pending_approval: style('ad', 'pending_approval', '#F59E0B'),
  active: style('ad', 'active', '#10B981'),
  paused: style('ad', 'paused', '#F97316'),
  rejected: style('ad', 'rejected', '#EF4444'),
  completed: style('ad', 'completed', '#3B82F6'),
};

export const INVOICE_STATUS_STYLE: Record<string, StatusStyle> = {
  pending_submission: style('invoice', 'pending_submission', '#6B7280'),
  submitted: style('invoice', 'submitted', '#F59E0B'),
  approved: style('invoice', 'approved', '#10B981'),
  rejected: style('invoice', 'rejected', '#EF4444'),
};

export const IMPORT_STATUS_STYLE: Record<string, StatusStyle> = {
  success: style('import', 'success', '#10B981'),
  partial: style('import', 'partial', '#F59E0B'),
  failed: style('import', 'failed', '#EF4444'),
};

// An unknown backend value is shown as it is, so nothing is hidden
export function getStatusStyle(map: Record<string, StatusStyle>, status: string): StatusStyle {
  const hit = map[status];
  if (hit) return { ...hit, label: i18n.t(hit.label) };
  return { label: status || i18n.t('seller.unknown'), color: '#6B7280' };
}

// Enquiry status: open, replied, closed
export const queryStatusLabel = (status: string): string =>
  i18n.t(`seller.status.query.${status}`, { defaultValue: status });

// Who cancelled an order: user, seller, system, admin
export const cancelledByLabel = (value?: string | null): string =>
  value ? i18n.t(`seller.cancelledBy.${value}`, { defaultValue: value }) : '';

// credit_card -> "Credit card"; an unknown method is shown as received, without underscores
export const paymentMethodLabel = (value?: string | null): string =>
  value ? i18n.t(`seller.paymentMethod.${value}`, { defaultValue: value.replace(/_/g, ' ') }) : '';

// TOPUP, SALE_PROCEED ... in capital letters for the small pill on a wallet transaction
export const transactionTypeLabel = (type?: string | null): string =>
  upper(
    i18n.t(`seller.txType.${type || 'transaction'}`, {
      defaultValue: String(type || '').replace(/_/g, ' '),
    }),
  );

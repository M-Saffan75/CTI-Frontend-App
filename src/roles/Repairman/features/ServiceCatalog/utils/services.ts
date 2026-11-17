import { RepairmanService } from '@/roles/Repairman/api/repairmanApi';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

export type Tone = 'primary' | 'success' | 'error' | 'textMuted';

export const STATUS_FILTERS = [
  { get label() { return i18n.t('customer.all'); }, value: undefined },
  { get label() { return i18n.t('repairman.pending'); }, value: 'pending' },
  { get label() { return i18n.t('repairman.approved'); }, value: 'approved' },
  { get label() { return i18n.t('repairman.rejected'); }, value: 'rejected' },
] as const;

export function serviceTypeLabel(type?: string): string {
  if (type === 'home' || type === 'shop' || type === 'pickup') return i18n.t(`repairmanMsg.svcType.${type}`);
  return type || '';
}

export function approvalLabel(status?: string): string {
  return status ? statusLabel(status) : '';
}

export function approvalTone(status?: string): Tone {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  return 'textMuted';
}

// Same rules as the web: an approved service is live, so it can only be switched on or off
export const canEditService = (service: Pick<RepairmanService, 'status'>) =>
  service.status !== 'approved';
export const canDeleteService = canEditService;
// The backend only allows the switch for approved services
export const canToggleService = (service: Pick<RepairmanService, 'status'>) =>
  service.status === 'approved';

export const serviceDevice = (service: RepairmanService) =>
  [service.deviceInfo?.brandId?.name, service.deviceInfo?.modelId?.name]
    .filter(Boolean)
    .join(' ');

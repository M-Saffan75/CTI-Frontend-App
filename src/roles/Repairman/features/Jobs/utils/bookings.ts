import { MyBooking, MyBookingJob } from '@/roles/Repairman/api/repairmanApi';
import i18n from '@/i18n';
import { serviceTypeLabel as sharedServiceTypeLabel } from '@/utils/labels';

// The tabs of the web My Jobs page: each one is a group of booking statuses
export type JobsTabKey =
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'closed';

export const JOB_TABS: {
  key: JobsTabKey;
  label: string;
  statuses: string[];
}[] = [
  {
    key: 'active',
    get label() { return i18n.t('repairman.active'); },
    statuses: [
      'confirmed',
      'repairman_notified',
      'scheduled',
      'in_progress',
      'parts_needed',
      'quality_check',
    ],
  },
  {
    key: 'completed',
    get label() { return i18n.t('repairman.completed'); },
    statuses: ['completed', 'delivered'],
  },
  { key: 'cancelled', get label() { return i18n.t('repairman.cancelled'); }, statuses: ['cancelled'] },
  { key: 'disputed', get label() { return i18n.t('customer.disputed'); }, statuses: ['disputed'] },
  { key: 'closed', get label() { return i18n.t('repairman.closed'); }, statuses: ['closed'] },
];

const nameOf = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (value as { name?: string }).name || '';
};

export function bookingDevice(job: MyBookingJob | null | undefined): string {
  const device = [
    nameOf(job?.deviceInfo?.brand),
    nameOf(job?.deviceInfo?.model),
  ]
    .filter(Boolean)
    .join(' ');
  return device || job?.title || i18n.t('repairman.repairJob');
}

export function bookingServices(
  job: MyBookingJob | null | undefined,
): string[] {
  return (job?.services || []).map(service => nameOf(service)).filter(Boolean);
}

// The web turns a number into low, medium or high; the backend now sends the word
export function bookingUrgency(
  booking: Pick<MyBooking, 'isQuotationBased'> & {
    jobDetails: MyBookingJob | null;
  },
): string {
  if (booking.isQuotationBased) return 'medium';
  const value = booking.jobDetails?.urgency;
  if (typeof value === 'string') return value;
  if (typeof value === 'number')
    return value >= 3 ? 'high' : value >= 2 ? 'medium' : 'low';
  return 'medium';
}

export function serviceTypeLabel(type?: string): string {
  return type ? sharedServiceTypeLabel(type) : '';
}

export function matchesBookingSearch(
  booking: MyBooking,
  term: string,
): boolean {
  const text = term.trim().toLowerCase();
  if (!text) return true;
  const job = booking.jobDetails;
  return (
    bookingDevice(job).toLowerCase().includes(text) ||
    (job?.description || '').toLowerCase().includes(text) ||
    (booking.customer?.name || '').toLowerCase().includes(text) ||
    bookingServices(job).some(service => service.toLowerCase().includes(text))
  );
}

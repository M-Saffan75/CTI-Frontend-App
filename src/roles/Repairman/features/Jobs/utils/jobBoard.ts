import { BoardJob, JobOfferInfo, JobUrgency } from '@/roles/Repairman/api/repairmanApi';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

export const PRIORITY_OPTIONS: { label: string; value: JobUrgency }[] = [
  { get label() { return i18n.t('repairman.urgentPriority'); }, value: 'urgent' },
  { get label() { return i18n.t('repairman.highPriority'); }, value: 'high' },
  { get label() { return i18n.t('repairman.mediumPriority'); }, value: 'medium' },
  { get label() { return i18n.t('repairman.lowPriority'); }, value: 'low' },
];

export function urgencyLabel(urgency?: string): string {
  const found = PRIORITY_OPTIONS.find(option => option.value === urgency);
  return found ? found.label : i18n.t('repairman.mediumPriority');
}

export function isExpired(job: BoardJob): boolean {
  return Boolean(job.expiresAt) && new Date(job.expiresAt as string).getTime() <= Date.now();
}

// What the job board shows as the job status. The backend list has no flag for "open", so it is worked out
// with the same rules the backend uses when it accepts an offer.
export function jobStatusLabel(job: BoardJob): string {
  if (isExpired(job)) return statusLabel('expired');
  if (isJobAvailable(job)) return statusLabel('available');
  return statusLabel(job.status);
}

export const isJobAvailable = (job: BoardJob): boolean =>
  !isExpired(job) && (job.status === 'open' || job.status === 'offers_received');

export interface ProposalAccess {
  allowed: boolean;
  reason: string;
}

// The proposal button is shown only when the backend will accept the offer (POST /repairman/offers/jobs/:id/offer):
// the job is open or has offers, it has not expired, it is not full, and this repairman has no offer on it yet.
// info is null when GET /repairman/offers/jobs/:id answered 404 (the job no longer takes offers).
export function getProposalAccess(job: BoardJob, info: JobOfferInfo | null): ProposalAccess {
  if (!info) return { allowed: false, reason: i18n.t('repairmanMsg.proposal.closed') };
  if (info.repairmanStatus.hasSubmittedOffer) {
    return { allowed: false, reason: i18n.t('repairmanMsg.proposal.sent') };
  }
  if (!job.expiresAt || isExpired(job)) {
    return { allowed: false, reason: i18n.t('repairmanMsg.proposal.expired') };
  }
  if (info.competition.totalOffers >= (job.maxOffers ?? 10)) {
    return { allowed: false, reason: i18n.t('repairmanMsg.proposal.full') };
  }
  if (!info.repairmanStatus.canSubmitOffer) {
    return { allowed: false, reason: i18n.t('repairmanMsg.proposal.notAllowed') };
  }
  return { allowed: true, reason: '' };
}

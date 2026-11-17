import { MyOffer } from '@/roles/Repairman/api/repairmanApi';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

// Status filter of the web My Offers page (the backend default list leaves out withdrawn offers)
export const OFFER_STATUS_OPTIONS = [
  { get label() { return i18n.t('repairman.pending'); }, value: 'pending' },
  { get label() { return i18n.t('repairman.accepted'); }, value: 'accepted' },
  { get label() { return i18n.t('repairman.confirmed'); }, value: 'confirmed' },
  { get label() { return i18n.t('repairman.rejected'); }, value: 'rejected' },
  { get label() { return i18n.t('repairman.withdrawn'); }, value: 'withdrawn' },
];

export type OfferTone = 'primary' | 'success' | 'error' | 'textMuted';

export function isOfferExpired(offer: MyOffer): boolean {
  return (
    offer.status === 'expired' ||
    (Boolean(offer.isExpired) && offer.status === 'pending')
  );
}

export function offerStatusLabel(offer: MyOffer): string {
  if (isOfferExpired(offer)) return statusLabel('expired');
  // the backend word "accepted" means the customer accepted and the repairman still has to confirm
  if (offer.status === 'accepted') return statusLabel('accepted_by_customer');
  return statusLabel(offer.status);
}

export function offerTone(offer: MyOffer): OfferTone {
  if (isOfferExpired(offer)) return 'textMuted';
  if (offer.status === 'accepted' || offer.status === 'confirmed')
    return 'success';
  if (offer.status === 'rejected') return 'error';
  if (offer.status === 'withdrawn') return 'textMuted';
  return 'primary';
}

// The backend withdraws only pending offers (DELETE /repairman/offers/:id), and the website edits only those too
// The detail request (GET my-offers/:id) does not answer for withdrawn offers, so those have no detail screen
export const canWithdrawOffer = (offer: MyOffer) =>
  offer.status === 'pending' && !offer.isExpired;

export const canOpenOffer = (offer: MyOffer) => offer.status !== 'withdrawn';

export function offerTitle(offer: MyOffer): string {
  const device = [
    offer.jobId?.deviceInfo?.brand,
    offer.jobId?.deviceInfo?.model,
  ]
    .filter(Boolean)
    .join(' ');
  return device || offer.jobId?.title || i18n.t('repairman.repairJob');
}

import apiClient from '@/services/apiClient';
import { formatMoney } from '@/utils/money';
import i18n from '@/i18n';
import { Msg, statusLabel } from '@/utils/labels';

export interface MobileCustomerJob {
  id: string;
  device: Msg;
  priceMin: number;
  priceMax: number;
  tag: 'job_posting' | 'direct_message';
  offerLabel: string;
  offerConfirmed: boolean;
  description: string;
  status: string; // 'open' | 'offer_received' | 'booked' | 'in_progress' | 'completed' | 'disputed'
  services: string[];
  requiredServices: string[];
  date: string;
  offersCount: number;
  assignedTo?: string;
  expiresAt?: string;
  bookingId?: string;
  raw?: any;
}

export interface NormalizedOffer {
  id: string;
  repairmanId: string;
  repairmanName: Msg;
  shopName: string;
  rating: number;
  totalJobs: number;
  successRate: number;
  basePrice: number;
  partsEstimate: number;
  totalPrice: number;
  pickupAvailable: boolean;
  pickupCharge: number;
  finalTotal: number;
  homeService: boolean;
  dropOffLocation: string;
  warrantyLabel: Msg;
  timeLabel: Msg;
  startLabel: Msg;
  currency: string;
  description: Msg;
  status: string;
  partsQuality: string;
  requiredParts: Array<{
    id: string;
    name: Msg;
    price: number;
    image?: string | null;
    condition?: string;
  }>;
  raw: any;
}

export interface MobileJobDetail {
  id: string;
  tag: 'job_posting' | 'direct_message';
  status: string;
  title: Msg;
  chips: string[];
  priceLabel: string;
  urgencyNote: Msg;
  description: Msg;
  services: Msg[];
  locationNote: Msg;
  locationLabel: Msg;
  servicePreference: string;
  stats: Array<{ label: Msg; value: Msg }>;
  createdAt: Msg;
  offers: NormalizedOffer[];
  selectedOffer?: NormalizedOffer | null;
  booking?: any;
  repairman?: any;
  quotation?: any;
  dispute?: any;
  raw?: any;
}

export function resolveServiceName(rawService: any): string {
  if (!rawService) return '';
  if (typeof rawService === 'object' && rawService !== null) {
    if (rawService.name) return String(rawService.name);
    if (rawService.title) return String(rawService.title);
  }
  const str = String(rawService).trim();
  // A bare id is not a name a person can read: show nothing instead of the code
  if (/^[0-9a-fA-F]{24}$/.test(str)) return '';
  return str;
}

export function mapBackendJobToMobile(raw: any): MobileCustomerJob {
  if (!raw) {
    return {
      id: '',
      device: { key: 'customer.deviceRepair' },
      priceMin: 0,
      priceMax: 0,
      tag: 'job_posting',
      offerLabel: statusLabel('pending'),
      offerConfirmed: false,
      description: '',
      status: 'open',
      services: [],
      requiredServices: [],
      date: '',
      offersCount: 0,
    };
  }

  const isQuotation = raw.bookingSource === 'direct_message';
  const deviceInfo = isQuotation ? raw.quotationId?.deviceInfo : raw.deviceInfo;

  const brandName =
    typeof deviceInfo?.brand === 'object' && deviceInfo?.brand !== null
      ? deviceInfo.brand.name || ''
      : typeof deviceInfo?.brand === 'string'
      ? deviceInfo.brand
      : '';

  const modelName =
    typeof deviceInfo?.model === 'object' && deviceInfo?.model !== null
      ? deviceInfo.model.name || ''
      : typeof deviceInfo?.model === 'string'
      ? deviceInfo.model
      : '';

  const deviceTitle: Msg =
    [brandName, modelName].filter(Boolean).join(' ') ||
    raw.title ||
    raw.quotationId?.title || { key: 'customer.deviceRepair' };

  // Budget
  let priceMin = 0;
  let priceMax = 0;
  if (isQuotation) {
    const total = Number(
      raw.bookingDetails?.pricing?.totalAmount ||
        raw.quotationId?.estimatedCost ||
        raw.pricing?.totalAmount ||
        0,
    );
    priceMin = total;
    priceMax = total;
  } else {
    const budgetObj = raw.preferredBudget || raw.budget || {};
    priceMin = Number(budgetObj.min || raw.estimatedCost?.min || raw.budget || 0);
    priceMax = Number(budgetObj.max || raw.estimatedCost?.max || priceMin || 0);
  }

  // Status mapping - align with Next.js status mapping
  const rawStatus = String(
    isQuotation ? raw.bookingStatus || raw.status || 'open' : raw.status || raw.bookingStatus || 'open',
  ).toLowerCase();

  let status = 'open';
  if (rawStatus.includes('dispute')) {
    status = 'disputed';
  } else if (
    rawStatus === 'completed' ||
    rawStatus === 'delivered' ||
    rawStatus === 'closed'
  ) {
    status = 'completed';
  } else if (
    rawStatus === 'in_progress' ||
    rawStatus === 'parts_needed' ||
    rawStatus === 'quality_check'
  ) {
    status = 'in_progress';
  } else if (
    rawStatus === 'booked' ||
    rawStatus === 'confirmed' ||
    rawStatus === 'scheduled' ||
    rawStatus === 'repairman_notified'
  ) {
    status = 'booked';
  } else if (
    rawStatus === 'offers_received' ||
    rawStatus === 'offer_received' ||
    rawStatus.includes('offer')
  ) {
    status = 'offers_received';
  } else if (rawStatus === 'open' || rawStatus.includes('open')) {
    status = 'open';
  } else {
    status = rawStatus;
  }

  // Services
  let rawServices = raw.services;
  if (isQuotation && (!rawServices || rawServices.length === 0)) {
    rawServices = deviceInfo?.repairServices || raw.quotationId?.requiredParts || [];
  }
  const servicesList: string[] = Array.isArray(rawServices)
    ? rawServices.map(resolveServiceName).filter(Boolean)
    : [];

  const createdDate = raw.createdAt ? String(raw.createdAt) : '';

  const assignedTo =
    raw.repairman?.name ||
    raw.repairmanId?.name ||
    raw.selectedOffer?.repairmanId?.name ||
    raw.latestOffer?.repairmanId?.name ||
    undefined;

  return {
    id: String(raw._id || raw.id || ''),
    device: deviceTitle,
    priceMin,
    priceMax,
    tag: isQuotation ? 'direct_message' : 'job_posting',
    offerConfirmed: Boolean(
      raw.selectedOffer || isQuotation || status === 'booked' || status === 'in_progress' || status === 'completed',
    ),
    offerLabel: statusLabel(
      raw.selectedOffer || isQuotation || status === 'booked' || status === 'in_progress' || status === 'completed'
        ? 'confirmed'
        : 'pending',
    ),
    description: typeof raw.description === 'string' ? raw.description.trim() : (raw.quotationId?.description || ''),
    status,
    services: servicesList,
    requiredServices: servicesList,
    date: createdDate,
    offersCount: Number(raw.offersCount || 0),
    bookingId: raw.bookingId ? String(raw.bookingId) : undefined,
    assignedTo,
    raw,
  };
}

export function normalizeOffer(offer: any): NormalizedOffer | null {
  if (!offer || typeof offer === 'string') return null;

  // 1. Repairman Info
  const repairman = offer.repairmanId || offer.repairman || {};
  const profile = repairman.repairmanProfile || offer.repairmanProfile || {};
  const repairmanName: Msg =
    typeof repairman === 'object' && repairman !== null
      ? repairman.name || { key: 'chat.technician' }
      : { key: 'chat.technician' };

  const shopName = profile.shopName || '';
  const rating = Number(profile.rating || 0);
  const totalJobs = Number(profile.totalJobs || 0);
  const successRate = Number(offer.experience?.successRate || 0);

  // 2. Pricing
  const pricing = offer.pricing || {};
  const basePrice = Number(pricing.basePrice || offer.price || 0);
  const partsEstimate = Number(pricing.partsEstimate || 0);
  const totalPrice = Number(pricing.totalPrice || (basePrice + partsEstimate));
  const currency = String(pricing.currency || 'TRY');

  // 3. Service Options & Pickup
  const serviceOptions = offer.serviceOptions || {};
  const pickupAvailable = Boolean(serviceOptions.pickupAvailable);
  const pickupCharge = Number(serviceOptions.pickupCharge || 0);
  const homeService = Boolean(serviceOptions.homeService);
  const dropOffLocation = typeof serviceOptions.dropOffLocation === 'string' ? serviceOptions.dropOffLocation : '';
  const finalTotal = totalPrice + (pickupAvailable ? pickupCharge : 0);

  // 4. Warranty - CRITICAL: Always ensure string to prevent React Native crash
  let warrantyLabel: Msg = { key: 'customerMsg.warranty30' };
  if (typeof offer.warranty === 'string' && offer.warranty.trim()) {
    warrantyLabel = offer.warranty.trim();
  } else if (typeof offer.warranty === 'object' && offer.warranty !== null) {
    if (offer.warranty.duration) {
      warrantyLabel = { key: 'customerMsg.warrantyDaysLabel', params: { days: offer.warranty.duration } };
    } else if (offer.warranty.description) {
      warrantyLabel = String(offer.warranty.description);
    }
  }

  // 5. Estimated Time
  let timeLabel: Msg = { key: 'customerMsg.sameDay' };
  if (offer.estimatedTime) {
    if (typeof offer.estimatedTime === 'object' && offer.estimatedTime !== null) {
      const val = offer.estimatedTime.value || '';
      const unit = offer.estimatedTime.unit || 'hours';
      timeLabel = val ? { key: 'customerMsg.timeValue', params: { value: val, unit } } : { key: 'customerMsg.sameDay' };
    } else if (typeof offer.estimatedTime === 'string') {
      timeLabel = offer.estimatedTime;
    }
  }

  // 6. Start date / availability
  let startLabel: Msg = { key: 'customerMsg.availableNow' };
  if (offer.availability?.canStartBy) {
    startLabel = { date: String(offer.availability.canStartBy), style: 'short' };
  }

  // 7. Status
  const statusStr = typeof offer.status === 'string' ? offer.status : 'pending';

  // 8. Required Parts
  const requiredParts = Array.isArray(offer.requiredParts)
    ? offer.requiredParts.map((p: any, partIdx: number) => ({
        id: String(p._id || p.id || `part-${partIdx}`),
        name: p.name ? String(p.name) : { key: 'customer.replacementPart' },
        price: Number(p.price || 0),
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : null,
        condition: typeof p.condition === 'string' ? p.condition : '',
      }))
    : [];

  const repairmanIdStr =
    typeof repairman === 'object' && repairman !== null
      ? String(repairman._id || repairman.id || '')
      : String(repairman || '');

  return {
    id: String(offer._id || offer.id || ''),
    repairmanId: repairmanIdStr,
    repairmanName,
    shopName,
    rating,
    totalJobs,
    successRate,
    basePrice,
    partsEstimate,
    totalPrice,
    pickupAvailable,
    pickupCharge,
    finalTotal,
    homeService,
    dropOffLocation,
    warrantyLabel,
    timeLabel,
    startLabel,
    currency,
    description: typeof offer.description === 'string' ? offer.description : '',
    status: statusStr,
    partsQuality: typeof pricing.partsQuality === 'string' ? pricing.partsQuality : '',
    requiredParts,
    raw: offer,
  };
}

export function mapBackendJobDetail(
  raw: any,
  offersList: any[] = [],
  payload?: any,
): MobileJobDetail {
  const brandName =
    typeof raw?.deviceInfo?.brand === 'object' && raw?.deviceInfo?.brand !== null
      ? raw.deviceInfo.brand.name || ''
      : typeof raw?.deviceInfo?.brand === 'string'
      ? raw.deviceInfo.brand
      : '';

  const modelName =
    typeof raw?.deviceInfo?.model === 'object' && raw?.deviceInfo?.model !== null
      ? raw.deviceInfo.model.name || ''
      : typeof raw?.deviceInfo?.model === 'string'
      ? raw.deviceInfo.model
      : '';

  const title: Msg = [brandName, modelName].filter(Boolean).join(' ') || raw?.title || { key: 'customer.deviceRepairJob' };

  const budgetObj = raw?.preferredBudget || raw?.budget || {};
  const priceMin = Number(budgetObj.min || raw?.estimatedCost?.min || 0);
  const priceMax = Number(budgetObj.max || raw?.estimatedCost?.max || priceMin);
  const priceLabel =
    priceMin === priceMax
      ? formatMoney(priceMin)
      : `${formatMoney(priceMin)} - ${formatMoney(priceMax)}`;

  const servicesList: string[] = Array.isArray(raw?.services)
    ? raw.services.map(resolveServiceName).filter(Boolean)
    : [];

  const locationCity =
    typeof raw?.location?.city === 'object' && raw?.location?.city !== null
      ? raw.location.city.name
      : typeof raw?.location?.city === 'string'
      ? raw.location.city
      : '';

  const locationState =
    typeof raw?.location?.state === 'object' && raw?.location?.state !== null
      ? raw.location.state.name
      : typeof raw?.location?.state === 'string'
      ? raw.location.state
      : '';

  const locationParts = [locationCity, locationState].filter(Boolean);
  const locationLabel: Msg = locationParts.join(', ') || { key: 'customer.localService' };

  const statusStr = String(raw?.status || 'open');
  const urgency = String(raw?.urgency || 'normal');
  // raw words; the screen shows them with chipLabel() in the app language
  const chips = [statusStr, urgency, 'job_posting'];

  let selectedOffer =
    payload?.selectedOffer && typeof payload.selectedOffer === 'object'
      ? normalizeOffer(payload.selectedOffer)
      : raw?.selectedOffer && typeof raw.selectedOffer === 'object'
      ? normalizeOffer(raw.selectedOffer)
      : null;

  // Synthesize selectedOffer from booking or job status if missing
  const isPostOpenState = ['booked', 'in_progress', 'completed', 'delivered'].includes(statusStr.toLowerCase());
  if (!selectedOffer && (payload?.booking || raw?.booking || isPostOpenState)) {
    const b = payload?.booking || raw?.booking || {};
    const bd = b.bookingDetails || {};
    const bp = bd.pricing || {};
    const bw = bd.warranty || {};
    const rep =
      typeof b.repairmanId === 'object' && b.repairmanId !== null
        ? b.repairmanId
        : raw?.repairman || payload?.repairman || {};
    const repProfile = rep.repairmanProfile || {};

    selectedOffer = {
      id: String(b.offerId || b._id || 'booking-offer'),
      repairmanId: String(rep._id || rep.id || b.repairmanId || 'rep-tech'),
      repairmanName: rep.name || { key: 'chat.technician' },
      shopName: repProfile.shopName || '',
      rating: Number(repProfile.rating || 0),
      totalJobs: Number(repProfile.totalJobs || 0),
      successRate: Number(b.experience?.successRate || 0),
      basePrice: Number(bp.basePrice || bp.totalAmount || priceMin || 0),
      partsEstimate: Number(bp.partsPrice || 0),
      totalPrice: Number(bp.totalAmount || priceMin || 0),
      pickupAvailable: bd.serviceType === 'pickup',
      pickupCharge: Number(bp.serviceCharge || 0),
      finalTotal: Number(bp.totalAmount || priceMin || 0),
      homeService: bd.serviceType === 'home-service',
      dropOffLocation: typeof bd.location?.address === 'string' ? bd.location.address : locationLabel,
      warrantyLabel: bw.duration
        ? { key: 'customerMsg.warrantyDaysLabel', params: { days: bw.duration } }
        : typeof bw === 'string'
        ? bw
        : { key: 'customerMsg.warranty30' },
      timeLabel: { key: 'customerMsg.standardService' },
      startLabel: bd.scheduledDate
        ? { date: String(bd.scheduledDate), style: 'short' }
        : { key: 'customerMsg.status.scheduled' },
      currency: bp.currency || 'TRY',
      description: { key: 'customer.acceptedOfferProposalAndConfirmed' },
      status: 'accepted',
      partsQuality: '',
      requiredParts: [],
      raw: b,
    };
  }

  const normalizedOffers: NormalizedOffer[] = (offersList || [])
    .map(normalizeOffer)
    .filter(Boolean) as NormalizedOffer[];

  // Ensure selectedOffer is included in offers list so Tab 2 is never empty when an offer was selected
  if (selectedOffer && !normalizedOffers.some(o => o.id === selectedOffer.id)) {
    normalizedOffers.unshift(selectedOffer);
  }

  const bookingRepairman =
    typeof payload?.booking?.repairmanId === 'object' && payload?.booking?.repairmanId !== null
      ? payload.booking.repairmanId
      : null;

  const disputeRepairman =
    payload?.dispute?.againstUser?.userType === 'repairman'
      ? payload?.dispute?.againstUser?.userId
      : payload?.dispute?.raisedBy?.userType === 'repairman'
      ? payload?.dispute?.raisedBy?.userId
      : null;

  const repairman =
    payload?.repairman ||
    bookingRepairman ||
    (selectedOffer
      ? {
          id: selectedOffer.repairmanId,
          name: selectedOffer.repairmanName,
          shopName: selectedOffer.shopName,
          rating: selectedOffer.rating,
          totalJobs: selectedOffer.totalJobs,
          city: '',
        }
      : null) ||
    (payload?.booking?.repairmanId
      ? {
          id: String(payload.booking.repairmanId),
          name: 'Technician',
          shopName: '',
          rating: 0,
          totalJobs: 0,
          city: '',
        }
      : null) ||
    (disputeRepairman
      ? {
          id: disputeRepairman._id || disputeRepairman.id,
          name: disputeRepairman.name,
          phone: disputeRepairman.phone,
          avatar: disputeRepairman.avatar,
        }
      : null);

  let normalizedBooking = payload?.booking || null;
  if (!normalizedBooking && (raw?.booking || raw?.bookingId || isPostOpenState)) {
    normalizedBooking = raw?.booking || {
      _id: raw?.bookingId || raw?._id || 'booking',
      status: raw?.status || 'booked',
    };
  }
  if (normalizedBooking) {
    const bd = normalizedBooking.bookingDetails || {};
    const bp = bd.pricing || {};
    normalizedBooking = {
      ...normalizedBooking,
      status: normalizedBooking.status || raw?.status || 'booked',
      bookingDetails: {
        ...bd,
        serviceType: bd.serviceType || raw?.servicePreference || 'drop-off',
        scheduledDate: bd.scheduledDate || null,
        pricing: {
          basePrice: Number(bp.basePrice || selectedOffer?.basePrice || 0),
          partsPrice: Number(bp.partsPrice || selectedOffer?.partsEstimate || 0),
          serviceCharge: Number(bp.serviceCharge || selectedOffer?.pickupCharge || 0),
          totalAmount: Number(bp.totalAmount || selectedOffer?.finalTotal || priceMin || 0),
          currency: bp.currency || selectedOffer?.currency || 'TRY',
        },
        warranty:
          bd.warranty ||
          (selectedOffer?.warrantyLabel ? { description: selectedOffer.warrantyLabel } : undefined),
        location: bd.location || { address: locationLabel },
      },
      repairman:
        repairman ||
        (normalizedBooking.repairmanId
          ? {
              id: String(normalizedBooking.repairmanId),
              name: 'Technician',
              shopName: '',
              rating: 0,
            }
          : null),
    };
  }

  return {
    id: String(raw?._id || raw?.id || ''),
    tag: 'job_posting',
    status: statusStr,
    title,
    chips,
    priceLabel,
    urgencyNote: raw?.urgency
      ? { key: 'customerMsg.priorityIs', params: { priority: String(raw.urgency) } }
      : { key: 'customerMsg.standardPriority' },
    description: typeof raw?.description === 'string' ? raw.description : { key: 'customer.noDescriptionProvided' },
    services: servicesList,
    locationNote: { key: 'customerMsg.dropOffNote' },
    locationLabel,
    servicePreference: raw?.servicePreference || raw?.serviceType || 'drop-off',
    stats: [
      { label: { key: 'customer.totalOffers' }, value: String(normalizedOffers.length || raw?.offersCount || '0') },
      { label: { key: 'customer.status' }, value: { key: 'customerMsg.statusValue', params: { status: statusStr } } },
      ...(raw?.maxOffers ? [{ label: { key: 'customer.maxOffers' } as Msg, value: String(raw.maxOffers) as Msg }] : []),
    ],
    createdAt: raw?.createdAt ? { date: String(raw.createdAt) } : '',
    offers: normalizedOffers,
    selectedOffer,
    booking: normalizedBooking,
    repairman,
    quotation: null,
    dispute: payload?.dispute || null,
    raw,
  };
}

export function mapBackendQuotationDetail(payload: any): MobileJobDetail {
  const quotation = payload?.quotation || payload?.booking?.quotationId || {};
  const booking = payload?.booking || {};
  const repairman = payload?.repairman || booking?.repairmanId || {};

  const brandName =
    typeof quotation?.deviceInfo?.brand === 'object' && quotation?.deviceInfo?.brand !== null
      ? quotation.deviceInfo.brand.name || ''
      : typeof quotation?.deviceInfo?.brand === 'string'
      ? quotation.deviceInfo.brand
      : typeof quotation?.deviceInfo?.brandName === 'string'
      ? quotation.deviceInfo.brandName
      : '';

  const modelName =
    typeof quotation?.deviceInfo?.model === 'object' && quotation?.deviceInfo?.model !== null
      ? quotation.deviceInfo.model.name || ''
      : typeof quotation?.deviceInfo?.model === 'string'
      ? quotation.deviceInfo.model
      : typeof quotation?.deviceInfo?.modelName === 'string'
      ? quotation.deviceInfo.modelName
      : '';

  const title: Msg = [brandName, modelName].filter(Boolean).join(' ') || { key: 'customer.deviceRepairQuotation' };

  const total = Number(
    booking?.bookingDetails?.pricing?.totalAmount ||
      quotation?.pricing?.totalAmount ||
      quotation?.estimatedCost ||
      0,
  );
  const priceLabel = formatMoney(total);

  let rawServices = quotation?.deviceInfo?.repairServices || quotation?.requiredParts || [];
  const servicesList: Msg[] = Array.isArray(rawServices)
    ? rawServices.map((s: any): Msg => (typeof s === 'string' ? s : s?.name || s?.title || { key: 'customer.repairService' }))
    : [];

  const statusStr = String(booking?.status || quotation?.status || 'booked');
  const chips = [statusStr, 'direct_message'];

  const repairmanProfile = repairman?.repairmanProfile || {};
  const shopName = repairmanProfile?.shopName || '';
  const rating = Number(repairmanProfile?.rating || 0);

  return {
    id: String(booking?._id || quotation?._id || payload?._id || ''),
    tag: 'direct_message',
    status: statusStr,
    title,
    chips,
    priceLabel,
    urgencyNote: { key: 'customerMsg.directQuoteNote' },
    description: typeof quotation?.repairmanNotes === 'string' ? quotation.repairmanNotes : { key: 'customer.directQuotationRepairJob' },
    services: servicesList,
    locationNote: { key: 'customerMsg.dropOffNote' },
    locationLabel: repairmanProfile?.city || { key: 'customer.localTechnician' },
    servicePreference: quotation?.serviceDetails?.serviceType || 'drop-off',
    stats: [
      { label: { key: 'customer.bookingId' }, value: String(booking?._id || '').slice(-6).toUpperCase() || { key: 'customerMsg.direct' } },
      { label: { key: 'customer.status' }, value: { key: 'customerMsg.statusValue', params: { status: statusStr } } },
      { label: { key: 'chat.technician' }, value: repairman?.name || { key: 'customer.assignedTech' } },
      { label: { key: 'customer.shop' }, value: shopName },
    ],
    createdAt:
      quotation?.sentAt || booking?.createdAt
        ? { date: String(quotation?.sentAt || booking?.createdAt) }
        : { key: 'customerMsg.recent' },
    offers: [],
    selectedOffer: null,
    booking,
    repairman: {
      id: String(repairman?._id || repairman?.id || ''),
      name: repairman?.name || '',
      shopName,
      rating,
      phone: repairman?.phone || '',
      avatar: repairman?.avatar || null,
      city: repairmanProfile?.city || '',
    },
    quotation,
    dispute: payload?.dispute || null,
    raw: payload,
  };
}

export const customerJobApi = {
  /**
   * 1. Get Customer's posted repair jobs
   */
  async getMyJobs(params?: { status?: string; page?: number; limit?: number }): Promise<MobileCustomerJob[]> {
    const limit = params?.limit || 50;
    const fetchPage = async (page: number) => {
      const res = await apiClient.get('/repair-jobs/my-jobs', { params: { ...params, page, limit } });
      const rawJobs = res.data?.data?.jobs || res.data?.jobs || res.data?.data;
      return Array.isArray(rawJobs) ? rawJobs.map(mapBackendJobToMobile) : [];
    };
    if (params?.page) return fetchPage(params.page);
    // all pages (the backend sends 50 per page); a failed request throws
    const all: MobileCustomerJob[] = [];
    for (let page = 1; page <= 10; page++) {
      const items = await fetchPage(page);
      all.push(...items);
      if (items.length < limit) break;
    }
    return all;
  },

  /**
   * 2. Get Single Repair Job Details
   */
  async getMyJobDetail(jobId: string): Promise<MobileJobDetail | null> {
    if (!jobId) return null;

    try {
      const res = await apiClient.get(`/repair-jobs/my-jobs/${jobId}`);
      const payload = res.data?.data || res.data;
      if (!payload) return null;

      const type = payload.type || (payload.bookingSource === 'direct_message' ? 'quotation_booking' : 'job_posting');

      if (type === 'quotation_booking') {
        return mapBackendQuotationDetail(payload);
      }

      const job = payload.job || payload;
      let offers = payload.offers || [];

      // If selectedOffer exists
      if (payload.selectedOffer) {
        offers = [payload.selectedOffer];
      } else if (job.selectedOffer) {
        offers = [job.selectedOffer];
      }

      // If offers still empty and job status is open or offers_received, fetch from /offers endpoint
      if (offers.length === 0 && ['open', 'offers_received'].includes(job.status)) {
        try {
          const offersRes = await apiClient.get(`/repair-jobs/my-jobs/${jobId}/offers`);
          const fetched = offersRes.data?.data?.offers || offersRes.data?.offers;
          if (Array.isArray(fetched) && fetched.length > 0) {
            offers = fetched;
          }
        } catch {
          // ignore fallback error
        }
      }

      return mapBackendJobDetail(job, Array.isArray(offers) ? offers : [], payload);
    } catch (err: any) {
      // no connection or a server failure is not "job not found": the screen offers a retry
      if (err?.isNetworkError || err?.isTimeout || (err?.status && err.status >= 500)) throw err;
      return null;
    }
  },

  /**
   * 3. Get Offers for a Job
   */
  /**
   * 6. Send Response to a Dispute
   */
  async sendDisputeResponse(disputeId: string, message: string): Promise<{ success: boolean; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('message', message.trim());
      const res = await apiClient.post(`/disputes/${disputeId}/response`, formData);
      return { success: Boolean(res.data?.success), message: res.data?.message || i18n.t('customer.responseAddedSuccessfully') };
    } catch (err: any) {
      if (__DEV__) console.warn('sendDisputeResponse error:', err?.message);
      return { success: false, message: err?.response?.data?.message || err?.message || i18n.t('customer.failedToSendResponse') };
    }
  },

  /**
   * 7. Submit Review for a Completed Job
   */
  async createReview(payload: {
    bookingId: string;
    repairmanId: string;
    jobId?: string;
    overallRating: number;
    reviewText: string;
    aspectRatings?: any;
    wouldRecommend?: boolean;
  }): Promise<{ success: boolean; message: string; review?: any }> {
    try {
      const res = await apiClient.post('/reviews', payload);
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || i18n.t('customer.reviewSubmittedSuccessfully'),
        review: res.data?.review || res.data?.data,
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || i18n.t('customer.failedToSubmitReview');
      throw new Error(msg);
    }
  },

  /**
   * 8. Fetch Completed Jobs Available for Review
   */
  // All pages (up to 10). A failed request throws, so the screen never shows "nothing to review".
  async getCompletedJobsForReview(limit = 20): Promise<any[]> {
    const all: any[] = [];
    for (let page = 1; page <= 10; page++) {
      const res = await apiClient.get('/reviews/my-completed-jobs', {
        params: { page, limit },
      });
      const list = res.data?.data?.completedJobs || [];
      all.push(...list);
      if (list.length < limit) break;
    }
    return all;
  },

  /**
   * Close a Completed or Delivered Job (releases payment to technician)
   * Matches web app: PATCH /api/repair-jobs/:bookingId/close-job
   */
  async closeJob(bookingId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.patch(`/repair-jobs/${bookingId}/close-job`, {});
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || i18n.t('customer.jobClosedSuccessfully'),
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || i18n.t('customer.failedToCloseJob2');
      throw new Error(msg);
    }
  },

  /**
   * 9. Create a Dispute on a Booking
   */
  async createDispute(payload: {
    bookingId: string;
    category: string;
    description: string;
  }): Promise<{ success: boolean; message: string; dispute?: any }> {
    try {
      const res = await apiClient.post('/disputes/create', payload);
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || i18n.t('customer.disputeCreatedSuccessfully'),
        dispute: res.data?.dispute || res.data?.data,
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || i18n.t('customer.failedToCreateDispute2');
      throw new Error(msg);
    }
  },

  /**
   * 10. Fetch Single Dispute Details
   */
  async getDisputeDetails(disputeId: string): Promise<any> {
    try {
      const res = await apiClient.get(`/disputes/${disputeId}`);
      return res.data?.data || res.data?.dispute || res.data;
    } catch (err: any) {
      if (__DEV__) console.warn('getDisputeDetails error:', err?.message);
      return null;
    }
  },
};

export default customerJobApi;


import apiClient from '@/services/apiClient';
import { FALLBACK_CUSTOMER_JOBS } from '../data/jobs';

export interface MobileCustomerJob {
  id: string;
  device: string;
  priceMin: number;
  priceMax: number;
  tag: 'job_posting' | 'direct_message';
  offerLabel: 'Confirmed' | 'Pending';
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
  repairmanName: string;
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
  warrantyLabel: string;
  timeLabel: string;
  startLabel: string;
  currency: string;
  description: string;
  status: string;
  partsQuality: string;
  requiredParts: Array<{
    id: string;
    name: string;
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
  title: string;
  chips: string[];
  priceLabel: string;
  urgencyNote: string;
  description: string;
  services: string[];
  locationNote: string;
  locationLabel: string;
  servicePreference: string;
  stats: Array<{ label: string; value: string }>;
  createdAt: string;
  offers: NormalizedOffer[];
  selectedOffer?: NormalizedOffer | null;
  booking?: any;
  repairman?: any;
  quotation?: any;
  dispute?: any;
  raw?: any;
}

export const KNOWN_SERVICES_MAP: Record<string, string> = {
  '692784e3983b67f3a1ae3371': 'Screen Repair',
  '6928cfdf9a8d7145abb5588d': 'Battery Replacement',
  '69340cac7010c47e47c69624': 'Motherboard Repair',
  '693c86dbaa6abf175b80d7a0': 'Display Panel',
  '6977d54dda650922549a73d5': 'Mobile Repairing',
  '69d2d509facfe67f5388c0b4': 'Software Troubleshooting',
  '6a74d9a5c4787fa766a2462f': 'Laptop Repair',
};

export function resolveServiceName(rawService: any): string {
  if (!rawService) return 'General Repair';
  if (typeof rawService === 'object' && rawService !== null) {
    if (rawService.name) return String(rawService.name);
    if (rawService.title) return String(rawService.title);
  }
  const str = String(rawService).trim();
  if (KNOWN_SERVICES_MAP[str]) {
    return KNOWN_SERVICES_MAP[str];
  }
  // If it's a 24-character hexadecimal MongoDB ObjectId, hide the code and return a clean fallback
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    return 'Diagnostics & Repair';
  }
  return str;
}

export function mapBackendJobToMobile(raw: any): MobileCustomerJob {
  if (!raw) {
    return {
      id: '',
      device: 'Device Repair',
      priceMin: 0,
      priceMax: 0,
      tag: 'job_posting',
      offerLabel: 'Pending',
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

  const deviceTitle =
    [brandName, modelName].filter(Boolean).join(' ') ||
    raw.title ||
    raw.quotationId?.title ||
    'Device Repair';

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
    ? rawServices.map(resolveServiceName)
    : [];

  const createdDate = raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : '';

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
    offerLabel:
      raw.selectedOffer || isQuotation || status === 'booked' || status === 'in_progress' || status === 'completed'
        ? 'Confirmed'
        : 'Pending',
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
  if (!offer) return null;

  // 1. Repairman Info
  const repairman = offer.repairmanId || offer.repairman || {};
  const profile = repairman.repairmanProfile || offer.repairmanProfile || {};
  const repairmanName =
    typeof repairman === 'object' && repairman !== null
      ? repairman.name || 'Certified Repair Tech'
      : typeof repairman === 'string' && repairman.length > 0
      ? 'Certified Repair Tech'
      : 'Certified Repair Tech';

  const shopName = profile.shopName || 'Certified Repair Shop';
  const rating = Number(profile.rating || 5.0);
  const totalJobs = Number(profile.totalJobs || 0);
  const successRate = Number(offer.experience?.successRate || 98);

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
  let warrantyLabel = '30 Days Warranty';
  if (typeof offer.warranty === 'string' && offer.warranty.trim()) {
    warrantyLabel = offer.warranty.trim();
  } else if (typeof offer.warranty === 'object' && offer.warranty !== null) {
    if (offer.warranty.duration) {
      warrantyLabel = `${offer.warranty.duration} Days Warranty`;
    } else if (offer.warranty.description) {
      warrantyLabel = String(offer.warranty.description);
    }
  }

  // 5. Estimated Time
  let timeLabel = 'Same Day';
  if (offer.estimatedTime) {
    if (typeof offer.estimatedTime === 'object' && offer.estimatedTime !== null) {
      const val = offer.estimatedTime.value || '';
      const unit = offer.estimatedTime.unit || 'hours';
      timeLabel = val ? `${val} ${unit}` : 'Same Day';
    } else if (typeof offer.estimatedTime === 'string') {
      timeLabel = offer.estimatedTime;
    }
  }

  // 6. Start date / availability
  let startLabel = 'Available now';
  if (offer.availability?.canStartBy) {
    try {
      startLabel = new Date(offer.availability.canStartBy).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      startLabel = 'Available now';
    }
  }

  // 7. Status
  const statusStr = typeof offer.status === 'string' ? offer.status : 'pending';

  // 8. Required Parts
  const requiredParts = Array.isArray(offer.requiredParts)
    ? offer.requiredParts.map((p: any) => ({
        id: String(p._id || p.id || Math.random()),
        name: String(p.name || 'Replacement Part'),
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

  const title = [brandName, modelName].filter(Boolean).join(' ') || raw?.title || 'Device Repair Job';

  const budgetObj = raw?.preferredBudget || raw?.budget || {};
  const priceMin = Number(budgetObj.min || raw?.estimatedCost?.min || 0);
  const priceMax = Number(budgetObj.max || raw?.estimatedCost?.max || priceMin);
  const priceLabel =
    priceMin === priceMax
      ? `TRY ${priceMin.toLocaleString()}`
      : `TRY ${priceMin.toLocaleString()} - ${priceMax.toLocaleString()}`;

  const servicesList: string[] = Array.isArray(raw?.services)
    ? raw.services.map(resolveServiceName)
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
  const locationLabel = locationParts.join(', ') || 'Local Service';

  const statusStr = String(raw?.status || 'Open');
  const urgency = String(raw?.urgency || 'Normal priority');
  const chips = [statusStr, urgency, 'Job posting'];

  const normalizedOffers: NormalizedOffer[] = (offersList || [])
    .map(normalizeOffer)
    .filter(Boolean) as NormalizedOffer[];

  const selectedOffer = payload?.selectedOffer || raw?.selectedOffer
    ? normalizeOffer(payload?.selectedOffer || raw?.selectedOffer)
    : null;

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
    (disputeRepairman
      ? {
          id: disputeRepairman._id || disputeRepairman.id,
          name: disputeRepairman.name,
          phone: disputeRepairman.phone,
          avatar: disputeRepairman.avatar,
        }
      : null);

  return {
    id: String(raw?._id || raw?.id || ''),
    tag: 'job_posting',
    status: statusStr,
    title,
    chips,
    priceLabel,
    urgencyNote: raw?.urgency ? `Priority: ${raw.urgency}` : 'Standard priority',
    description: typeof raw?.description === 'string' ? raw.description : 'No description provided.',
    services: servicesList.length > 0 ? servicesList : ['Repair & Diagnostics'],
    locationNote: 'Drop-off at technician workshop or pickup arranged on request.',
    locationLabel,
    servicePreference: raw?.servicePreference || raw?.serviceType || 'Drop-off',
    stats: [
      { label: 'Total Offers', value: String(normalizedOffers.length || raw?.offersCount || '0') },
      { label: 'Status', value: statusStr },
      { label: 'Max Offers', value: String(raw?.maxOffers || '10') },
      { label: 'Warranty', value: '30 Days' },
    ],
    createdAt: raw?.createdAt ? new Date(raw.createdAt).toLocaleDateString() : 'Recent',
    offers: normalizedOffers,
    selectedOffer,
    booking: payload?.booking || null,
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

  const title = [brandName, modelName].filter(Boolean).join(' ') || 'Device Repair Quotation';

  const total = Number(
    booking?.bookingDetails?.pricing?.totalAmount ||
      quotation?.pricing?.totalAmount ||
      quotation?.estimatedCost ||
      0,
  );
  const priceLabel = `TRY ${total.toLocaleString()}`;

  let rawServices = quotation?.deviceInfo?.repairServices || quotation?.requiredParts || [];
  const servicesList: string[] = Array.isArray(rawServices)
    ? rawServices.map((s: any) => (typeof s === 'string' ? s : s?.name || s?.title || 'Repair Service'))
    : ['Diagnostic & Repair'];

  const statusStr = String(booking?.status || quotation?.status || 'Booked');
  const chips = [statusStr, 'Direct Message', 'Certified Repair'];

  const repairmanProfile = repairman?.repairmanProfile || {};
  const shopName = repairmanProfile?.shopName || 'Certified Repair Center';
  const rating = Number(repairmanProfile?.rating || 5.0);

  return {
    id: String(booking?._id || quotation?._id || payload?._id || ''),
    tag: 'direct_message',
    status: statusStr,
    title,
    chips,
    priceLabel,
    urgencyNote: 'Direct quote booking with repair technician',
    description: typeof quotation?.repairmanNotes === 'string' ? quotation.repairmanNotes : 'Direct quotation repair job.',
    services: servicesList,
    locationNote: 'Drop-off at technician workshop or pickup arranged on request.',
    locationLabel: repairmanProfile?.city || 'Local Technician',
    servicePreference: quotation?.serviceDetails?.serviceType || 'Drop-off',
    stats: [
      { label: 'Booking ID', value: String(booking?._id || '').slice(-6).toUpperCase() || 'Direct' },
      { label: 'Status', value: statusStr },
      { label: 'Technician', value: repairman?.name || 'Assigned Tech' },
      { label: 'Shop', value: shopName },
    ],
    createdAt: quotation?.sentAt || booking?.createdAt ? new Date(quotation?.sentAt || booking?.createdAt).toLocaleDateString() : 'Recent',
    offers: [],
    selectedOffer: null,
    booking,
    repairman: {
      id: String(repairman?._id || repairman?.id || ''),
      name: repairman?.name || 'Certified Repair Technician',
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
    try {
      const res = await apiClient.get('/repair-jobs/my-jobs', { params });
      const rawJobs = res.data?.data?.jobs || res.data?.jobs || res.data?.data;
      if (Array.isArray(rawJobs) && rawJobs.length > 0) {
        return rawJobs.map(mapBackendJobToMobile);
      }
      return FALLBACK_CUSTOMER_JOBS;
    } catch (err: any) {
      if (__DEV__) console.warn('getMyJobs error fallback:', err?.message);
      return FALLBACK_CUSTOMER_JOBS;
    }
  },

  /**
   * 2. Get Single Repair Job Details
   */
  async getMyJobDetail(jobId: string): Promise<MobileJobDetail | null> {
    if (!jobId) return null;

    // Fallback for demo job ids
    if (jobId.startsWith('j-')) {
      const demo = FALLBACK_CUSTOMER_JOBS.find(j => j.id === jobId);
      if (demo) {
        return {
          id: demo.id,
          tag: demo.tag,
          status: demo.status,
          title: demo.device,
          chips: [demo.status.toUpperCase(), demo.tag === 'job_posting' ? 'Job Posting' : 'Direct Message'],
          priceLabel: `TRY ${demo.priceMin} - ${demo.priceMax}`,
          urgencyNote: 'Standard priority',
          description: demo.description,
          services: demo.services,
          locationNote: 'Drop-off at technician workshop or pickup arranged on request.',
          locationLabel: 'Local Service',
          servicePreference: 'Drop-off',
          stats: [
            { label: 'Total Offers', value: String(demo.offersCount) },
            { label: 'Status', value: demo.status },
            { label: 'Warranty', value: '30 Days' },
          ],
          createdAt: demo.date || 'Recent',
          offers: [],
          selectedOffer: null,
          booking: null,
          repairman: demo.assignedTo ? { id: 'rep-1', name: demo.assignedTo, shopName: 'Certified Tech' } : null,
          quotation: null,
          dispute: null,
          raw: demo,
        };
      }
    }

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
      if (__DEV__) console.warn(`getMyJobDetail(${jobId}) error:`, err?.message);
      return null;
    }
  },

  /**
   * 3. Get Offers for a Job
   */
  async getJobOffers(jobId: string): Promise<NormalizedOffer[]> {
    if (!jobId) return [];
    try {
      const res = await apiClient.get(`/repair-jobs/my-jobs/${jobId}/offers`);
      const offers = res.data?.data?.offers || res.data?.offers || res.data?.data || [];
      if (Array.isArray(offers)) {
        return offers.map(normalizeOffer).filter(Boolean) as NormalizedOffer[];
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * 4. Select Offer / Book
   */
  async selectOffer(
    jobId: string,
    offerId: string,
    bookingData?: any,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Ensure scheduledDate is strictly in the future (at least 24 hours from now)
      let scheduledDate = bookingData?.scheduledDate;
      if (!scheduledDate || new Date(scheduledDate).getTime() <= Date.now()) {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        tomorrow.setHours(10, 0, 0, 0);
        scheduledDate = tomorrow.toISOString();
      }

      const isPickUp = bookingData?.serviceType === 'pickup';
      const pickUpAddress = bookingData?.pickUpAddress || bookingData?.address || '';

      const res = await apiClient.post(`/repair-jobs/${jobId}/select-offer`, {
        offerId,
        serviceType: bookingData?.serviceType || 'drop-off',
        scheduledDate,
        specialInstructions: bookingData?.specialInstructions || '',
        isPickUp,
        pickUpAddress,
      });
      return { success: Boolean(res.data?.success), message: res.data?.message || 'Offer selected successfully!' };
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.message || 'Failed to select offer' };
    }
  },

  /**
   * 5. Get Customer Bookings
   */
  async getMyBookings(params?: { status?: string; page?: number; limit?: number }): Promise<any[]> {
    try {
      const res = await apiClient.get('/repair-jobs/bookings/my-bookings', { params });
      const bookings = res.data?.data?.bookings || res.data?.bookings || [];
      return Array.isArray(bookings) ? bookings : [];
    } catch (err: any) {
      if (__DEV__) console.warn('getMyBookings error:', err?.message);
      return [];
    }
  },

  /**
   * 6. Send Response to a Dispute
   */
  async sendDisputeResponse(disputeId: string, message: string): Promise<{ success: boolean; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('message', message.trim());
      const res = await apiClient.post(`/disputes/${disputeId}/response`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: Boolean(res.data?.success), message: res.data?.message || 'Response added successfully!' };
    } catch (err: any) {
      if (__DEV__) console.warn('sendDisputeResponse error:', err?.message);
      return { success: false, message: err?.response?.data?.message || 'Failed to send response' };
    }
  },
};

export default customerJobApi;


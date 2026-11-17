import apiClient from '@/services/apiClient';

// apiClient already turns every failure into an ApiError (backend message, status, field errors).
// Nothing is caught here, so screens can show the real message and a retry.

export type ApiRecord = Record<string, any>;

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface WithMessage<T> {
  data: T;
  message: string;
}

async function get<T>(url: string, params?: object): Promise<T> {
  const res = await apiClient.get<Envelope<T>>(url, { params });
  return res.data.data;
}

async function send<T>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  body?: unknown,
): Promise<WithMessage<T>> {
  const res = await apiClient.request<Envelope<T>>({ method, url, data: body });
  return { data: res.data.data, message: res.data.message || '' };
}

// ---------- Dashboard ----------

export type EarningsFilter =
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month';

export interface DashboardBooking {
  _id: string;
  status: string;
  serviceType?: string;
  scheduledDate?: string;
  pricing?: { totalAmount?: number; currency?: string };
  createdAt: string;
  customer: {
    _id?: string;
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
  };
  device: { brand?: string; brandLogo?: string; model?: string };
  job: ApiRecord | null;
}

export interface DashboardHome {
  summary: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalEarnings: number;
    pendingOffers: number;
  };
  latestBookings: DashboardBooking[];
  fallbackJob: ApiRecord | null;
}

export interface EarningsAnalytics {
  filter: EarningsFilter;
  period: { start: string; end: string };
  summary: {
    totalEarnings: number;
    totalJobs: number;
    avgEarning: number;
    maxEarning: number;
    bestDay: string | null;
  };
  chartData: {
    label: string;
    date?: string;
    earnings: number;
    jobsCount: number;
  }[];
}

export interface JobDistribution {
  filter: string;
  period: { start: string; end: string };
  totalBookings: number;
  distribution: { name: string; value: number; count: number }[];
}

export interface OffersAnalytics {
  year: number;
  summary: {
    totalPending: number;
    totalConfirmed: number;
    totalOffers: number;
    conversionRate: number;
  };
  chartData: { month: string; pending: number; confirmed: number }[];
}

export interface CalendarJob {
  _id: string;
  date: string;
  time: string;
  job: { _id?: string; title: string; description?: string; urgency?: string };
  booking: {
    status: string;
    pricing?: { totalAmount?: number; currency?: string };
  };
  customer: { name?: string; phone?: string };
  device: { brand?: string; model?: string };
}

export interface CalendarJobs {
  year: number;
  month: number;
  monthName: string;
  totalJobs: number;
  jobs: CalendarJob[];
  jobsByDate: Record<string, CalendarJob[]>;
  dateMarkers: string[];
}

// ---------- Job board ----------

export type JobUrgency = 'low' | 'medium' | 'high' | 'urgent';

export interface BoardJob {
  _id: string;
  title?: string;
  description: string;
  urgency: JobUrgency;
  status: string;
  createdAt: string;
  expiresAt?: string;
  preferredTime?: string;
  budget: { min: number; max: number; currency?: string };
  deviceInfo: {
    brand: string;
    model: string;
    color?: string;
    warrantyStatus?: string;
  };
  location: {
    address: string;
    zipCode?: string;
    city?: { _id?: string; name?: string } | null;
    state?: { _id?: string; name?: string } | null;
    country?: { _id?: string; name?: string } | null;
  };
  services: { _id: string; name: string; description?: string }[];
  offers: string[];
  maxOffers?: number;
  viewCount?: number;
  images?: { url: string; description?: string }[];
  servicePreference?: string;
}

export interface JobBoardQuery {
  page?: number;
  limit?: number;
  search?: string;
  priority?: string;
  city?: string;
  state?: string;
}

export interface JobBoardPage {
  jobs: BoardJob[];
  states: { _id: string; name: string }[];
  selectedState: { _id: string; name: string } | null;
  cities: { _id: string; name: string }[];
  pagination: {
    totalJobs: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
  };
}

// GET /repairman/offers/jobs/:jobId (only answers for jobs that still take offers, otherwise 404)
export interface JobOfferInfo {
  job: BoardJob;
  competition: {
    totalOffers: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
  };
  repairmanStatus: {
    hasSubmittedOffer: boolean;
    submittedOffer: ApiRecord | null;
    canSubmitOffer: boolean;
  };
  recommendations: { suggestedPrice: number };
}

// ---------- Offers ----------

export interface OfferPayload {
  pricing: {
    basePrice: number;
    partsEstimate?: number;
    totalPrice: number;
    currency: string;
  };
  estimatedTime: { value: number; unit: 'hours' | 'days' };
  description: string;
  warranty: { duration: number; description: string; terms?: string };
  availability: { canStartBy: string; preferredSlots?: string[] };
  servicesIncluded?: string[];
  serviceOptions?: {
    pickupAvailable: boolean;
    pickupCharge: number;
    homeService: boolean;
    homeServiceCharge: number;
  };
}

export type OfferStatus =
  | 'pending'
  | 'accepted'
  | 'confirmed'
  | 'rejected'
  | 'withdrawn'
  | 'expired'
  | 'in_progress'
  | string;

export interface MyOfferJob {
  _id: string;
  title?: string;
  description?: string;
  urgency?: JobUrgency;
  status?: string;
  expiresAt?: string;
  budget?: { min: number; max: number; currency?: string };
  deviceInfo?: { brand?: string; model?: string };
  location?: { address?: string };
  services?: { _id: string; name: string }[];
}

export interface MyOffer {
  _id: string;
  status: OfferStatus;
  repairStatus?: string | null;
  isExpired?: boolean;
  description: string;
  pricing: {
    basePrice: number;
    partsEstimate?: number;
    totalPrice: number;
    currency?: string;
  };
  estimatedTime: { value: number; unit: string };
  warranty?: { duration?: number; description?: string };
  createdAt: string;
  expiresAt?: string;
  jobId: MyOfferJob | null;
}

export interface OffersQuery {
  status?: string;
  page?: number;
  limit?: number;
}

export interface MyOffersPage {
  offers: MyOffer[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalOffers: number;
  };
  summary: {
    pending: number;
    accepted: number;
    rejected: number;
    expired: number;
  };
}

// GET /repairman/offers/my-offers/:id. The backend sends the prices as text already formatted by the server,
// so the numbers shown in the app come from the offer in the list.
export interface OfferDetail {
  job: {
    _id: string;
    description?: string;
    urgency?: JobUrgency;
    status?: string;
    expiresAt?: string;
    budget?: { min: number; max: number; currency?: string };
    deviceInfo?: {
      brand?: string;
      model?: string;
      brandName?: string;
      modelName?: string;
    };
    customerId?: {
      name?: string;
      avatar?: string;
      phone?: string;
      email?: string;
    } | null;
    services?: { _id: string; name: string; description?: string }[];
    location?: { address?: string };
    formattedLocation?: {
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  offerDetails: {
    id: string;
    status: OfferStatus;
    pricing: { basePrice: string; partsEstimate: string; totalPrice: string };
    estimatedTime: string;
    warranty?: { duration?: number; description?: string; terms?: string };
    serviceOptions?: {
      pickupAvailable?: boolean;
      pickupCharge?: number;
      homeService?: boolean;
      homeServiceCharge?: number;
    };
    description: string;
    requiredParts?: { _id: string; name: string }[];
    servicesIncluded?: { _id: string; name: string }[];
    createdAt: string;
    expiresAt?: string;
    isExpired?: boolean;
  };
}

// ---------- My jobs (bookings) ----------

export type BookingStatus =
  | 'confirmed'
  | 'scheduled'
  | 'in_progress'
  | 'parts_needed'
  | 'quality_check'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export interface MyJobsQuery {
  page?: number;
  limit?: number;
}

type NameOrText = string | { name?: string } | null;

export interface MyBookingJob {
  _id: string;
  title?: string;
  description?: string;
  // the backend sends a word (low, medium, high, urgent) for jobs and a number for some old ones
  urgency?: string | number;
  deviceInfo?: { brand?: NameOrText; model?: NameOrText; color?: string };
  services?: (string | { _id?: string; name?: string })[];
  location?: {
    address?: string;
    zipCode?: string;
    city?: { name?: string } | null;
    state?: { name?: string } | null;
  };
  budget?: { min?: number; max?: number; currency?: string };
}

export interface BookingPricing {
  basePrice?: number;
  partsPrice?: number;
  serviceCharge?: number;
  totalAmount?: number;
  currency?: string;
}

export interface BookingCustomer {
  _id?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface MyBooking {
  _id: string;
  bookingSource: 'job_posting' | 'direct_message' | string;
  isQuotationBased?: boolean;
  jobDetails: MyBookingJob | null;
  bookingDetails: {
    status: string;
    serviceType?: string;
    scheduledDate?: string;
    pricing?: BookingPricing;
    estimatedCompletion?: string;
  };
  customer: BookingCustomer | null;
  canUpdateStatus: boolean;
  needsPickup?: boolean;
  needsDelivery?: boolean;
  createdAt?: string;
}

export interface MyJobsPage {
  jobs: MyBooking[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalJobs: number;
  };
  summary: {
    totalJobs: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    disputedBookings: number;
    jobPostingBookings: number;
    directMessageBookings: number;
  };
}

export interface BookingTimelineEntry {
  status: string;
  timestamp: string;
  title: string;
  description?: string;
}

// GET /repairman/my-booking/:id/detail (the id is the booking id)
export interface BookingDetail {
  _id: string;
  bookingSource: string;
  isQuotationBased?: boolean;
  jobInfo:
    | (MyBookingJob & {
        partsQuality?: string;
        warranty?: { duration?: number; description?: string } | number;
      })
    | null;
  customer: BookingCustomer | null;
  bookingDetails: MyBooking['bookingDetails'] & {
    warranty?: { duration?: number; description?: string };
  };
  timeline: BookingTimelineEntry[];
  tracking: {
    currentLocation: string;
    estimatedCompletion?: string;
    actualCompletion?: string;
    delays?: string | null;
  };
  communication?: { customerPhone?: string };
  dispute?: { _id?: string; status?: string; category?: string } | null;
  actions: { canUpdateStatus: boolean };
}

export interface StatusTransition {
  status: BookingStatus;
  label: string;
  requiresData: string[];
}

export interface BookingTransitions {
  bookingId: string;
  currentStatus: string;
  availableTransitions: StatusTransition[];
  canUpdate: boolean;
}

// timeSlot is not sent: the backend validates it as text but saves it into an object field, so any value fails
export interface StatusUpdatePayload {
  status: BookingStatus;
  notes?: string;
  scheduledDate?: string;
  cancellationReason?: string;
  partsInfo?: { partsRequired: { name: string }[] };
}

// ---------- Earnings ----------

export interface BankDetails {
  accountTitle?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  iban?: string | null;
  updatedAt?: string | null;
}

export interface EarningsOverview {
  wallet: {
    availableBalance: number;
    totalReleased: number;
    totalWithdrawn: number;
    pendingAmount: number;
    lockedAmount: number;
    currency: string;
  };
  paymentInfo: {
    isPaymentInformationCompleted: boolean;
    bankDetails: BankDetails | null;
  };
  overview: {
    thisMonth: { netEarning: number; totalJobs: number; avgPerJob: number };
  };
}

export type WithdrawStatus =
  | 'requested'
  | 'processing'
  | 'completed'
  | 'rejected';

export interface WithdrawRecord {
  _id: string;
  amount: number;
  status: WithdrawStatus;
  requestedAt: string;
  expectedReleaseDate?: string;
  processedAt: string | null;
  adminNote: string | null;
  bankDetails: {
    accountNumber: string;
    bankName: string;
    branchName: string | null;
  } | null;
  earningsCount: number;
}

export interface WithdrawHistory {
  data: WithdrawRecord[];
  summary: Record<WithdrawStatus, { count: number; amount: number }>;
  meta: {
    total: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const MIN_WITHDRAWAL = 500;

// ---------- Profile (read only in the app, editing is on the website) ----------

export interface RepairmanProfile {
  user: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    profileImage?: string;
    isEmailVerified?: boolean;
    isProfileComplete?: boolean;
    createdAt?: string;
    updatedAt?: string;
    profileLastUpdated?: string;
    city?: { _id?: string; name?: string } | null;
    state?: { _id?: string; name?: string } | null;
    country?: { _id?: string; name?: string } | null;
    repairmanProfile?: {
      fullName?: string;
      shopName?: string;
      mobileNumber?: string;
      whatsappNumber?: string;
      emergencyContactPerson?: string;
      emergencyContactNumber?: string;
      kycStatus?: string;
      fullAddress?: string;
      zipCode?: string;
      profilePhoto?: string;
      yearsOfExperience?: number;
      specializations?: string[];
      description?: string;
      workingDays?: string[];
      workingHours?: { start?: string; end?: string };
      pickupService?: boolean;
      rating?: number;
      totalJobs?: number;
      isPaymentInformationCompleted?: boolean;
      education?: {
        _id: string;
        title?: string;
        institution?: string;
        description?: string;
        startYear?: number;
        endYear?: number;
      }[];
      experience?: {
        _id: string;
        title?: string;
        companyName?: string;
        description?: string;
        startYear?: number;
        endYear?: number;
      }[];
      certificationsLicense?: {
        _id: string;
        title?: string;
        images?: string[];
      }[];
      bankDetails?: BankDetails;
    };
    reviewStats?: { totalReviews: number; averageRating: number };
  };
  profileStatus: {
    isComplete: boolean;
    completionPercentage: number;
    missingFields: string[];
  };
  serviceCatalog: {
    stats: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
}

// ---------- Parts orders ----------

export type PartsOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready-for-pickup'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PartsPaymentStatus =
  | 'Pending'
  | 'Paid'
  | 'Partially Paid'
  | 'Failed'
  | 'Refunded';
export type PartsShippingMethod = 'Pickup' | 'Delivery' | 'Courier';

export interface PartsOrderItem {
  partName: string;
  partSku?: string;
  quantity: number;
  price: number;
  discount?: number;
  finalPrice: number;
  subtotal: number;
  part?: { images?: string[] } | string | null;
}

export interface PartsOrderAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PartsOrder {
  _id: string;
  orderNumber?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: PartsOrderAddress;
    shippingAddress?: PartsOrderAddress;
  };
  items: PartsOrderItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  shippingCharges?: number;
  totalAmount: number;
  isReceived?: boolean;
  warranty?: string;
  paymentMethod?: string;
  paymentStatus: string;
  paidAmount?: number;
  remainingAmount?: number;
  transactionId?: string;
  paymentDate?: string;
  orderStatus: PartsOrderStatus | string;
  shippingMethod?: PartsShippingMethod | string;
  trackingNumber?: string;
  shippingDate?: string;
  deliveryDate?: string;
  estimatedDelivery?: string;
  orderNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  // only in the detail request
  job_id?: {
    _id: string;
    title?: string;
    description?: string;
    urgency?: string;
    deviceInfo?: {
      brand?: string;
      model?: string;
      color?: string;
      warrantyStatus?: string;
    };
    services?: { _id?: string; name?: string }[];
    location?: { city?: { name?: string } | null };
  } | null;
  activityLog?: {
    previousStatus?: string;
    newStatus?: string;
    changedBy?: { name?: string; role?: string };
    createdAt: string;
  }[];
}

export interface PartsOrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
  orderStatus?: string;
  paymentStatus?: string;
  shippingMethod?: string;
}

export interface PartsOrdersPage {
  parts: PartsOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
  summary: {
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalAmount: number;
  };
}

// ---------- Reviews ----------

export interface ReceivedReview {
  _id: string;
  overallRating: number;
  reviewText?: string;
  deviceRepaired?: { brand?: string; model?: string };
  repairmanResponse?: { text?: string; respondedAt?: string } | null;
  helpfulVotes?: number;
  createdAt: string;
  customerId?: { _id?: string; name?: string; profilePicture?: string } | null;
}

export interface ReviewsPage {
  reviews: ReceivedReview[];
  totalPages: number;
  currentPage: number | string;
  total: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

// ---------- Service catalog ----------

export type ServiceApproval = 'pending' | 'approved' | 'rejected';
export type ServiceKind = 'home' | 'shop' | 'pickup';

export interface RepairmanService {
  _id: string;
  title: string;
  description: string;
  serviceType?: ServiceKind;
  status: ServiceApproval;
  rejectionReason?: string;
  city?: string;
  isActive: boolean;
  deviceInfo?: {
    brandId?: { _id?: string; name?: string } | null;
    modelId?: { _id?: string; name?: string } | null;
  };
  pricing?: {
    basePrice?: number;
    partsPrice?: number;
    serviceCharges?: number;
    total?: number;
    currency?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServicesPage {
  data: RepairmanService[];
  pagination: { total: number; page: number; pages: number };
}

// ---------- Disputes ----------

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'pending'
  | 'resolved'
  | 'closed';

export interface DisputeParty {
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    profilePicture?: string;
  } | null;
  userType: 'customer' | 'repairman';
}

export interface DisputeResponse {
  _id?: string;
  respondedBy?: {
    userId?: { _id?: string; name?: string; profilePicture?: string } | null;
    userType?: 'customer' | 'repairman' | 'admin';
  };
  message: string;
  evidenceFiles?: { fileUrl?: string; fileType?: string }[];
  respondedAt?: string;
}

export interface RepairmanDispute {
  _id: string;
  disputeId: string;
  category: string;
  description: string;
  status: DisputeStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  raisedBy: DisputeParty;
  againstUser: DisputeParty;
  bookingId?: ApiRecord | string | null;
  jobId?: { _id?: string; title?: string; deviceInfo?: ApiRecord } | null;
  responses?: DisputeResponse[];
  resolution?: {
    resolutionType?: string;
    refundAmount?: number;
    resolutionNotes?: string;
    resolvedAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface DisputesPage {
  data: RepairmanDispute[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDisputes: number;
    limit: number;
  };
}

export const repairmanApi = {
  getProfile: () => get<RepairmanProfile>('/repairman/profile'),

  getHome: () => get<DashboardHome>('/repairman/dashboard'),

  getEarningsAnalytics: (filter: EarningsFilter = 'this_week') =>
    get<EarningsAnalytics>('/repairman/dashboard/earnings-analytics', {
      filter,
    }),

  getJobDistribution: (filter?: string) =>
    get<JobDistribution>('/repairman/dashboard/job-distribution', { filter }),

  getOffersAnalytics: (year?: number) =>
    get<OffersAnalytics>('/repairman/dashboard/offers-analytics', { year }),

  // month is 0 based (0 = January), the backend reads it as a JavaScript month
  getCalendarJobs: (month: number, year: number) =>
    get<CalendarJobs>('/repairman/dashboard/calendar-jobs', { month, year }),

  getJobs: async (query: JobBoardQuery = {}): Promise<JobBoardPage> => {
    const res = await apiClient.get('/repairman/jobs', { params: query });
    return { ...res.data.data, pagination: res.data.pagination };
  },

  getJobById: (id: string) => get<BoardJob>(`/repairman/jobs/${id}`),

  getJobOfferInfo: (id: string) =>
    get<JobOfferInfo>(`/repairman/offers/jobs/${id}`),

  getMyOffers: (query: OffersQuery = {}) =>
    get<MyOffersPage>('/repairman/offers/my-offers', query),

  getOfferDetail: (id: string) =>
    get<OfferDetail>(`/repairman/offers/my-offers/${id}`),

  withdrawOffer: (id: string, reason: string) =>
    send<{ offerId: string }>('delete', `/repairman/offers/${id}`, { reason }),

  acceptOffer: (id: string) =>
    send<{ offerId: string }>(
      'patch',
      `/repairman/offers/my-offers/${id}/accept`,
      {},
    ),

  submitOffer: (jobId: string, body: OfferPayload) =>
    send<ApiRecord>('post', `/repairman/offers/jobs/${jobId}/offer`, body),

  getMyJobs: async (query: MyJobsQuery = {}): Promise<MyJobsPage> => {
    const res = await apiClient.get('/repairman/my-booking', { params: query });
    return res.data.data as MyJobsPage;
  },

  getBookingDetail: (bookingId: string) =>
    get<BookingDetail>(`/repairman/my-booking/${bookingId}/detail`),

  getBookingTransitions: (bookingId: string) =>
    get<BookingTransitions>(
      `/repairman/my-booking/bookings/${bookingId}/status-transitions`,
    ),

  updateBookingStatus: (bookingId: string, body: StatusUpdatePayload) =>
    send<ApiRecord>('patch', `/repairman/my-booking/${bookingId}/status`, body),

  getEarningsOverview: () =>
    get<EarningsOverview>('/repairman/earnings/overview'),

  requestWithdraw: (amount: number) =>
    send<ApiRecord>('post', '/repairman/earnings/withdraw', { amount }),

  getWithdrawHistory: async (
    query: { status?: WithdrawStatus; page?: number; limit?: number } = {},
  ) => {
    const res = await apiClient.get<WithdrawHistory & { success: boolean }>(
      '/repairman/earnings/withdraw-history',
      { params: query },
    );
    return res.data;
  },

  saveBankDetails: (bankDetails: BankDetails) =>
    send<BankDetails>('put', '/repairman/profile/bank-details', {
      bankDetails,
    }),

  // The parts routes answer without the usual data envelope (parts, pagination and summary are at the top)
  getPartsOrders: async (
    query: PartsOrdersQuery = {},
  ): Promise<PartsOrdersPage> => {
    const res = await apiClient.get('/repairman/parts/orders', {
      params: query,
    });
    return res.data as PartsOrdersPage;
  },

  getPartsOrder: (id: string) =>
    get<PartsOrder>(`/repairman/parts/orders/${id}`),

  // The backend sends no message for this request, so the screen shows its own text
  markPartsReceived: async (id: string): Promise<void> => {
    await apiClient.put(`/repairman/parts/orders/${id}/mark-as-received`);
  },

  getReceivedReviews: async (
    query: { page?: number; limit?: number; rating?: number } = {},
  ): Promise<ReviewsPage> => {
    const res = await apiClient.get('/reviews/received/all', { params: query });
    return res.data as ReviewsPage;
  },

  getReviewStats: async (): Promise<ReviewStats> => {
    const res = await apiClient.get('/reviews/stats/my-stats');
    return res.data.stats as ReviewStats;
  },

  respondToReview: async (
    id: string,
    responseText: string,
  ): Promise<{ message: string; review: ReceivedReview }> => {
    const res = await apiClient.post(`/reviews/${id}/respond`, {
      responseText,
    });
    return { message: res.data?.message || '', review: res.data?.review };
  },

  getServices: async (
    query: { status?: ServiceApproval; page?: number; limit?: number } = {},
  ): Promise<ServicesPage> => {
    const res = await apiClient.get('/repairman/services', { params: query });
    return res.data as ServicesPage;
  },

  toggleService: async (
    id: string,
  ): Promise<{ message: string; service: RepairmanService }> => {
    const res = await apiClient.patch(`/repairman/services/${id}/toggle-status`);
    return { message: res.data?.message || '', service: res.data?.data };
  },

  deleteService: async (id: string): Promise<string> => {
    const res = await apiClient.delete(`/repairman/services/${id}`);
    return res.data?.message || '';
  },

  getMyDisputes: async (
    query: { status?: DisputeStatus; page?: number; limit?: number } = {},
  ): Promise<DisputesPage> => {
    const res = await apiClient.get('/disputes/my-disputes', { params: query });
    return res.data as DisputesPage;
  },

  getDispute: (id: string) => get<RepairmanDispute>(`/disputes/${id}`),

  // Text only: evidence upload is not in the app
  respondToDispute: async (id: string, message: string): Promise<string> => {
    const body = new FormData();
    body.append('message', message.trim());
    const res = await apiClient.post(`/disputes/${id}/response`, body);
    return res.data?.message || '';
  },
};

export default repairmanApi;

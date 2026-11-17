import apiClient from '@/services/apiClient';
import { pickImageUrl } from '@/utils/imageUtils';
import i18n from '@/i18n';

export interface SellerProductItem {
  id: string;
  name: string;
  sku: string;
  modelNumber: string;
  description: string;
  sellingPrice: number;
  discountPrice: number | null;
  stock: number;
  isActive: boolean;
  image: string | null;
  category: string;
  brand: string;
}

export interface SellerDashboardOverview {
  sales: {
    today: number;
    last7Days: number;
    last30Days: number;
    growthPercent: number;
    chartData: Array<{ date: string; revenue: number }>;
  };
  actions: {
    pendingOrders: number;
    pendingDocuments: number;
    orderQuestions: number;
    productQuestions: number;
    pendingRefunds: number;
    total: number;
  };
  advertising: {
    activeCampaigns: number;
    last7Impressions: number;
    chartData: Array<{ date: string; impressions: number }>;
  };
}

// -------------------------------------------------------------
// 1. PRODUCTS APIS
// -------------------------------------------------------------

export interface SellerProductsPage {
  products: SellerProductItem[];
  pagination: { currentPage: number; totalPages: number; totalItems: number };
}

export interface SellerOption {
  id: string;
  name: string;
}

function mapSellerProduct(item: any): SellerProductItem {
  const variants: any[] = Array.isArray(item.variants) ? item.variants : [];
  const mainVariant = variants.find(v => v?.isDefault) || variants[0];
  const image = item.images?.find((img: any) => img?.isDefault)?.url || item.images?.[0]?.url || null;

  return {
    id: String(item._id),
    name: item.title || '',
    sku: item.sku || '',
    modelNumber: item.modelNumber || '',
    description: item.shortDescription || item.description || '',
    sellingPrice: Number(mainVariant?.sellingPrice) || 0,
    discountPrice: mainVariant?.discountPrice ? Number(mainVariant.discountPrice) : null,
    stock: variants.reduce((sum, v) => sum + (Number(v?.stock) || 0), 0),
    isActive: Boolean(item.isActive),
    image,
    category: item.categoryId?.title || '',
    brand: item.brandId?.title || '',
  };
}

/**
 * Seller's own products
 * Endpoint: GET /seller/product (page, limit, search, isActive, categoryId, brandId, modelNumber, barcode)
 */
export async function fetchSellerProductsApi(params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  categoryId?: string;
  brandId?: string;
  modelNumber?: string;
  barcode?: string;
}): Promise<SellerProductsPage> {
  const res = await apiClient.get('/seller/product', {
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || undefined,
      isActive: params.isActive === undefined ? undefined : String(params.isActive),
      categoryId: params.categoryId || undefined,
      brandId: params.brandId || undefined,
      modelNumber: params.modelNumber || undefined,
      barcode: params.barcode || undefined,
    },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];
  return {
    products: list.map(mapSellerProduct),
    pagination: {
      currentPage: body.pagination?.currentPage || 1,
      totalPages: body.pagination?.totalPages || 1,
      totalItems: body.pagination?.totalItems || 0,
    },
  };
}

/**
 * Endpoint: GET /seller/product/categories
 */
export async function fetchProductCategoriesApi(): Promise<SellerOption[]> {
  const res = await apiClient.get('/seller/product/categories');
  const list: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.map(c => ({ id: String(c._id), name: c.title || '' }));
}

/**
 * Endpoint: GET /seller/product/all-brands
 */
export async function fetchProductBrandsApi(): Promise<SellerOption[]> {
  const res = await apiClient.get('/seller/product/all-brands');
  const list: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.map(b => ({ id: String(b._id), name: b.title || '' }));
}

/**
 * Create a product (multipart: fields + images). The backend also creates the default variant.
 * Endpoint: POST /seller/product
 */
export async function createSellerProductApi(
  payload: FormData,
): Promise<{ success: boolean; message?: string; data?: any }> {
  const res = await apiClient.post('/seller/product', payload, { timeout: 120000 });
  return res.data;
}

/**
 * Endpoint: PATCH /seller/product/:id/toggle
 */
export async function toggleProductStatusApi(
  productId: string,
): Promise<{ success: boolean; message?: string; data?: any }> {
  const res = await apiClient.patch(`/seller/product/${productId}/toggle`);
  return res.data;
}

/**
 * Endpoint: DELETE /seller/product/:id
 */
export async function deleteSellerProductApi(
  productId: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete(`/seller/product/${productId}`);
  return res.data;
}

// -------------------------------------------------------------
// 2. SELLER ORDERS APIS
// -------------------------------------------------------------

export interface SellerPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

function mapPagination(raw: any): SellerPagination {
  return {
    currentPage: Number(raw?.currentPage) || 1,
    totalPages: Number(raw?.totalPages) || 1,
    totalItems: Number(raw?.totalItems) || 0,
  };
}

function pickImage(...sources: any[]): string | null {
  return pickImageUrl(...sources);
}

function variantLabel(variant: any): string {
  return [variant?.color, variant?.size].filter(Boolean).join(' / ');
}

export interface SellerOrderListItem {
  id: string;
  orderNo: string;
  customer: string;
  firstItemTitle: string;
  firstItemBarcode: string;
  itemsCount: number;
  image: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  completionDate: string | null;
}

export interface SellerOrdersPage {
  orders: SellerOrderListItem[];
  pagination: SellerPagination;
}

export interface SellerOrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  orderDateFrom?: string;
  orderDateTo?: string;
  completionDateFrom?: string;
  completionDateTo?: string;
}

/**
 * Orders that contain this seller's items
 * Endpoint: GET /seller/orders (page, limit, status, search, orderDateFrom/To, completionDateFrom/To)
 */
export async function fetchSellerOrdersApi(filters: SellerOrderFilters = {}): Promise<SellerOrdersPage> {
  const res = await apiClient.get('/seller/orders', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status || undefined,
      search: filters.search || undefined,
      orderDateFrom: filters.orderDateFrom || undefined,
      orderDateTo: filters.orderDateTo || undefined,
      completionDateFrom: filters.completionDateFrom || undefined,
      completionDateTo: filters.completionDateTo || undefined,
    },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];

  return {
    orders: list.map(o => {
      const first = o.items?.[0];
      return {
        id: String(o._id),
        orderNo: o.orderNo || o.orderId || '',
        customer: o.customerName || '',
        firstItemTitle: first?.product?.title || '',
        firstItemBarcode: first?.product?.barcode || '',
        itemsCount: Array.isArray(o.items) ? o.items.length : 0,
        image: pickImage(first?.product?.images),
        total: Number(o.sellerTotal ?? o.totalAmount) || 0,
        status: o.orderStatus || '',
        paymentStatus: o.paymentStatus || '',
        createdAt: o.createdAt || '',
        completionDate: o.completionDate || null,
      };
    }),
    pagination: mapPagination(body.pagination),
  };
}

export interface SellerOrderDetail {
  id: string;
  orderNo: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  completionDate: string | null;
  cancelledBy: string;
  cancelReason: string;
  customer: { name: string; email: string; phone: string };
  address: {
    fullName: string;
    phone: string;
    addressLine: string;
    area: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    title: string;
    barcode: string;
    image: string | null;
    variant: string;
    quantity: number;
    price: number;
    platformFee: number;
    sellerEarnings: number;
    status: string;
  }>;
  totals: { subTotal: number; platformFee: number; earnings: number; shippingFee: number };
  shipment: {
    created: boolean;
    status: string;
    trackingNumber: string;
    trackingUrl: string;
    labelUrl: string;
    shippingCost: number;
  };
}

/**
 * One order with only this seller's items
 * Endpoint: GET /seller/orders/:orderId
 */
export async function fetchSellerOrderDetailApi(orderId: string): Promise<SellerOrderDetail> {
  const res = await apiClient.get(`/seller/orders/${orderId}`);
  const o = res.data?.data || {};
  const items: any[] = Array.isArray(o.items) ? o.items : [];
  const buyer = o.userId || {};
  const addr = o.shippingAddress || {};
  const shipment = o.shipment || {};

  return {
    id: String(o._id),
    orderNo: o.orderNo || '',
    orderId: o.orderId || '',
    status: o.orderStatus || '',
    paymentStatus: o.paymentStatus || '',
    paymentMethod: o.paymentMethod || '',
    createdAt: o.createdAt || '',
    completionDate: o.completionDate || null,
    cancelledBy: o.cancelledBy || '',
    cancelReason: o.cancelReason || '',
    customer: {
      name: [buyer.firstName, buyer.lastName].filter(Boolean).join(' ') || addr.fullName || '',
      email: buyer.email || '',
      phone: buyer.phone || '',
    },
    address: {
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine: addr.addressLine || '',
      area: addr.area || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || '',
      postalCode: addr.postalCode || '',
    },
    items: items.map((item, idx) => ({
      id: String(item._id || idx),
      title: item.productId?.title || '',
      barcode: item.productId?.barcode || '',
      image: pickImage(item.variantId?.images, item.productId?.images),
      variant: variantLabel(item.variant),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      platformFee: Number(item.platformFee) || 0,
      sellerEarnings: Number(item.sellerEarnings) || 0,
      status: item.itemStatus || '',
    })),
    totals: {
      subTotal: Number(o.totalAmount) || 0,
      platformFee: items.reduce((sum, i) => sum + (Number(i.platformFee) || 0), 0),
      earnings: items.reduce((sum, i) => sum + (Number(i.sellerEarnings) || 0), 0),
      shippingFee: Number(o.shippingFee) || 0,
    },
    shipment: {
      created: shipment.status === 'created',
      status: shipment.status || 'not_created',
      trackingNumber: shipment.trackingNumber || '',
      trackingUrl: shipment.trackingUrl || '',
      labelUrl: shipment.labelUrl || '',
      shippingCost: Number(shipment.shippingCost) || 0,
    },
  };
}

/**
 * Change the order status. The app only uses processing and cancelled; the rest happens on the website.
 * Endpoint: PUT /seller/orders/status
 */
export async function updateSellerOrderStatusApi(
  orderId: string,
  status: string,
): Promise<{ message?: string; refunded: number; orderStatus: string; completionDate: string | null }> {
  const res = await apiClient.put('/seller/orders/status', { orderId, status });
  const body = res.data || {};
  return {
    message: body.message,
    refunded: Number(body.refunded) || 0,
    orderStatus: body.data?.orderStatus || status,
    completionDate: body.data?.completionDate || null,
  };
}

// Same map as the backend and the web order page
export const ORDER_NEXT_STATUS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export interface SellerCancelledOrder {
  id: string;
  orderNo: string;
  customer: string;
  firstItemTitle: string;
  itemsCount: number;
  image: string | null;
  total: number;
  cancelledBy: string;
  cancelReason: string;
  cancelledAt: string;
  paymentStatus: string;
}

export interface SellerCancelledPage {
  orders: SellerCancelledOrder[];
  summary: { total: number; user: number; seller: number; system: number };
  pagination: SellerPagination;
}

/**
 * Cancelled orders
 * Endpoint: GET /seller/orders/cancelled (page, limit, cancelledBy, search, dateFrom, dateTo)
 */
export async function fetchSellerCancelledOrdersApi(filters: {
  page?: number;
  limit?: number;
  cancelledBy?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<SellerCancelledPage> {
  const res = await apiClient.get('/seller/orders/cancelled', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      cancelledBy: filters.cancelledBy || undefined,
      search: filters.search || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];

  return {
    orders: list.map(o => ({
      id: String(o._id),
      orderNo: o.orderNo || o.orderId || '',
      customer: o.customerName || '',
      firstItemTitle: o.items?.[0]?.product?.title || '',
      itemsCount: Array.isArray(o.items) ? o.items.length : 0,
      image: pickImage(o.items?.[0]?.product?.images),
      total: Number(o.totalAmount) || 0,
      cancelledBy: o.cancelledBy || '',
      cancelReason: o.cancelReason || '',
      cancelledAt: o.cancelledAt || '',
      paymentStatus: o.paymentStatus || '',
    })),
    summary: {
      total: Number(body.summary?.total) || 0,
      user: Number(body.summary?.user) || 0,
      seller: Number(body.summary?.seller) || 0,
      system: Number(body.summary?.system) || 0,
    },
    pagination: mapPagination(body.pagination),
  };
}

// -------------------------------------------------------------
// 3. SELLER RETURNS APIS
// -------------------------------------------------------------

export interface SellerReturn {
  id: string;
  returnNo: string;
  orderNo: string;
  customer: string;
  product: string;
  barcode: string;
  price: number;
  quantity: number;
  status: string;
  reason: string;
  paymentStatus: string;
  sellerEarnings: number;
  platformFee: number;
  shippingDeduction: number;
  trackingNumber: string;
  images: string[];
  adminNotes: string;
  rejectionReason: string;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
}

export interface SellerReturnsPage {
  returns: SellerReturn[];
  summary: { total: number; requested: number; shipped: number; approved: number; rejected: number };
  pagination: SellerPagination;
}

/**
 * Customer return requests for this seller
 * Endpoint: GET /seller/returns (page, limit, status, search)
 */
export async function fetchSellerReturnsApi(filters: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<SellerReturnsPage> {
  const res = await apiClient.get('/seller/returns', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status || undefined,
      search: filters.search || undefined,
    },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];

  return {
    returns: list.map(r => ({
      id: String(r._id),
      returnNo: r.returnNo || '',
      orderNo: r.orderNo || '',
      customer: r.customerName || '',
      product: r.productName || '',
      barcode: r.barcode || '',
      price: Number(r.price) || 0,
      quantity: Number(r.quantity) || 1,
      status: r.returnStatus || '',
      reason: r.reason || '',
      paymentStatus: r.paymentStatus || '',
      sellerEarnings: Number(r.sellerEarnings) || 0,
      platformFee: Number(r.platformFee) || 0,
      shippingDeduction: Number(r.shippingDeduction) || 0,
      trackingNumber: r.trackingNumber || '',
      images: (Array.isArray(r.images) ? r.images : []).map((img: any) => pickImage(img)).filter((u: string | null): u is string => !!u),
      adminNotes: r.adminNotes || '',
      rejectionReason: r.rejectionReason || '',
      createdAt: r.createdAt || '',
      approvedAt: r.approvedAt || null,
      rejectedAt: r.rejectedAt || null,
    })),
    summary: {
      total: Number(body.summary?.total) || 0,
      requested: Number(body.summary?.requested) || 0,
      shipped: Number(body.summary?.shipped) || 0,
      approved: Number(body.summary?.approved) || 0,
      rejected: Number(body.summary?.rejected) || 0,
    },
    pagination: mapPagination(body.pagination),
  };
}

/**
 * Endpoint: POST /seller/returns/approve
 */
export async function approveSellerReturnApi(
  returnId: string,
  adminNotes?: string,
): Promise<{ message?: string }> {
  const res = await apiClient.post('/seller/returns/approve', {
    returnId,
    adminNotes: adminNotes || undefined,
  });
  return res.data;
}

/**
 * Endpoint: POST /seller/returns/reject
 */
export async function rejectSellerReturnApi(
  returnId: string,
  rejectionReason: string,
): Promise<{ message?: string }> {
  const res = await apiClient.post('/seller/returns/reject', { returnId, rejectionReason });
  return res.data;
}

// -------------------------------------------------------------
// 4. SELLER DASHBOARD APIS
// -------------------------------------------------------------

/**
 * Seller dashboard overview (same request as the web dashboard)
 * Endpoint: GET /seller/dashboard/overview
 */
export async function fetchSellerDashboardOverviewApi(): Promise<SellerDashboardOverview> {
  const res = await apiClient.get('/seller/dashboard/overview');
  const data = res.data?.data || {};
  const sales = data.sales || {};
  const actions = data.actions || {};
  const ads = data.advertising || {};

  return {
    sales: {
      today: Number(sales.today) || 0,
      last7Days: Number(sales.last7Days) || 0,
      last30Days: Number(sales.last30Days) || 0,
      growthPercent: Number(sales.growthPercent) || 0,
      chartData: (sales.chartData || []).map((d: any) => ({
        date: d.date,
        revenue: Number(d.revenue) || 0,
      })),
    },
    actions: {
      pendingOrders: Number(actions.pendingOrders) || 0,
      pendingDocuments: Number(actions.pendingDocuments) || 0,
      orderQuestions: Number(actions.orderQuestions) || 0,
      productQuestions: Number(actions.productQuestions) || 0,
      pendingRefunds: Number(actions.pendingRefunds) || 0,
      total: Number(actions.total) || 0,
    },
    advertising: {
      activeCampaigns: Number(ads.activeCampaigns) || 0,
      last7Impressions: Number(ads.last7Days?.impressions) || 0,
      chartData: (ads.chartData || []).map((d: any) => ({
        date: d.date,
        impressions: Number(d.impressions) || 0,
      })),
    },
  };
}

// -------------------------------------------------------------
// 5. SELLER WALLET APIS
// -------------------------------------------------------------

export interface SellerWalletOverview {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  totalPlatformFees: number;
  totalShippingFees: number;
  holdDays: number;
  nextReleaseAt: string | null;
  activeRequest: { id: string; amount: number; status: string; createdAt: string } | null;
}

/**
 * Wallet balances (same request as the web wallet page)
 * Endpoint: GET /seller/wallet
 */
export async function fetchSellerWalletApi(): Promise<SellerWalletOverview> {
  const res = await apiClient.get('/seller/wallet');
  const data = res.data?.data || {};
  const wallet = data.wallet || {};
  const active = data.activeRequest;

  return {
    availableBalance: Number(wallet.availableBalance) || 0,
    pendingBalance: Number(wallet.pendingBalance) || 0,
    totalEarnings: Number(wallet.totalEarnings) || 0,
    totalWithdrawn: Number(wallet.totalWithdrawn) || 0,
    totalPlatformFees: Number(wallet.totalPlatformFees) || 0,
    totalShippingFees: Number(wallet.totalShippingFees) || 0,
    holdDays: data.holdDays === undefined || data.holdDays === null ? 20 : Number(data.holdDays),
    nextReleaseAt: data.nextReleaseAt || null,
    activeRequest: active
      ? {
          id: String(active._id),
          amount: Number(active.amount) || 0,
          status: active.status || '',
          createdAt: active.createdAt || '',
        }
      : null,
  };
}

export interface SellerEarning {
  id: string;
  orderNo: string;
  status: string;
  grossAmount: number;
  platformFee: number;
  shippingDeduction: number;
  amount: number;
  deliveredAt: string;
  availableAt: string;
}

export interface SellerEarningsPage {
  earnings: SellerEarning[];
  pagination: SellerPagination;
}

/**
 * Earnings per delivered order
 * Endpoint: GET /seller/wallet/earnings (page, limit, search, status: pending_release | available | withdrawn)
 */
export async function fetchSellerEarningsApi(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<SellerEarningsPage> {
  const res = await apiClient.get('/seller/wallet/earnings', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search || undefined,
      status: filters.status || undefined,
    },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];

  return {
    earnings: list.map(e => ({
      id: String(e._id),
      orderNo: e.orderNo || e.orderId?.orderNo || '',
      status: e.status || '',
      grossAmount: Number(e.grossAmount) || 0,
      platformFee: Number(e.platformFee) || 0,
      shippingDeduction: Number(e.shippingDeduction) || 0,
      amount: Number(e.amount) || 0,
      deliveredAt: e.deliveredAt || '',
      availableAt: e.availableAt || '',
    })),
    pagination: mapPagination(body.pagination),
  };
}

export interface SellerTransaction {
  id: string;
  type: string;
  amount: number;
  orderNo: string;
  description: string;
  createdAt: string;
  incoming: boolean;
}

export interface SellerTransactionsPage {
  transactions: SellerTransaction[];
  pagination: SellerPagination;
}

// Same direction rule as the web wallet and transactions pages
const INCOMING_TYPES = ['seller_earning_hold', 'seller_earning_release', 'withdrawal_rejected'];
const OUTGOING_TYPES = ['platform_fee', 'shipping_fee', 'refund', 'withdrawal_request', 'withdrawal_success'];

function isIncomingTransaction(type: string, toUserId: string): boolean {
  const t = (type || '').toLowerCase();
  if (INCOMING_TYPES.includes(t)) return true;
  if (OUTGOING_TYPES.includes(t)) return false;
  return !!toUserId;
}

/**
 * Money movements of this seller
 * Endpoint: GET /seller/transactions (page, limit, search, type)
 */
export async function fetchSellerTransactionsApi(
  sellerUserId: string,
  filters: { page?: number; limit?: number; search?: string; type?: string },
): Promise<SellerTransactionsPage> {
  const res = await apiClient.get('/seller/transactions', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search || undefined,
      type: filters.type || undefined,
    },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];

  return {
    transactions: list.map(t => {
      const toId = String(t.toUserId?._id || t.toUserId || '');
      return {
        id: String(t._id),
        type: t.type || '',
        amount: Number(t.amount) || 0,
        orderNo: t.orderNo || '',
        description: t.description || '',
        createdAt: t.createdAt || '',
        incoming: isIncomingTransaction(t.type, toId && toId === sellerUserId ? toId : ''),
      };
    }),
    pagination: mapPagination(body.pagination),
  };
}

export interface SellerWithdrawRequest {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountLast4: string;
  createdAt: string;
  processedAt: string | null;
  adminNote: string;
}

export interface SellerWithdrawRequestsPage {
  requests: SellerWithdrawRequest[];
  pagination: SellerPagination;
}

/**
 * Endpoint: GET /seller/wallet/withdraw-requests (page, limit)
 */
export async function fetchSellerWithdrawRequestsApi(filters: {
  page?: number;
  limit?: number;
}): Promise<SellerWithdrawRequestsPage> {
  const res = await apiClient.get('/seller/wallet/withdraw-requests', {
    params: { page: filters.page || 1, limit: filters.limit || 10 },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];

  return {
    requests: list.map(r => ({
      id: String(r._id),
      amount: Number(r.amount) || 0,
      status: r.status || '',
      bankName: r.bankDetails?.bankName || '',
      accountLast4: r.bankDetails?.accountNumber ? String(r.bankDetails.accountNumber).slice(-4) : '',
      createdAt: r.createdAt || '',
      processedAt: r.processedAt || null,
      adminNote: r.adminNote || '',
    })),
    pagination: mapPagination(body.pagination),
  };
}

/**
 * Endpoint: POST /seller/wallet/withdraw-request
 */
export async function requestSellerWithdrawalApi(amount: number): Promise<{ message?: string }> {
  const res = await apiClient.post('/seller/wallet/withdraw-request', { amount });
  return res.data;
}

/**
 * Cancel a pending withdrawal request
 * Endpoint: DELETE /seller/wallet/withdraw-request/:id
 */
export async function cancelSellerWithdrawRequestApi(id: string): Promise<{ message?: string }> {
  const res = await apiClient.delete(`/seller/wallet/withdraw-request/${id}`);
  return res.data;
}

export interface SellerBankDetails {
  bankName: string;
  accountNumber: string;
  accountTitle: string;
}

/**
 * Saved bank details from the seller profile (null when none are saved)
 * Endpoint: GET /seller/profile/me
 */
export async function fetchSellerBankDetailsApi(): Promise<SellerBankDetails | null> {
  const res = await apiClient.get('/seller/profile/me');
  const bank = res.data?.data?.bankDetails;
  if (!bank?.accountNumber) return null;
  return {
    bankName: bank.bankName || '',
    accountNumber: String(bank.accountNumber),
    accountTitle: bank.accountTitle || '',
  };
}

// -------------------------------------------------------------
// 6. SELLER REPORTS APIS
// -------------------------------------------------------------

export interface SellerStatementRow {
  id: string;
  orderNo: string;
  customer: string;
  products: string;
  orderAmount: number;
  holdAmount: number;
  availableEarnings: number;
  status: string;
}

export interface SellerStatementGroup {
  date: string;
  orderCount: number;
  total: number;
  rows: SellerStatementRow[];
}

export interface SellerStatement {
  summary: { totalRevenue: number; totalEarned: number; totalPending: number; totalOrders: number };
  groups: SellerStatementGroup[];
}

/**
 * Account statement for a date range (same request as the web reports page)
 * Endpoint: GET /seller/reports/statement (startDate, endDate as ISO strings)
 */
export async function fetchSellerStatementApi(startDate: string, endDate: string): Promise<SellerStatement> {
  const res = await apiClient.get('/seller/reports/statement', { params: { startDate, endDate } });
  const data = res.data?.data || {};
  const groups: any[] = Array.isArray(data.groupedTransactions) ? data.groupedTransactions : [];

  return {
    summary: {
      totalRevenue: Number(data.summary?.totalRevenue) || 0,
      totalEarned: Number(data.summary?.totalEarned) || 0,
      totalPending: Number(data.summary?.totalPending) || 0,
      totalOrders: Number(data.summary?.totalOrders) || 0,
    },
    groups: groups.map(g => {
      const rows: SellerStatementRow[] = (g.transactions || []).map((t: any, idx: number) => ({
        id: String(t._id || idx),
        orderNo: t.orderNo || '',
        customer: t.customerName || '',
        products: t.productNamesStr || '',
        orderAmount: Number(t.orderAmount) || 0,
        holdAmount: Number(t.holdAmount) || 0,
        availableEarnings: Number(t.availableEarnings) || 0,
        status: t.orderStatus || '',
      }));
      return {
        date: g.date,
        orderCount: Number(g.orderCount) || rows.length,
        total: rows.reduce((sum, r) => sum + r.orderAmount, 0),
        rows,
      };
    }),
  };
}

// -------------------------------------------------------------
// 7. SELLER ENQUIRIES (QUERIES) APIS
// -------------------------------------------------------------

// 'customer' = product or store question, 'order' = order question (backend values)
export type SellerQueryType = 'customer' | 'order';

export interface SellerEnquiry {
  id: string;
  queryId: string;
  type: SellerQueryType;
  customerName: string;
  subject: string;
  status: string;
  orderNo: string;
  unread: number;
  updatedAt: string;
}

export interface SellerEnquiriesPage {
  queries: SellerEnquiry[];
  pagination: SellerPagination;
}

/**
 * Endpoint: GET /seller/queries (page, limit, type, status: open|replied|closed, customerName)
 */
export async function fetchSellerQueriesApi(filters: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  customerName?: string;
}): Promise<SellerEnquiriesPage> {
  const res = await apiClient.get('/seller/queries', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 15,
      type: filters.type || undefined,
      status: filters.status || undefined,
      customerName: filters.customerName || undefined,
    },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];

  return {
    queries: list.map(q => ({
      id: String(q._id),
      queryId: q.queryId || '',
      type: q.queryType === 'order' ? 'order' : 'customer',
      customerName: q.customerName || '',
      subject: q.subject || '',
      status: q.status || 'open',
      orderNo: q.orderNo || '',
      unread: Number(q.sellerUnread) || 0,
      updatedAt: q.updatedAt || q.createdAt || '',
    })),
    pagination: {
      currentPage: Number(body.pagination?.page) || 1,
      totalPages: Number(body.pagination?.pages) || 1,
      totalItems: Number(body.pagination?.total) || 0,
    },
  };
}

export interface SellerQueryStats {
  open: number;
  replied: number;
  closed: number;
  unread: number;
}

/**
 * Endpoint: GET /seller/queries/stats
 */
export async function fetchSellerQueryStatsApi(): Promise<SellerQueryStats> {
  const res = await apiClient.get('/seller/queries/stats');
  const data = res.data?.data || {};
  return {
    open: Number(data.open) || 0,
    replied: Number(data.replied) || 0,
    closed: Number(data.closed) || 0,
    unread: Number(data.unread) || 0,
  };
}

export interface SellerQueryCounts {
  all: number;
  open: number;
  replied: number;
  closed: number;
}

/**
 * /seller/queries/stats counts both query types together, so it cannot match one tab.
 * Counts for one tab come from the list endpoint itself (the total of a one item request
 * per status), and All is the sum, so All always equals Open + Replied + Closed.
 */
export async function fetchSellerQueryCountsApi(type: SellerQueryType): Promise<SellerQueryCounts> {
  const [open, replied, closed] = await Promise.all(
    ['open', 'replied', 'closed'].map(status =>
      fetchSellerQueriesApi({ page: 1, limit: 1, type, status }).then(r => r.pagination.totalItems),
    ),
  );
  return { all: open + replied + closed, open, replied, closed };
}

export interface SellerQueryMessage {
  id: string;
  fromSeller: boolean;
  senderName: string;
  message: string;
  attachments: string[];
  createdAt: string;
}

export interface SellerQueryDetail {
  id: string;
  queryId: string;
  type: SellerQueryType;
  status: string;
  subject: string;
  customer: { name: string; email: string; phone: string; photo: string | null };
  orderId: string;
  orderNo: string;
  orderStatus: string;
  orderAmount: number | null;
  createdAt: string;
  messages: SellerQueryMessage[];
}

function mapQueryMessages(list: any): SellerQueryMessage[] {
  return (Array.isArray(list) ? list : []).map((m: any, idx: number) => ({
    id: String(m._id || idx),
    fromSeller: m.senderRole === 'seller',
    senderName: m.senderName || '',
    message: m.message || '',
    attachments: Array.isArray(m.attachments) ? m.attachments : [],
    createdAt: m.createdAt || '',
  }));
}

/**
 * One enquiry with its messages (also marks it as read)
 * Endpoint: GET /seller/queries/:id
 */
export async function fetchSellerQueryDetailApi(id: string): Promise<SellerQueryDetail> {
  const res = await apiClient.get(`/seller/queries/${id}`);
  const q = res.data?.data || {};
  const customer = q.customerId || {};
  const order = q.orderId || {};

  return {
    id: String(q._id),
    queryId: q.queryId || '',
    type: q.queryType === 'order' ? 'order' : 'customer',
    status: q.status || 'open',
    subject: q.subject || '',
    customer: {
      name: customer.name || q.customerName || '',
      email: customer.email || q.customerEmail || '',
      phone: customer.phone || '',
      photo: pickImage(customer.avatar),
    },
    orderId: order._id ? String(order._id) : '',
    orderNo: order.orderNo || q.orderNo || '',
    orderStatus: order.orderStatus || '',
    orderAmount: order.totalAmount === undefined || order.totalAmount === null ? null : Number(order.totalAmount),
    createdAt: q.createdAt || '',
    messages: mapQueryMessages(q.messages),
  };
}

/**
 * Endpoint: POST /seller/queries/:id/reply
 */
export async function replySellerQueryApi(
  id: string,
  message: string,
): Promise<{ message?: string; status: string; messages: SellerQueryMessage[] }> {
  const res = await apiClient.post(`/seller/queries/${id}/reply`, { message });
  return {
    message: res.data?.message,
    status: res.data?.data?.status || 'replied',
    messages: mapQueryMessages(res.data?.data?.messages),
  };
}

/**
 * Close or reopen an enquiry
 * Endpoint: PATCH /seller/queries/:id/status
 */
export async function updateSellerQueryStatusApi(
  id: string,
  status: 'open' | 'closed',
): Promise<{ message?: string; status: string }> {
  const res = await apiClient.patch(`/seller/queries/${id}/status`, { status });
  return { message: res.data?.message, status: res.data?.data?.status || status };
}

// -------------------------------------------------------------
// 8. SELLER ADS APIS
// -------------------------------------------------------------

export interface SellerAdCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  totalBudget: number;
  dailyBudget: number;
  spentBudget: number;
  remainingBudget: number;
  biddingType: string;
  impressions: number;
  clicks: number;
  products: string[];
  rejectionReason: string;
  cardLabel: string;
}

export interface SellerAdsPage {
  campaigns: SellerAdCampaign[];
  pagination: SellerPagination;
}

export interface SellerAdsSummary {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
}

function mapCampaign(c: any): SellerAdCampaign {
  const card = c.paymentMethod;
  return {
    id: String(c._id),
    name: c.name || '',
    type: c.type || '',
    status: c.status || 'draft',
    bannerUrl: pickImage(c.bannerUrl),
    startDate: c.startDate || '',
    endDate: c.endDate || '',
    totalBudget: Number(c.totalBudget) || 0,
    dailyBudget: Number(c.dailyBudget) || 0,
    spentBudget: Number(c.spentBudget) || 0,
    remainingBudget: Number(c.remainingBudget) || 0,
    biddingType: c.biddingType || '',
    impressions: Number(c.totalImpressions) || 0,
    clicks: Number(c.totalClicks) || 0,
    products: (Array.isArray(c.productIds) ? c.productIds : [])
      .map((p: any) => p?.title)
      .filter(Boolean),
    rejectionReason: c.rejectionReason || '',
    cardLabel: card?.last4 ? `${card.brand ? `${card.brand} ` : ''}****${card.last4}` : '',
  };
}

/**
 * Endpoint: GET /seller/ads/campaigns (page, limit, status)
 */
export async function fetchSellerCampaignsApi(params: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<SellerAdsPage> {
  const res = await apiClient.get('/seller/ads/campaigns', {
    params: { page: params.page || 1, limit: params.limit || 10, status: params.status || undefined },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];
  return {
    campaigns: list.map(mapCampaign),
    pagination: {
      currentPage: Number(body.pagination?.page) || 1,
      totalPages: Number(body.pagination?.pages) || 1,
      totalItems: Number(body.pagination?.total) || 0,
    },
  };
}

/**
 * Endpoint: GET /seller/ads/analytics/summary
 */
export async function fetchSellerAdsSummaryApi(): Promise<SellerAdsSummary> {
  const res = await apiClient.get('/seller/ads/analytics/summary');
  const totals = res.data?.data?.totals || {};
  return {
    impressions: Number(totals.impressions) || 0,
    clicks: Number(totals.clicks) || 0,
    spend: Number(totals.spend) || 0,
    ctr: Number(totals.ctr) || 0,
  };
}

/**
 * Endpoints: POST /seller/ads/campaigns/:id/(pause|resume|submit) and DELETE /seller/ads/campaigns/:id
 * Each returns the backend message and, except delete, the campaign with its new status.
 */
export async function runSellerCampaignActionApi(
  id: string,
  action: 'pause' | 'resume' | 'submit' | 'delete',
): Promise<{ message?: string; campaign: SellerAdCampaign | null }> {
  const res =
    action === 'delete'
      ? await apiClient.delete(`/seller/ads/campaigns/${id}`)
      : await apiClient.post(`/seller/ads/campaigns/${id}/${action}`);
  return {
    message: res.data?.message,
    campaign: res.data?.data ? mapCampaign({ ...res.data.data, productIds: [] }) : null,
  };
}

export interface SellerAdSettings {
  minDailyBudget: number;
  minTotalBudget: number;
  costPerClick: number;
  costPerThousandImpressions: number;
  isEnabled: boolean;
}

/**
 * Endpoint: GET /seller/ads/settings
 */
export async function fetchSellerAdSettingsApi(): Promise<SellerAdSettings> {
  const res = await apiClient.get('/seller/ads/settings');
  const d = res.data?.data || {};
  return {
    minDailyBudget: Number(d.minDailyBudget) || 0,
    minTotalBudget: Number(d.minTotalBudget) || 0,
    costPerClick: Number(d.costPerClick) || 0,
    costPerThousandImpressions: Number(d.costPerThousandImpressions) || 0,
    isEnabled: d.isEnabled !== false,
  };
}

export interface SellerAdCard {
  id: string;
  brand: string;
  last4: string;
  holderName: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

/**
 * Saved cards only. Adding a card posts the raw card number, so it stays on the website.
 * Endpoint: GET /seller/ads/payment/methods
 */
export async function fetchSellerAdCardsApi(): Promise<SellerAdCard[]> {
  const res = await apiClient.get('/seller/ads/payment/methods');
  const list: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.map(m => ({
    id: String(m._id),
    brand: m.brand || '',
    last4: m.last4 || '',
    holderName: m.holderName || '',
    expMonth: Number(m.expMonth) || 0,
    expYear: Number(m.expYear) || 0,
    isDefault: !!m.isDefault,
  }));
}

/**
 * Creates the draft (multipart, banner only for sponsored_store). Endpoint: POST /seller/ads/campaigns
 */
export async function createSellerCampaignApi(
  payload: FormData,
): Promise<{ id: string; message?: string }> {
  const res = await apiClient.post('/seller/ads/campaigns', payload, { timeout: 120000 });
  return { id: String(res.data?.data?._id || ''), message: res.data?.message };
}

export interface SellerImportRecord {
  id: string;
  fileName: string;
  status: string;
  totalProducts: number;
  imported: number;
  skipped: number;
  createdAt: string;
  errors: Array<{ modelNumber: string; reason: string }>;
}

/**
 * Past CSV imports (the file itself is imported on the website)
 * Endpoint: GET /seller/product/import-history (page, limit)
 */
export async function fetchSellerImportHistoryApi(params: {
  page?: number;
  limit?: number;
}): Promise<{ records: SellerImportRecord[]; pagination: SellerPagination }> {
  const res = await apiClient.get('/seller/product/import-history', {
    params: { page: params.page || 1, limit: params.limit || 10 },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];
  return {
    records: list.map(r => ({
      id: String(r._id),
      fileName: r.fileName || 'import.csv',
      status: r.status || '',
      totalProducts: Number(r.totalProducts) || 0,
      imported: Number(r.imported) || 0,
      skipped: Number(r.skipped) || 0,
      createdAt: r.createdAt || '',
      errors: (Array.isArray(r.errors) ? r.errors : []).map((e: any) => ({
        modelNumber: e?.modelNumber || '',
        reason: e?.reason || '',
      })),
    })),
    pagination: mapPagination(body.pagination),
  };
}

// 8b. SELLER INVOICES APIS
// -------------------------------------------------------------

export interface SellerInvoice {
  id: string;
  number: string;
  pdfUrl: string;
  status: string;
  rejectionReason: string;
  submittedAt: string;
  approvedAt: string | null;
  createdAt: string;
}

export interface SellerInvoicesPage {
  invoices: SellerInvoice[];
  pagination: SellerPagination;
}

/**
 * Endpoint: GET /seller/invoices (page, limit, status)
 */
export async function fetchSellerInvoicesApi(params: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<SellerInvoicesPage> {
  const res = await apiClient.get('/seller/invoices', {
    params: { page: params.page || 1, limit: params.limit || 10, status: params.status || undefined },
  });
  const body = res.data || {};
  const list: any[] = Array.isArray(body.data) ? body.data : [];
  return {
    invoices: list.map(i => ({
      id: String(i._id),
      number: i.invoiceNumber || i.invoiceCode || '',
      pdfUrl: typeof i.pdfUrl === 'string' ? i.pdfUrl : '',
      status: i.status || '',
      rejectionReason: i.rejectionReason || '',
      submittedAt: i.submissionDate || i.createdAt || '',
      approvedAt: i.approvedAt || null,
      createdAt: i.createdAt || '',
    })),
    pagination: {
      currentPage: Number(body.pagination?.page) || 1,
      totalPages: Number(body.pagination?.pages) || 1,
      totalItems: Number(body.pagination?.total) || 0,
    },
  };
}

/**
 * The backend has no counts endpoint, so each count is the total of a one item request.
 */
export async function fetchSellerInvoiceCountsApi(): Promise<Record<string, number>> {
  const statuses = ['', 'submitted', 'approved', 'rejected'];
  const totals = await Promise.all(
    statuses.map(status =>
      apiClient
        .get('/seller/invoices', { params: { page: 1, limit: 1, status: status || undefined } })
        .then(res => Number(res.data?.pagination?.total) || 0),
    ),
  );
  return { '': totals[0], submitted: totals[1], approved: totals[2], rejected: totals[3] };
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// 9. SELLER REVIEWS APIS
// -------------------------------------------------------------

export interface SellerReview {
  id: string;
  customer: string;
  customerPhoto: string | null;
  rating: number | null;
  comment: string;
  productTitle: string;
  productImage: string | null;
  images: string[];
  hasVideo: boolean;
  createdAt: string;
}

export interface SellerReviewsPage {
  reviews: SellerReview[];
  pagination: SellerPagination;
}

/**
 * Reviews on this seller's products
 * Endpoint: GET /seller/reviews (page, limit, search, rating)
 */
export async function fetchSellerReviewsApi(filters: {
  page?: number;
  limit?: number;
  search?: string;
  rating?: string;
}): Promise<SellerReviewsPage> {
  const res = await apiClient.get('/seller/reviews', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 20,
      search: filters.search || undefined,
      rating: filters.rating || undefined,
    },
    headers: { 'Cache-Control': 'no-cache' },
  });
  const body = res.data;
  // A reply that is not the reviews list is an error, never an empty list
  if (!body || typeof body !== 'object' || body.success === false || !Array.isArray(body.data)) {
    throw new Error(body?.message || i18n.t('sellerAuto.theServerSentAnUnexpected'));
  }
  const list: any[] = body.data;

  return {
    reviews: list.map(r => ({
      id: String(r._id),
      customer: r.userId?.name || '',
      customerPhoto: r.userId?.profilePhoto || null,
      rating: r.rating === undefined || r.rating === null ? null : Number(r.rating),
      comment: r.comment || '',
      productTitle: r.productId?.title || '',
      productImage: pickImage(r.productId?.images),
      images: (Array.isArray(r.images) ? r.images : []).map((img: any) => img?.url).filter(Boolean),
      hasVideo: !!r.video?.url,
      createdAt: r.createdAt || '',
    })),
    pagination: {
      currentPage: Number(body.pagination?.page) || 1,
      totalPages: Number(body.pagination?.pages) || 1,
      totalItems: Number(body.pagination?.total) || 0,
    },
  };
}

/**
 * Endpoint: DELETE /seller/reviews/:id
 */
export async function deleteSellerReviewApi(reviewId: string): Promise<{ message?: string }> {
  const res = await apiClient.delete(`/seller/reviews/${reviewId}`);
  return res.data;
}

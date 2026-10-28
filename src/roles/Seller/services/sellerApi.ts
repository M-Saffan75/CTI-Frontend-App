import apiClient from '@/services/apiClient';
import { demoProductPhoto } from '@/assets/images';

export interface SellerProductItem {
  id: string;
  _id?: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  priceNum: number;
  status: string;
  isActive: boolean;
  image: any;
  category?: string;
  brand?: string;
  stock?: number;
}

export interface SellerOrderItem {
  id: string;
  _id?: string;
  trackingId: string;
  orderNumber: string;
  orderNo?: string;
  customer: string;
  item: string;
  itemSku: string;
  completedDate: string;
  total: string;
  totalNum: number;
  status: string;
  itemsCount?: number;
}

export interface SellerReturnItem {
  id: string;
  _id?: string;
  returnNo: string;
  orderId: string;
  customer: string;
  item: string;
  reason: string;
  date: string;
  status: string;
  amount: string;
  images?: string[];
  notes?: string;
}

export interface SellerDashboardStats {
  totalEarnings: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  growth: {
    earnings: string;
    orders: string;
  };
  recentOrders: SellerOrderItem[];
}

export interface SellerWalletData {
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  activeRequest?: {
    id: string;
    amount: number;
    createdAt: string;
    status: string;
  } | null;
}

// -------------------------------------------------------------
// 1. PRODUCTS APIS
// -------------------------------------------------------------

/**
 * Fetch seller's own products list with pagination & filters
 * Endpoint: GET /seller/product
 */
export async function fetchSellerProductsApi(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  brand?: string;
} = {}): Promise<{
  products: SellerProductItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit || 10));
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status.toLowerCase());
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.brand && params.brand !== 'All') query.append('brand', params.brand);

    const res = await apiClient.get(`/seller/product?${query.toString()}`);
    const data = res.data?.data || res.data?.products || [];
    const pagination = res.data?.pagination || {
      total: data.length,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: Math.ceil((data.length || 1) / (params.limit || 10)),
    };

    const mapped: SellerProductItem[] = data.map((item: any) => {
      const pId = item._id || item.id || `prd-${Math.random()}`;
      const img = item.images?.[0]?.url || item.images?.[0] || item.thumbnail || item.image;
      return {
        id: pId,
        _id: pId,
        name: item.title || item.name || 'Unnamed Product',
        sku: item.sku || item.modelNumber || 'N/A',
        description: item.shortDescription || item.description || 'No description provided.',
        price: typeof item.basePrice === 'number' ? `$${item.basePrice.toFixed(2)}` : (item.price || '$0.00'),
        priceNum: item.basePrice || item.priceNum || 0,
        status: item.isActive ? 'Active' : 'Disable',
        isActive: Boolean(item.isActive),
        image: img ? { uri: img } : demoProductPhoto,
        category: item.category?.name || item.category,
        brand: item.brand?.name || item.brand,
        stock: item.stock || 0,
      };
    });

    return { products: mapped, pagination };
  } catch (error) {
    console.log('[sellerApi] fetchSellerProductsApi error:', error);
    return {
      products: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  }
}

/**
 * Fetch Product Categories for filtering & creation
 * Endpoint: GET /seller/product/categories
 */
export async function fetchProductCategoriesApi(): Promise<Array<{ id: string; name: string }>> {
  try {
    const res = await apiClient.get('/seller/product/categories');
    const data = res.data?.data || res.data || [];
    return data.map((c: any) => ({
      id: c._id || c.id,
      name: c.name || c.title || 'Category',
    }));
  } catch {
    return [
      { id: '1', name: 'Smartphones' },
      { id: '2', name: 'Laptops' },
      { id: '3', name: 'Accessories' },
      { id: '4', name: 'Gadgets' },
    ];
  }
}

/**
 * Fetch Product Brands
 * Endpoint: GET /seller/product/all-brands
 */
export async function fetchProductBrandsApi(): Promise<Array<{ id: string; name: string }>> {
  try {
    const res = await apiClient.get('/seller/product/all-brands');
    const data = res.data?.data || res.data || [];
    return data.map((b: any) => ({
      id: b._id || b.id,
      name: b.name || b.title || 'Brand',
    }));
  } catch {
    return [
      { id: '1', name: 'Apple' },
      { id: '2', name: 'Samsung' },
      { id: '3', name: 'Dell' },
      { id: '4', name: 'HP' },
      { id: '5', name: 'Sony' },
    ];
  }
}

/**
 * Create a new product (handles Multipart / FormData or JSON)
 * Endpoint: POST /seller/product
 */
export async function createSellerProductApi(payload: FormData | any): Promise<any> {
  const isFormData = payload instanceof FormData;
  const config = isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined;
  const res = await apiClient.post('/seller/product', payload, config);
  return res.data;
}

/**
 * Toggle active/disable status of a product
 * Endpoint: PATCH /seller/product/:id/toggle
 */
export async function toggleProductStatusApi(productId: string): Promise<any> {
  const res = await apiClient.patch(`/seller/product/${productId}/toggle`);
  return res.data;
}

/**
 * Delete a product
 * Endpoint: DELETE /seller/product/:id
 */
export async function deleteSellerProductApi(productId: string): Promise<any> {
  const res = await apiClient.delete(`/seller/product/${productId}`);
  return res.data;
}

// -------------------------------------------------------------
// 2. SELLER ORDERS APIS
// -------------------------------------------------------------

/**
 * Fetch orders received by the seller
 * Endpoint: GET /seller/orders
 */
export async function fetchSellerOrdersApi(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<{
  orders: SellerOrderItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit || 10));
    if (params.status && params.status !== 'All' && params.status !== 'All Order' && params.status !== 'All statuses') {
      query.append('status', params.status.toLowerCase());
    }
    if (params.search) query.append('search', params.search);

    const res = await apiClient.get(`/seller/orders?${query.toString()}`);
    const data = res.data?.data || res.data?.orders || [];
    const pagination = res.data?.pagination || {
      total: data.length,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: Math.ceil((data.length || 1) / (params.limit || 10)),
    };

    const mapped: SellerOrderItem[] = data.map((o: any, idx: number) => {
      const oId = o._id || o.id || `ord-${idx + 1}`;
      const firstItem = o.items?.[0] || {};
      const prod = firstItem.productId || firstItem.product || {};
      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '7/1/2026';

      return {
        id: oId,
        _id: oId,
        trackingId: o.trackingId || o.trackingNumber || `TRB-${Math.floor(100000 + Math.random() * 900000)}`,
        orderNumber: o.orderNo || o.orderNumber || `ORD-${oId.slice(-8).toUpperCase()} - ${dateStr}`,
        orderNo: o.orderNo || o.orderNumber,
        customer: o.user?.name || o.customerName || o.shippingAddress?.fullName || 'Customer User',
        item: prod.title || prod.name || firstItem.name || 'Electronic Gadget',
        itemSku: prod.sku || firstItem.itemSku || `PRD${oId.slice(-6).toUpperCase()}`,
        completedDate: o.completedAt ? new Date(o.completedAt).toLocaleDateString() : dateStr,
        total: typeof o.totalAmount === 'number' ? `$${o.totalAmount.toFixed(2)}` : (o.total || '$0.00'),
        totalNum: o.totalAmount || o.total || 0,
        status: (o.orderStatus || o.status || 'Pending').charAt(0).toUpperCase() + (o.orderStatus || o.status || 'pending').slice(1),
        itemsCount: o.items?.length || 1,
      };
    });

    return { orders: mapped, pagination };
  } catch (error) {
    console.log('[sellerApi] fetchSellerOrdersApi error:', error);
    return {
      orders: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  }
}

/**
 * Update order status (e.g. 'processing', 'shipped', 'delivered')
 * Endpoint: PUT /seller/orders/status
 */
export async function updateSellerOrderStatusApi(orderId: string, status: string): Promise<any> {
  const res = await apiClient.put('/seller/orders/status', {
    orderId,
    status: status.toLowerCase(),
  });
  return res.data;
}

// -------------------------------------------------------------
// 3. SELLER RETURNS APIS
// -------------------------------------------------------------

/**
 * Fetch customer return requests for this seller
 * Endpoint: GET /seller/returns
 */
export async function fetchSellerReturnsApi(params: {
  status?: string;
  search?: string;
} = {}): Promise<SellerReturnItem[]> {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'All') query.append('status', params.status.toLowerCase());
    if (params.search) query.append('search', params.search);

    const res = await apiClient.get(`/seller/returns?${query.toString()}`);
    const data = res.data?.data || res.data || [];

    return data.map((r: any, idx: number) => {
      const rId = r._id || r.id || `ret-${idx + 1}`;
      const prod = r.order?.items?.[0]?.productId || r.product || {};
      return {
        id: rId,
        _id: rId,
        returnNo: r.returnNumber || `RET-${rId.slice(-6).toUpperCase()}`,
        orderId: r.orderNo || r.order?.orderNo || `ORD-${rId.slice(-6).toUpperCase()}`,
        customer: r.user?.name || r.customerName || 'Customer User',
        item: prod.title || prod.name || r.itemName || 'Returned Item',
        reason: r.reason || 'Item not as expected',
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '7/1/2026',
        status: (r.status || 'Requested').charAt(0).toUpperCase() + (r.status || 'requested').slice(1),
        amount: typeof r.refundAmount === 'number' ? `$${r.refundAmount.toFixed(2)}` : '$45.00',
        images: r.images || [],
        notes: r.adminNotes || '',
      };
    });
  } catch (error) {
    console.log('[sellerApi] fetchSellerReturnsApi error:', error);
    return [];
  }
}

/**
 * Approve Return Request
 * Endpoint: POST /seller/returns/approve
 */
export async function approveSellerReturnApi(returnId: string, adminNotes?: string): Promise<any> {
  const res = await apiClient.post('/seller/returns/approve', { returnId, adminNotes });
  return res.data;
}

/**
 * Reject Return Request
 * Endpoint: POST /seller/returns/reject
 */
export async function rejectSellerReturnApi(returnId: string, rejectionReason: string): Promise<any> {
  const res = await apiClient.post('/seller/returns/reject', { returnId, rejectionReason });
  return res.data;
}

// -------------------------------------------------------------
// 4. SELLER DASHBOARD & WALLET APIS
// -------------------------------------------------------------

/**
 * Fetch Seller Dashboard Overview
 * Endpoint: GET /seller/dashboard/overview
 */
export async function fetchSellerDashboardOverviewApi(): Promise<SellerDashboardStats> {
  try {
    const res = await apiClient.get('/seller/dashboard/overview');
    const data = res.data?.data || res.data || {};
    return {
      totalEarnings: data.totalEarnings || data.totalRevenue || 0,
      totalOrders: data.totalOrders || 0,
      pendingOrders: data.pendingOrders || 0,
      totalProducts: data.totalProducts || 0,
      growth: {
        earnings: data.growth?.earnings || '+12.5%',
        orders: data.growth?.orders || '+8.2%',
      },
      recentOrders: (data.recentOrders || []).map((o: any, idx: number) => ({
        id: o._id || String(idx),
        trackingId: o.trackingId || `TRB-${o._id?.slice(-6) || idx}`,
        orderNumber: o.orderNo || `ORD-${o._id?.slice(-6) || idx}`,
        customer: o.user?.name || o.customerName || 'Customer',
        item: o.items?.[0]?.productId?.title || 'Product Item',
        itemSku: o.items?.[0]?.productId?.sku || 'SKU-001',
        completedDate: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Today',
        total: typeof o.totalAmount === 'number' ? `$${o.totalAmount.toFixed(2)}` : '$0.00',
        totalNum: o.totalAmount || 0,
        status: o.orderStatus || 'Pending',
      })),
    };
  } catch (error) {
    if (__DEV__) console.log('[sellerApi] fetchSellerDashboardOverviewApi error:', error);
    return {
      totalEarnings: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalProducts: 0,
      growth: {
        earnings: '0%',
        orders: '0%',
      },
      recentOrders: [],
    };
  }
}

/**
 * Fetch Seller Wallet balance & details
 * Endpoint: GET /seller/wallet
 */
export async function fetchSellerWalletApi(): Promise<SellerWalletData> {
  try {
    const res = await apiClient.get('/seller/wallet');
    const data = res.data?.data || res.data || {};
    return {
      availableBalance: data.availableBalance || data.balance || 0,
      pendingBalance: data.pendingBalance || 0,
      totalWithdrawn: data.totalWithdrawn || 0,
      activeRequest: data.activeRequest
        ? {
            id: data.activeRequest._id || data.activeRequest.id,
            amount: data.activeRequest.amount,
            createdAt: data.activeRequest.createdAt,
            status: data.activeRequest.status,
          }
        : null,
    };
  } catch (error) {
    if (__DEV__) console.log('[sellerApi] fetchSellerWalletApi error:', error);
    return {
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      activeRequest: null,
    };
  }
}

/**
 * Request Wallet Payout
 * Endpoint: POST /seller/wallet/withdraw-request
 */
export async function requestSellerWithdrawalApi(amount: number): Promise<any> {
  const res = await apiClient.post('/seller/wallet/withdraw-request', { amount });
  return res.data;
}

/**
 * Fetch Seller Transactions
 * Endpoint: GET /seller/transactions
 */
export async function fetchSellerTransactionsApi(page: number = 1, limit: number = 10): Promise<any[]> {
  try {
    const res = await apiClient.get(`/seller/transactions?page=${page}&limit=${limit}`);
    return res.data?.data || res.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch Seller Queries / Enquiries
 * Endpoint: GET /seller/queries
 */
export async function fetchSellerQueriesApi(status?: string): Promise<any[]> {
  try {
    const url = status && status !== 'all' ? `/seller/queries?status=${status}` : '/seller/queries';
    const res = await apiClient.get(url);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch Seller Ads / Campaigns
 * Endpoint: GET /seller/ads
 */
export async function fetchSellerAdsApi(): Promise<any[]> {
  try {
    const res = await apiClient.get('/seller/ads');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Create Seller Ad Campaign
 * Endpoint: POST /seller/ads
 */
export async function createSellerAdApi(payload: any): Promise<any> {
  const res = await apiClient.post('/seller/ads', payload);
  return res.data;
}

/**
 * Fetch Seller Product Reviews
 * Endpoint: GET /seller/reviews
 */
export async function fetchSellerReviewsApi(params: {
  search?: string;
  rating?: string | number;
  page?: number;
  limit?: number;
} = {}): Promise<{
  reviews: any[];
  total: number;
  totalPages: number;
  stats?: { avgRating: number; withRating: number };
}> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.rating && params.rating !== 'All') query.append('rating', String(params.rating));
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit || 15));

    const res = await apiClient.get(`/seller/reviews?${query.toString()}`);
    if (res.data?.success) {
      return {
        reviews: res.data.reviews || res.data.data || [],
        total: res.data.total || (res.data.reviews || []).length,
        totalPages: res.data.totalPages || 1,
        stats: res.data.stats,
      };
    }
    return { reviews: [], total: 0, totalPages: 1 };
  } catch (error) {
    if (__DEV__) console.log('[sellerApi] fetchSellerReviewsApi error:', error);
    return { reviews: [], total: 0, totalPages: 1 };
  }
}

/**
 * Delete a Product Review
 * Endpoint: DELETE /seller/reviews/:id
 */
export async function deleteSellerReviewApi(reviewId: string): Promise<boolean> {
  try {
    const res = await apiClient.delete(`/seller/reviews/${reviewId}`);
    return Boolean(res.data?.success);
  } catch {
    return false;
  }
}


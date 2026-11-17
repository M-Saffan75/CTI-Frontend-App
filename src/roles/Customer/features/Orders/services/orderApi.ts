import apiClient from '@/services/apiClient';
import { pickImageUrl } from '@/utils/imageUtils';
import dayjs from 'dayjs';
import i18n from '@/i18n';

export interface MobileOrderItem {
  id: string;
  name: string;
  variant: string;
  qty: number;
  price: number;
  image: string;
  status?: string;
  sellerId?: string;
}

export interface MobileOrder {
  id: string;
  orderId: string;
  orderNo: string;
  statusTag: string;
  paymentTag: string;
  tags?: string[];
  date: string;
  time: string;
  itemCount: number;
  total: number;
  paymentStatus: string;
  payment?: string;
  items: MobileOrderItem[];
  progressStep: number;
  shippingAddress: string;
  customer?: {
    name: string;
    phone: string;
    city: string;
    address: string;
  };
  subtotal?: number;
  shipping?: number;
  isRefurbished: boolean;
  createdAt?: string;
  raw?: any;
}

const STEP_KEYS = ['pending', 'processing', 'shipping', 'shipped', 'delivered'];

/**
 * Adapter: Map Backend MongoDB Order to Mobile Order Shape
 */
export function mapBackendToOrder(raw: any, isRefurbished = false): MobileOrder {
  if (!raw) {
    return {
      id: '',
      orderId: '',
      orderNo: '',
      statusTag: 'PENDING',
      paymentTag: 'PENDING',
      tags: [],
      date: '',
      time: '',
      itemCount: 0,
      total: 0,
      paymentStatus: 'Pending',
      items: [],
      progressStep: 0,
      shippingAddress: '',
      customer: { name: '', phone: '', city: '', address: '' },
      subtotal: 0,
      shipping: 0,
      isRefurbished,
      raw: null,
    };
  }

  // Unpack single order if wrapped in response object
  if (raw && typeof raw === 'object') {
    if (raw.orders && typeof raw.orders === 'object' && !Array.isArray(raw.orders)) {
      raw = raw.orders;
    } else if (raw.order && typeof raw.order === 'object' && !Array.isArray(raw.order)) {
      raw = raw.order;
    } else if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
      raw = raw.data;
    }
  }

  const rawItems = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.orderItems)
    ? raw.orderItems
    : [];

  const mappedItems: MobileOrderItem[] = rawItems.map((item: any, idx: number) => {
    const prod = item.productId || item.product || {};
    const variantObj = item.variantId || item.variant || {};

    let title = '';
    if (typeof prod === 'object' && prod.title && typeof prod.title === 'string') {
      title = prod.title.trim();
    } else if (typeof prod === 'object' && prod.name && typeof prod.name === 'string') {
      title = prod.name.trim();
    } else if (typeof item.name === 'string' && item.name.trim()) {
      title = item.name.trim();
    } else if (typeof item.title === 'string' && item.title.trim()) {
      title = item.title.trim();
    } else if (typeof variantObj === 'object' && variantObj.title && typeof variantObj.title === 'string') {
      title = variantObj.title.trim();
    } else {
      title = "";
    }

    let variantTitle = '';
    if (typeof item.variant === 'string' && item.variant.trim()) {
      variantTitle = item.variant.trim();
    } else if (item.variant && typeof item.variant === 'object') {
      const parts = [
        item.variant.title,
        item.variant.name,
        item.variant.color,
        item.variant.size,
        item.variant.storage,
        item.variant.ram,
      ].filter(Boolean);

      if (parts.length > 0) {
        variantTitle = parts.join(' / ');
      } else {
        const vals = Object.values(item.variant).filter(
          v => typeof v === 'string' || typeof v === 'number',
        );
        variantTitle = vals.length > 0 ? vals.join(' / ') : '';
      }
    } else if (typeof item.variantId === 'object' && item.variantId !== null) {
      variantTitle = item.variantId.title || item.variantId.name || '';
    } else if (item.variantTitle && typeof item.variantTitle === 'string') {
      variantTitle = item.variantTitle;
    }

    const imgUrl =
      pickImageUrl(
        item.variantId?.images,
        item.variant?.images,
        prod?.images,
        prod?.image,
        prod?.thumbnail,
        item.image,
        item.imageUrl,
        item.photo,
      ) || '';

    const price = Number(
      item.price ??
      item.unitPrice ??
      item.productPrice ??
      (typeof variantObj === 'object' ? variantObj.price : null) ??
      (typeof prod === 'object' ? prod.price : null) ??
      0,
    );

    const qty = Number(item.quantity ?? item.qty ?? item.count ?? 1);

    return {
      id: String(item._id || item.id || `item-${idx}`),
      name: String(title),
      variant: String(variantTitle),
      qty,
      price,
      image: imgUrl,
      status: String(item.status || item.itemStatus || raw.orderStatus || 'pending'),
      sellerId: item.sellerId ? String(item.sellerId) : undefined,
    };
  });

  const statusKey = String(raw.orderStatus || raw.status || 'pending').toLowerCase();
  const stepIdx = STEP_KEYS.indexOf(statusKey);
  const progressStep = stepIdx >= 0 ? stepIdx : 0;

  const createdAt = raw.createdAt ? dayjs(raw.createdAt) : dayjs();

  const rawAddress = raw.shippingAddress || raw.address;
  let addressStr = '';
  let customerInfo = {
    name: '',
    phone: '',
    city: '',
    address: '',
  };

  if (typeof rawAddress === 'string') {
    addressStr = rawAddress;
    customerInfo.address = rawAddress;
  } else if (rawAddress && typeof rawAddress === 'object') {
    addressStr = [
      rawAddress.addressLine || rawAddress.address || rawAddress.street,
      rawAddress.area,
      rawAddress.city,
      rawAddress.state,
      rawAddress.country,
      rawAddress.postalCode,
    ]
      .filter(Boolean)
      .join(', ');

    customerInfo = {
      name: String(rawAddress.fullName || raw.customer?.name || raw.user?.name || raw.userId?.name || ''),
      phone: String(rawAddress.phone || raw.customer?.phone || raw.userId?.phone || ''),
      city: String(rawAddress.city || ''),
      address: String(rawAddress.addressLine || rawAddress.address || rawAddress.street || addressStr),
    };
  }

  const total = Number(raw.totalAmount ?? raw.total ?? raw.grandTotal ?? raw.amount ?? 0);
  // The backend charges no shipping to the customer, so a missing value is 0, never an invented fee
  const shipping = Number(raw.shippingFee ?? raw.shippingPrice ?? raw.shipping ?? 0);
  const subtotal = Number(raw.subTotal ?? raw.subtotal ?? (total > shipping ? total - shipping : total));
  const statusTag = String(raw.orderStatus || 'pending').toUpperCase();
  const paymentTag = String(raw.paymentStatus || 'pending').toUpperCase();

  return {
    id: String(raw._id || raw.id || ''),
    orderId: String(raw.orderId || raw.orderNo || raw.orderNumber || raw._id || ''),
    orderNo: String(raw.orderNo || raw.orderId || raw._id || ''),
    statusTag,
    paymentTag,
    tags: [statusTag, paymentTag],
    // ISO dates; the screens format them in the app language
    date: createdAt.toISOString(),
    time: createdAt.toISOString(),
    itemCount: mappedItems.length,
    total,
    paymentStatus: String(raw.paymentStatus || 'pending'),
    payment: String(raw.paymentMethod || raw.paymentStatus || 'CARD'),
    items: mappedItems,
    progressStep,
    shippingAddress: addressStr,
    customer: customerInfo,
    subtotal,
    shipping,
    isRefurbished,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    raw,
  };
}

export interface OrdersPage {
  orders: MobileOrder[];
  page: number;
  pages: number;
}

// One page of one store's orders. A failed request throws.
export async function getCustomerOrdersPage(params: {
  page?: number;
  limit?: number;
  search?: string;
  isRefurbished?: boolean;
}): Promise<OrdersPage> {
  const isRefurbished = Boolean(params.isRefurbished);
  const endpoint = isRefurbished ? '/refurbished/orders' : '/e-commerce/orders';
  const page = params.page || 1;
  const res = await apiClient.get(endpoint, {
    params: { page, limit: params.limit || 10, search: params.search?.trim() || undefined },
  });
  const data = res.data?.data || res.data?.orders;
  const orders = Array.isArray(data) ? data.map((raw: any) => mapBackendToOrder(raw, isRefurbished)) : [];
  const pages = Number(res.data?.pagination?.totalPages || 1);
  return { orders, page, pages };
}

// Marketplace and refurbished orders together, newest first. "pages" is the larger of the two stores.
export async function getAllCustomerOrdersPage(params: { page?: number; search?: string }): Promise<OrdersPage> {
  const page = params.page || 1;
  const [ecom, refurb] = await Promise.all([
    getCustomerOrdersPage({ page, search: params.search, isRefurbished: false }),
    getCustomerOrdersPage({ page, search: params.search, isRefurbished: true }),
  ]);
  const orders = [...ecom.orders, ...refurb.orders].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );
  return { orders, page, pages: Math.max(ecom.pages, refurb.pages) };
}

/**
 * 2. Fetch Single Customer Order Detail
 */
export async function getCustomerOrderDetail(
  orderId: string,
  isRefurbished = false,
): Promise<MobileOrder | null> {
  if (!orderId) return null;

  try {
    const primaryEndpoint = isRefurbished
      ? `/refurbished/orders/${orderId}`
      : `/e-commerce/orders/${orderId}`;
    const fallbackEndpoint = isRefurbished
      ? `/e-commerce/orders/${orderId}`
      : `/refurbished/orders/${orderId}`;

    let res: any = null;

    try {
      res = await apiClient.get(primaryEndpoint);
    } catch (first: any) {
      // No connection or a server failure: let the screen offer a retry instead of "not found"
      if (first?.isNetworkError || first?.isTimeout || (first?.status && first.status >= 500)) throw first;
      res = await apiClient.get(fallbackEndpoint).catch((err: any) => {
        if (err?.isNetworkError || err?.isTimeout || (err?.status && err.status >= 500)) throw err;
        return null;
      });
    }

    if (!res || !res.data) return null;

    let rawOrder =
      res.data.orders ||
      res.data.order ||
      res.data.data ||
      res.data;

    if (Array.isArray(rawOrder) && rawOrder.length > 0) {
      rawOrder = rawOrder[0];
    }

    if (rawOrder && typeof rawOrder === 'object') {
      return mapBackendToOrder(rawOrder, isRefurbished);
    }

    return null;
  } catch (err: any) {
    if (err?.isNetworkError || err?.isTimeout || (err?.status && err.status >= 500)) throw err;
    if (__DEV__) console.warn(`getCustomerOrderDetail(${orderId}) error:`, err?.message);
    return null;
  }
}

/**
 * 3. Cancel Order
 */
export async function cancelCustomerOrder(
  orderId: string,
  isRefurbished = false,
): Promise<{ success: boolean; message: string }> {
  try {
    const endpoint = isRefurbished
      ? `/refurbished/orders/${orderId}/cancel`
      : `/e-commerce/orders/${orderId}/cancel`;
    const res = await apiClient.put(endpoint);
    return { success: true, message: res.data?.message || '' };
  } catch (err: any) {
    // the ApiError already carries the backend message
    throw err;
  }
}

/**
 * 4. Create Order (Checkout)
 */
export async function createCustomerOrderApi(payload: {
  shippingAddress: {
    fullName: string;
    phone: string;
    country?: string;
    countryCode?: string;
    state?: string;
    stateCode?: string;
    city: string;
    area?: string;
    addressLine: string;
    postalCode?: string;
  };
  paymentMethod?: string;
  cardHolder?: string;
  cardNumber?: string;
  expireMonth?: string;
  expireYear?: string;
  cvc?: string;
  items?: Array<{ productId: string; variantId?: string; quantity: number }>;
  cartId?: string;
  sellerId?: string;
  isRefurbished?: boolean;
}): Promise<any> {
  const { isRefurbished, ...body } = payload;
  const endpoint = isRefurbished ? '/refurbished/orders/create' : '/e-commerce/orders/create';
  // Errors are not wrapped, so the screen can tell "refused" from "no answer" (isNetworkError / isTimeout)
  const res = await apiClient.post(endpoint, body);
  return res.data;
}

/**
 * 5. Fetch Customer Returns
 */
export async function getCustomerReturnsApi(isRefurbished = false): Promise<any[]> {
  const endpoint = isRefurbished ? '/refurbished/orders/my-returns' : '/e-commerce/orders/my-returns';
  const res = await apiClient.get(endpoint);
  return res.data?.data || [];
}

/**
 * 6. Send Order Query to Seller (/customer/queries)
 */
export async function sendOrderQueryApi(params: {
  orderId: string;
  subject: string;
  message: string;
  sellerId?: string;
}): Promise<any> {
  try {
    const res = await apiClient.post('/customer/queries', {
      orderId: params.orderId,
      queryType: 'order',
      subject: params.subject,
      message: params.message,
      sellerId: params.sellerId || undefined,
    });
    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || i18n.t('customer.failedToSendMessageTo');
    throw new Error(msg);
  }
}


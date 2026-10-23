import apiClient from '@/services/apiClient';
import dayjs from 'dayjs';
import { ORDERS, PROGRESS_STEPS } from '../data/orders';
import { ORDER_DETAIL } from '../data/orderDetail';

export interface MobileOrderItem {
  id: string;
  name: string;
  variant: string;
  qty: number;
  price: number;
  image: string;
  status?: string;
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
  warranty?: {
    returnId: string;
    date: string;
  };
  raw?: any;
}

const STEP_KEYS = ['pending', 'processing', 'shipping', 'shipped', 'delivered'];

/**
 * Adapter: Map Backend MongoDB Order to Mobile Order Shape
 */
export function mapBackendToOrder(raw: any): MobileOrder {
  if (!raw) return ORDERS[0] as any;

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const mappedItems: MobileOrderItem[] = rawItems.map((item: any, idx: number) => {
    const prod = item.productId || item.product || {};
    const title = prod.title || prod.name || item.name || `Item ${idx + 1}`;
    const variantTitle = item.variantId?.title || item.variantTitle || item.variant || 'Standard';
    const rawImg = prod.images?.[0]?.url || prod.images?.[0] || prod.image || item.image;
    const imgUrl = typeof rawImg === 'string' ? rawImg : 'https://picsum.photos/seed/order/300/300';

    return {
      id: String(item._id || item.id || `item-${idx}`),
      name: title,
      variant: variantTitle,
      qty: Number(item.quantity || item.qty || 1),
      price: Number(item.price || item.unitPrice || 0),
      image: imgUrl,
      status: item.status || raw.orderStatus || 'Pending',
    };
  });

  const statusKey = String(raw.orderStatus || raw.status || 'pending').toLowerCase();
  const stepIdx = STEP_KEYS.indexOf(statusKey);
  const progressStep = stepIdx >= 0 ? stepIdx : 0;

  const createdAt = raw.createdAt ? dayjs(raw.createdAt) : dayjs();

  const rawAddress = raw.shippingAddress || raw.address;
  let addressStr = 'Pakistan';
  let customerInfo = {
    name: 'Customer',
    phone: '',
    city: '',
    address: '',
  };

  if (typeof rawAddress === 'string') {
    addressStr = rawAddress;
  } else if (rawAddress && typeof rawAddress === 'object') {
    addressStr = [
      rawAddress.address || rawAddress.street,
      rawAddress.city,
      rawAddress.state,
      rawAddress.country,
    ]
      .filter(Boolean)
      .join(', ');

    customerInfo = {
      name: rawAddress.fullName || raw.customer?.name || raw.user?.name || 'Customer',
      phone: rawAddress.phone || raw.customer?.phone || '',
      city: rawAddress.city || '',
      address: rawAddress.address || rawAddress.street || addressStr,
    };
  }

  const total = Number(raw.totalAmount || raw.total || raw.grandTotal || 0);
  const shipping = Number(raw.shippingFee || raw.shippingPrice || 10);
  const subtotal = Number(raw.subtotal || (total > shipping ? total - shipping : total));
  const statusTag = String(raw.orderStatus || 'Pending').toUpperCase();
  const paymentTag = String(raw.paymentStatus || 'Pending').toUpperCase();

  return {
    id: String(raw._id || raw.id),
    orderId: String(raw.orderId || raw.orderNumber || raw._id),
    orderNo: String(raw.orderNo || raw.orderId || raw._id),
    statusTag,
    paymentTag,
    tags: [statusTag, paymentTag],
    date: createdAt.format('DD MMMM YYYY'),
    time: createdAt.format('hh:mm A'),
    itemCount: mappedItems.length,
    total,
    paymentStatus: raw.paymentStatus || 'Pending',
    payment: raw.paymentMethod || raw.paymentStatus || 'CARD',
    items: mappedItems,
    progressStep,
    shippingAddress: addressStr,
    customer: customerInfo,
    subtotal,
    shipping,
    warranty: {
      returnId: String(raw.returnId || `RET-${(raw._id || '000000').slice(-6).toUpperCase()}`),
      date: createdAt.format('M/D/YYYY'),
    },
    raw,
  };
}

/**
 * 1. Fetch Customer Orders (Marketplace & Refurbished)
 */
export async function getCustomerOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isRefurbished?: boolean;
}): Promise<MobileOrder[]> {
  try {
    const endpoint = params?.isRefurbished ? '/refurbished/orders' : '/e-commerce/orders';
    const res = await apiClient.get(endpoint, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        search: params?.search?.trim() || undefined,
      },
    });

    const data = res.data?.data || res.data?.orders || res.data;
    if (Array.isArray(data)) {
      return data.map(mapBackendToOrder);
    }
    return ORDERS as any;
  } catch (err: any) {
    console.warn('getCustomerOrders fallback to mock:', err?.message);
    return ORDERS as any;
  }
}

/**
 * 2. Fetch Single Customer Order Detail
 */
export async function getCustomerOrderDetail(
  orderId: string,
  isRefurbished = false,
): Promise<MobileOrder> {
  try {
    const endpoint = isRefurbished ? `/refurbished/orders/${orderId}` : `/e-commerce/orders/${orderId}`;
    const res = await apiClient.get(endpoint);
    const data = res.data?.data || res.data?.order || res.data;
    if (data) {
      return mapBackendToOrder(data);
    }
    return ORDER_DETAIL as any;
  } catch (err: any) {
    console.warn(`getCustomerOrderDetail(${orderId}) fallback to mock:`, err?.message);
    const found = ORDERS.find(o => o.id === orderId || (o as any).orderId === orderId);
    return (found as any) || (ORDER_DETAIL as any);
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
    return {
      success: true,
      message: res.data?.message || 'Order cancelled successfully',
    };
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || 'Could not cancel order';
    throw new Error(msg);
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
    city: string;
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
  isRefurbished?: boolean;
}): Promise<any> {
  try {
    const endpoint = payload.isRefurbished
      ? '/refurbished/orders/create'
      : '/e-commerce/orders/create';

    const res = await apiClient.post(endpoint, payload);

    // Clear cart if successful
    try {
      const clearUrl = payload.isRefurbished
        ? '/refurbished/cart/my-cart/clear'
        : '/e-commerce/cart/my-cart/clear';
      await apiClient.delete(clearUrl);
    } catch (_) {}

    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || 'Failed to place order';
    throw new Error(msg);
  }
}

/**
 * 5. Fetch Customer Returns
 */
export async function getCustomerReturnsApi(isRefurbished = false): Promise<any[]> {
  try {
    const endpoint = isRefurbished
      ? '/refurbished/orders/my-returns'
      : '/e-commerce/orders/my-returns';
    const res = await apiClient.get(endpoint);
    return res.data?.data || [];
  } catch (err: any) {
    console.warn('getCustomerReturnsApi error fallback:', err?.message);
    return [];
  }
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
      err?.response?.data?.message || err?.message || 'Failed to send message to seller';
    throw new Error(msg);
  }
}


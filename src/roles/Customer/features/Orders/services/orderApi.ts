import apiClient from '@/services/apiClient';
import dayjs from 'dayjs';

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

    let title = 'Purchased Item';
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
      title = `Item ${idx + 1}`;
    }

    let variantTitle = 'Standard';
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
        variantTitle = vals.length > 0 ? vals.join(' / ') : 'Standard';
      }
    } else if (typeof item.variantId === 'object' && item.variantId !== null) {
      variantTitle = item.variantId.title || item.variantId.name || 'Standard';
    } else if (item.variantTitle && typeof item.variantTitle === 'string') {
      variantTitle = item.variantTitle;
    }

    // Resolve Image from variant or product with full fallback
    const prodImages = Array.isArray(prod?.images) ? prod.images : [];
    const variantImages = Array.isArray(item.variantId?.images)
      ? item.variantId.images
      : Array.isArray(item.variant?.images)
      ? item.variant.images
      : [];

    const firstVariantImg = variantImages[0];
    const firstProdImg = prodImages[0];

    const rawImg =
      (typeof firstVariantImg === 'object' && firstVariantImg?.url ? firstVariantImg.url : firstVariantImg) ||
      (typeof firstProdImg === 'object' && firstProdImg?.url ? firstProdImg.url : firstProdImg) ||
      prod?.image ||
      prod?.thumbnail ||
      (typeof prod?.images === 'string' ? prod.images : null) ||
      item.image ||
      item.imageUrl ||
      item.photo;

    let imgUrl = '';
    if (typeof rawImg === 'string' && rawImg.trim()) {
      const cleanImg = rawImg.trim();
      if (cleanImg.startsWith('http://') || cleanImg.startsWith('https://')) {
        imgUrl = cleanImg;
      } else if (cleanImg.startsWith('/')) {
        imgUrl = `https://tbt-backend-hwu3.onrender.com${cleanImg}`;
      } else if (cleanImg.startsWith('uploads/')) {
        imgUrl = `https://tbt-backend-hwu3.onrender.com/${cleanImg}`;
      }
    }

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
      status: String(item.status || item.itemStatus || raw.orderStatus || 'Pending'),
      sellerId: item.sellerId ? String(item.sellerId) : undefined,
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
      name: String(rawAddress.fullName || raw.customer?.name || raw.user?.name || raw.userId?.name || 'Customer'),
      phone: String(rawAddress.phone || raw.customer?.phone || raw.userId?.phone || ''),
      city: String(rawAddress.city || ''),
      address: String(rawAddress.addressLine || rawAddress.address || rawAddress.street || addressStr),
    };
  }

  const total = Number(raw.totalAmount ?? raw.total ?? raw.grandTotal ?? raw.amount ?? 0);
  const shipping = Number(raw.shippingFee ?? raw.shippingPrice ?? raw.shipping ?? (total > 0 ? 10 : 0));
  const subtotal = Number(raw.subTotal ?? raw.subtotal ?? (total > shipping ? total - shipping : total));
  const statusTag = String(raw.orderStatus || 'Pending').toUpperCase();
  const paymentTag = String(raw.paymentStatus || 'Pending').toUpperCase();

  return {
    id: String(raw._id || raw.id || ''),
    orderId: String(raw.orderId || raw.orderNo || raw.orderNumber || raw._id || ''),
    orderNo: String(raw.orderNo || raw.orderId || raw._id || ''),
    statusTag,
    paymentTag,
    tags: [statusTag, paymentTag],
    date: createdAt.format('DD MMMM YYYY'),
    time: createdAt.format('hh:mm A'),
    itemCount: mappedItems.length,
    total,
    paymentStatus: String(raw.paymentStatus || 'Pending'),
    payment: String(raw.paymentMethod || raw.paymentStatus || 'CARD'),
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
/**
 * Fetch All Orders combined (Marketplace + Refurbished)
 */
export async function getAllCustomerOrders(params?: {
  search?: string;
}): Promise<MobileOrder[]> {
  try {
    const [ecom, refurb] = await Promise.all([
      getCustomerOrders({ search: params?.search, isRefurbished: false }),
      getCustomerOrders({ search: params?.search, isRefurbished: true }),
    ]);

    const combined = [...ecom, ...refurb];
    return combined.sort((a, b) => {
      const timeA = new Date(a.raw?.createdAt || a.date).getTime() || 0;
      const timeB = new Date(b.raw?.createdAt || b.date).getTime() || 0;
      return timeB - timeA;
    });
  } catch (err) {
    return [];
  }
}

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

    const data = res.data?.orders || res.data?.data || res.data?.order || res.data;
    if (Array.isArray(data)) {
      return data.map(mapBackendToOrder);
    }
    return [];
  } catch (err: any) {
    if (__DEV__) console.warn('getCustomerOrders error:', err?.message);
    return [];
  }
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
    } catch {
      try {
        res = await apiClient.get(fallbackEndpoint);
      } catch (err: any) {
        if (__DEV__) console.warn(`getCustomerOrderDetail(${orderId}) error:`, err?.message);
        return null;
      }
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
      return mapBackendToOrder(rawOrder);
    }

    return null;
  } catch (err: any) {
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


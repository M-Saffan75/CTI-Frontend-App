import apiClient, { API_BASE_URL } from '@/services/apiClient';
import { getToken } from '@/services/tokenStorage';
import { demoProductPhoto } from '@/assets/images';
import {
  RefurbishedProduct,
} from '../data/refurbishedData';
import i18n from '@/i18n';

/**
 * Adapter: Convert Backend Refurbished Product to Mobile RefurbishedProduct Model.
 * Every value comes from the backend. A missing value stays empty or 0 and the screens hide it.
 */
export function mapBackendToProduct(raw: any): RefurbishedProduct {
  if (!raw) return null as any;

  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  const defaultVariant = variants.find((v: any) => v.isDefault) || variants[0] || {};

  const mainPrice = Number(
    defaultVariant?.discountPrice ||
    defaultVariant?.price ||
    raw.sellingPrice ||
    raw.price ||
    0,
  );

  // The original price counts only when the backend has a higher one
  const listedPrice = Number(defaultVariant?.sellingPrice || defaultVariant?.price || raw.originalPrice || 0);
  const origPrice = listedPrice > mainPrice ? listedPrice : mainPrice;

  const discount = Number(
    defaultVariant?.discountPercentage ??
    raw.discountPercentage ??
    raw.discountPercent ??
    (origPrice > mainPrice ? Math.round(((origPrice - mainPrice) / origPrice) * 100) : 0),
  );

  const savings = Number(
    defaultVariant?.discountSavings ??
    (origPrice > mainPrice ? origPrice - mainPrice : 0),
  );

  const rawImages: any[] = Array.isArray(raw.images) ? raw.images : [];
  const primaryImageUrl = rawImages[0]?.url || defaultVariant?.images?.[0]?.url;

  const imageSource = primaryImageUrl ? { uri: primaryImageUrl } : (raw.image || demoProductPhoto);

  const gallerySources = rawImages.length > 0
    ? rawImages.map(img => (img?.url ? { uri: img.url } : demoProductPhoto))
    : [imageSource];

  const cleanDescription = typeof raw.description === 'string'
    ? raw.description.replace(/<[^>]+>/g, '').trim()
    : raw.shortDescription || '';

  return {
    id: String(raw._id || raw.id || ''),
    rawId: raw._id ? String(raw._id) : undefined,
    slug: raw.slug || (raw._id ? String(raw._id) : undefined),
    isRefurbished: true,
    defaultVariantId: defaultVariant?._id
      ? String(defaultVariant._id)
      : variants[0]?._id
      ? String(variants[0]._id)
      : undefined,
    variants,
    raw,
    name: raw.title || raw.name || '',
    brand: typeof raw.brandId === 'object' ? raw.brandId?.name || '' : (raw.brand || ''),
    category: typeof raw.categoryId === 'object' ? raw.categoryId?.name || '' : (raw.category || ''),
    price: mainPrice,
    originalPrice: origPrice,
    discountPercent: discount,
    saveAmount: savings,
    rating: Number(raw.ratings?.average ?? raw.rating ?? 0),
    reviewsCount: Number(raw.ratings?.count ?? raw.reviewsCount ?? 0),
    inStockCount: Number(defaultVariant?.stock ?? 0),
    isVerified: Boolean(raw.isCTIVerified),
    tag: raw.tag || '',
    subtitle: raw.shortDescription || '',
    description: cleanDescription,
    image: imageSource,
    gallery: gallerySources,
    sku: raw.sku || defaultVariant?.sku || '',
    totalVariants: Number(raw.variantCount || variants.length || 0),
    condition: raw.condition || '',
    grade: raw.grade || '',
    specs: {
      buildAndMaterials: raw.specs?.buildAndMaterials || '',
      displayAndVisuals: raw.specs?.displayAndVisuals || '',
      performance: raw.specs?.performance || '',
      cameraSystem: raw.specs?.cameraSystem || '',
      batteryAndConnectivity: raw.specs?.batteryAndConnectivity || '',
    },
  };
}

/**
 * 1. Fetch Refurbished Categories
 */
export async function getRefurbishedCategories(): Promise<any[]> {
  try {
    const res = await apiClient.get('/public/refurbished-devices/categories');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map((cat: any) => ({
        id: cat.slug || cat._id,
        name: cat.name,
        image: cat.image,
      }));
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn('getRefurbishedCategories error:', error);
    return [];
  }
}

/**
 * 2. Fetch Top Selling Refurbished Products
 */
export async function getTopSellingProducts(): Promise<RefurbishedProduct[]> {
  try {
    const res = await apiClient.get('/public/refurbished-devices/products/top-selling');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map(mapBackendToProduct).filter(Boolean);
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn('getTopSellingProducts error:', error);
    return [];
  }
}

/**
 * 3. Fetch Products for a Specific Category
 */
export async function getCategoryProducts(categorySlug: string): Promise<RefurbishedProduct[]> {
  try {
    const res = await apiClient.get(`/public/refurbished-devices/products/category/${categorySlug}`);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map(mapBackendToProduct).filter(Boolean);
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn(`getCategoryProducts(${categorySlug}) error:`, error);
    return [];
  }
}

/**
 * 4. Fetch All / Filtered Refurbished Products
 */
export interface RefurbishedProductsPage {
  products: RefurbishedProduct[];
  page: number;
  pages: number;
}

// One page of the store (30 per page). A failed request throws, so the screen can show an error and a retry.
export async function fetchRefurbishedProductsPage(params?: Record<string, any>): Promise<RefurbishedProductsPage> {
  const res = await apiClient.get('/public/refurbished-devices/products', { params });
  const list = res.data?.data?.products || res.data?.data;
  const products = Array.isArray(list)
    ? (list.map(mapBackendToProduct).filter((p: RefurbishedProduct) => p && p.id) as RefurbishedProduct[])
    : [];
  const pagination = res.data?.pagination || res.data?.data?.pagination || {};
  return { products, page: Number(pagination.page || params?.page || 1), pages: Number(pagination.pages || 1) };
}

// The whole store (all pages, up to 10), used by the screens that filter and sort on the phone
export async function fetchAllRefurbishedProducts(): Promise<RefurbishedProduct[]> {
  const first = await fetchRefurbishedProductsPage({ page: 1 });
  const all = [...first.products];
  const lastPage = Math.min(first.pages, 10);
  for (let page = 2; page <= lastPage; page++) {
    const next = await fetchRefurbishedProductsPage({ page });
    all.push(...next.products);
  }
  return all;
}

export async function getRefurbishedProducts(params?: Record<string, any>): Promise<RefurbishedProduct[]> {
  try {
    const res = await apiClient.get('/public/refurbished-devices/products', { params });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map(mapBackendToProduct).filter(Boolean);
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn('getRefurbishedProducts error:', error);
    return [];
  }
}

/**
 * Related products for a detail page, same order as the web app:
 * same category, else same brand, else top selling.
 */
export async function getRelatedRefurbishedProducts(product: RefurbishedProduct): Promise<RefurbishedProduct[]> {
  const others = (list: RefurbishedProduct[]) => list.filter(p => p.id !== product.id).slice(0, 6);
  const categorySlug = product.raw?.categoryId?.slug;
  if (categorySlug) {
    const related = others(await getCategoryProducts(categorySlug));
    if (related.length > 0) return related;
  }
  const brandSlug = product.raw?.brandId?.slug || (typeof product.raw?.brandId === 'string' ? product.raw.brandId : undefined);
  if (brandSlug) {
    const related = others(await getRefurbishedProducts({ brand: brandSlug, limit: 7 }));
    if (related.length > 0) return related;
  }
  return others(await getTopSellingProducts());
}

/**
 * Filter options for the filter modal (categories and brands that have active products).
 * Returns null when the endpoint fails so the caller can keep its static lists.
 */
export async function getRefurbishedFilters(): Promise<{
  categories: { id: string; name: string }[];
  brands: string[];
} | null> {
  try {
    const res = await apiClient.get('/public/refurbished-devices/filters');
    const data = res.data?.data;
    if (!res.data?.success || !data) return null;
    const categories = (Array.isArray(data.categories) ? data.categories : [])
      .filter((c: any) => c?.name)
      .map((c: any) => ({ id: String(c.name).toLowerCase(), name: String(c.name) }));
    const brands = (Array.isArray(data.brands) ? data.brands : [])
      .map((b: any) => b?.name)
      .filter(Boolean) as string[];
    return { categories, brands };
  } catch (error) {
    if (__DEV__) console.warn('getRefurbishedFilters error:', error);
    return null;
  }
}

/**
 * 5. Fetch Refurbished Product Details
 */
export async function getRefurbishedProductDetail(idOrSlug: string): Promise<RefurbishedProduct | null> {
  try {
    const res = await apiClient.get(`/public/refurbished-devices/products/${idOrSlug}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendToProduct(res.data.data);
    }
  } catch (error: any) {
    // No connection or a server failure: let the screen offer a retry instead of "not found"
    if (error?.isNetworkError || error?.isTimeout || (error?.status && error.status >= 500)) throw error;
    if (__DEV__) console.warn(`getRefurbishedProductDetail(${idOrSlug}) direct lookup fallback:`, error);
  }

  // Fallback: If idOrSlug was an _id, fetch product list to resolve slug or product
  try {
    const listRes = await apiClient.get('/public/refurbished-devices/products');
    const items = listRes.data?.data?.products || listRes.data?.data || [];
    if (Array.isArray(items)) {
      const matched = items.find((p: any) => String(p._id || p.id) === String(idOrSlug) || p.slug === idOrSlug);
      if (matched) {
        if (matched.slug && matched.slug !== idOrSlug) {
          try {
            const slugRes = await apiClient.get(`/public/refurbished-devices/products/${matched.slug}`);
            if (slugRes.data?.success && slugRes.data?.data) {
              return mapBackendToProduct(slugRes.data.data);
            }
          } catch {}
        }
        return mapBackendToProduct(matched);
      }
    }
  } catch {}

  return null;
}

/**
 * 6. Fetch Mobile Brands (Sell Phone Flow)
 */
export async function getMobileBrands(): Promise<any[]> {
  const res = await apiClient.get('/public/sell-device/brands/phone');
  return res.data?.success && Array.isArray(res.data?.data) ? res.data.data : [];
}

/**
 * 6b. Fetch All Refurbished Brands (Phones + Gadgets)
 */
export async function getAllSellBrands(): Promise<any[]> {
  const res = await apiClient.get('/public/sell-device/brands');
  return res.data?.success && Array.isArray(res.data?.data) ? res.data.data : [];
}

/**
 * 6c. Fetch Header Data (Mobile Brands + Sell Gadgets Categories & Brands)
 */
export async function getSellHeaderData(): Promise<{ mobileBrands: any[]; sellGadgets: any[] }> {
  const res = await apiClient.get('/public/sell-device/header-data');
  if (res.data?.success && res.data?.data) {
    return {
      mobileBrands: Array.isArray(res.data.data.mobileBrands) ? res.data.data.mobileBrands : [],
      sellGadgets: Array.isArray(res.data.data.sellGadgets) ? res.data.data.sellGadgets : [],
    };
  }
  return { mobileBrands: [], sellGadgets: [] };
}

/**
 * 6d. Fetch All Refurbished Models Globally (For Search / View All)
 */
export async function getAllSellModels(): Promise<any[]> {
  const res = await apiClient.get('/public/sell-device/models/all');
  return res.data?.success && Array.isArray(res.data?.data) ? res.data.data : [];
}

/**
 * 7. Fetch Available Models for a Brand (Sell Device Flow)
 */
export async function getSellDeviceModels(brandSlug: string): Promise<any[]> {
  const res = await apiClient.get(`/public/sell-device/brands/${brandSlug.toLowerCase()}/models`);
  return res.data?.success && Array.isArray(res.data?.data) ? res.data.data : [];
}

/**
 * 8. Fetch Sell Device Config & Condition Questions
 */
export async function getSellDeviceConfig(brandSlug: string, modelSlug: string): Promise<any> {
  // A failed request throws: the quote never falls back to questions the backend did not send
  const res = await apiClient.get(
    `/public/sell-device/config/${brandSlug.toLowerCase()}/${modelSlug.toLowerCase()}`,
  );
  return res.data?.success && res.data?.data ? res.data.data : null;
}

/**
 * 9. Submit Sell Device Application / Quote
 */
export async function submitSellDeviceApplication(
  formData: FormData,
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const token = await getToken();

    // 120s timeout controller for large binary uploads (images + video) & AWS S3 processing
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'x-platform': 'mobile',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Note: Do NOT set Content-Type header when sending FormData with native fetch.
    // React Native's native layer automatically attaches 'multipart/form-data; boundary=...'.
    const response = await fetch(`${API_BASE_URL}/public/sell-device/submit`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message || i18n.t('customer.applicationSubmittedSuccessfully'),
      };
    }

    return {
      success: false,
      data: result?.data,
      message: result?.error || result?.message || i18n.t('customer.failedToSubmitQuoteApplication'),
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return {
        success: false,
        message: i18n.t('customer.uploadTimedOutPleaseCheck'),
      };
    }
    if (__DEV__) console.warn('submitSellDeviceApplication error:', error);
    return {
      success: false,
      message: error?.message || i18n.t('customer.aNetworkErrorOccurredWhile'),
    };
  }
}

/**
 * 10. Fetch Customer Sell Requests (Authenticated)
 */
export async function getCustomerSellRequests(): Promise<{
  success: boolean;
  data: any[];
  message?: string;
}> {
  try {
    const res = await apiClient.get('/customer/refurbish/requests');
    if (res.data?.success) {
      return {
        success: true,
        data: Array.isArray(res.data?.data) ? res.data.data : [],
      };
    }
    return { success: false, data: [], message: res.data?.message };
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      i18n.t('customer.failedToLoadSellRequests');
    if (__DEV__) console.warn('getCustomerSellRequests error:', error?.response?.data || error);
    return { success: false, data: [], message: errMsg };
  }
}

/**
 * 11. Accept Sell Device Offer
 */
export async function acceptSellOffer(
  offerId: string,
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await apiClient.post(`/public/sell-device/offers/${offerId}/accept`);
    return {
      success: Boolean(res.data?.success),
      data: res.data?.data,
      message: res.data?.message || i18n.t('customer.offerAcceptedSuccessfully'),
    };
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      i18n.t('customer.failedToAcceptOffer');
    if (__DEV__) console.warn('acceptSellOffer error:', error?.response?.data || error);
    return { success: false, message: errMsg };
  }
}

/**
 * 12. Reject / Decline Sell Device Offer
 */
export async function rejectSellOffer(
  offerId: string,
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await apiClient.post(`/public/sell-device/offers/${offerId}/reject`);
    return {
      success: Boolean(res.data?.success),
      data: res.data?.data,
      message: res.data?.message || i18n.t('customer.offerDeclinedSuccessfully'),
    };
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      i18n.t('customer.failedToRejectOffer');
    if (__DEV__) console.warn('rejectSellOffer error:', error?.response?.data || error);
    return { success: false, message: errMsg };
  }
}

/**
 * 13. Start Chat with Support regarding Sell Request
 */
export async function startSellRequestChat(
  requestId: string,
): Promise<{ success: boolean; chat?: any; message?: string }> {
  try {
    const res = await apiClient.post('/chat/refurbish/start', { sellRequestId: requestId });
    return {
      success: Boolean(res.data?.success),
      chat: res.data?.chat,
      message: res.data?.message,
    };
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      i18n.t('customer.failedToStartChat');
    if (__DEV__) console.warn('startSellRequestChat error:', error?.response?.data || error);
    return { success: false, message: errMsg };
  }
}

/**
 * 14. Refurbished Cart & Wishlist Operations (matches Next.js refurbishedCart & refurbishedWishlist)
 */
// The server cart with its id (the order request needs it). A failed request throws, so the cart
// is never replaced by an empty or locally stored copy.
export async function getRefurbishedCartData(): Promise<{ items: any[]; cartId?: string }> {
  const res = await apiClient.get('/refurbished/cart/my-cart');
  const data = res.data?.data;
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    cartId: data?._id ? String(data._id) : undefined,
  };
}

export async function clearRefurbishedCartApi(): Promise<void> {
  await apiClient.delete('/refurbished/cart/my-cart/clear');
}

// Cart changes go to the server only. A failure is thrown so the screen can tell the customer
// (a copy kept on the phone would never reach the order).
export async function addRefurbishedCartItem(
  productId: string,
  variantId?: string,
  quantity = 1,
): Promise<{ success: boolean; message?: string; items?: any[] }> {
  const res = await apiClient.post('/refurbished/cart/my-cart/items', {
    productId,
    variantId,
    quantity,
  });
  if (!res.data?.success) {
    throw new Error(res.data?.message || i18n.t('customer.couldNotAddToCart'));
  }
  return {
    success: true,
    message: res.data?.message || i18n.t('customer.addedToCart2'),
    items: res.data?.data?.items,
  };
}

export async function updateRefurbishedCartItem(
  productId: string,
  variantId?: string,
  delta = 1,
): Promise<{ success: boolean; items?: any[] }> {
  const res = await apiClient.put('/refurbished/cart/my-cart/items', {
    productId,
    variantId,
    delta,
  });
  if (!res.data?.success) {
    throw new Error(res.data?.message || i18n.t('customer.couldNotUpdateTheCart'));
  }
  return { success: true, items: res.data?.data?.items };
}

export async function removeRefurbishedCartItem(
  productId: string,
  variantId?: string,
): Promise<{ success: boolean; items?: any[] }> {
  const res = await apiClient.delete('/refurbished/cart/my-cart/items', {
    data: { productId, variantId },
  });
  if (!res.data?.success) {
    throw new Error(res.data?.message || i18n.t('customer.couldNotRemoveTheItem'));
  }
  return { success: true, items: res.data?.data?.items };
}

/**
 * Web: fetchRefurbishedWishlist, GET /refurbished/wishlist, returns data.items.
 * Failures are thrown so the caller keeps its current list, like the web reducer.
 */
export async function getRefurbishedWishlist(): Promise<any[]> {
  const res = await apiClient.get('/refurbished/wishlist');
  return res.data?.data?.items || [];
}

/**
 * Web: toggleRefurbishedWishlistItem, POST /refurbished/wishlist/toggle with { productId, variantId }.
 * Returns the full items list from the response. Failures are thrown so the caller can revert.
 */
export async function toggleRefurbishedWishlist(
  productId: string,
  variantId?: string,
): Promise<any[]> {
  const res = await apiClient.post('/refurbished/wishlist/toggle', { productId, variantId });
  return res.data?.data?.items || [];
}

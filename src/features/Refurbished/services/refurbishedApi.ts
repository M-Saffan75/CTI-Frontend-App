import apiClient, { API_BASE_URL } from '@/services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoProductPhoto } from '@/assets/images';
import {
  RefurbishedProduct,
  REFURBISHED_PRODUCTS,
  REFURBISHED_CATEGORIES,
} from '../data/refurbishedData';

/**
 * Adapter: Convert Backend Refurbished Product to Mobile RefurbishedProduct Model
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
    1999,
  );

  const origPrice = Number(
    defaultVariant?.sellingPrice ||
    defaultVariant?.price ||
    raw.originalPrice ||
    Math.round(mainPrice * 1.25),
  );

  const discount = Number(
    defaultVariant?.discountPercentage ??
    raw.discountPercentage ??
    raw.discountPercent ??
    (origPrice > mainPrice ? Math.round(((origPrice - mainPrice) / origPrice) * 100) : 10),
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
    id: String(raw._id || raw.id || Math.random().toString()),
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
    name: raw.title || raw.name || 'Refurbished Device',
    brand: typeof raw.brandId === 'object' ? raw.brandId?.name : (raw.brand || 'CTI'),
    category: typeof raw.categoryId === 'object' ? raw.categoryId?.name : (raw.category || 'Gadgets'),
    price: mainPrice,
    originalPrice: origPrice,
    discountPercent: discount,
    saveAmount: savings,
    rating: Number(raw.ratings?.average ?? raw.rating ?? 4.8),
    reviewsCount: Number(raw.ratings?.count ?? raw.reviewsCount ?? 15),
    inStockCount: Number(defaultVariant?.stock ?? raw.variantCount ?? 8),
    isVerified: Boolean(raw.isCTIVerified ?? true),
    tag: raw.tag || 'Refurbished',
    subtitle: raw.shortDescription || 'Certified refurbished with complete warranty',
    description: cleanDescription || 'Factory refurbished device thoroughly tested for performance and aesthetics.',
    image: imageSource,
    gallery: gallerySources,
    sku: raw.sku || defaultVariant?.sku || 'REF-CTI-001',
    totalVariants: Number(raw.variantCount || variants.length || 1),
    condition: 'Refurbished',
    grade: 'Superb',
    specs: {
      buildAndMaterials: raw.specs?.buildAndMaterials || 'Aerospace-grade aluminum frame, ceramic front with precision polish.',
      displayAndVisuals: raw.specs?.displayAndVisuals || 'High refresh-rate calibrated panel with true tone and HDR support.',
      performance: raw.specs?.performance || 'High-performance processor optimized for battery efficiency and multi-tasking.',
      cameraSystem: raw.specs?.cameraSystem || 'Ultra-sharp sensor system with low-light night mode and 4K optical stabilization.',
      batteryAndConnectivity: raw.specs?.batteryAndConnectivity || 'Certified 85%+ battery health with 5G cellular and Wi-Fi 6.',
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
 * 5. Fetch Refurbished Product Details
 */
export async function getRefurbishedProductDetail(idOrSlug: string): Promise<RefurbishedProduct | null> {
  try {
    const res = await apiClient.get(`/public/refurbished-devices/products/${idOrSlug}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendToProduct(res.data.data);
    }
  } catch (error) {
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
  try {
    const res = await apiClient.get('/public/sell-device/brands/phone');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn('getMobileBrands error:', error);
    return [];
  }
}

/**
 * 6b. Fetch All Refurbished Brands (Phones + Gadgets)
 */
export async function getAllSellBrands(): Promise<any[]> {
  try {
    const res = await apiClient.get('/public/sell-device/brands');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn('getAllSellBrands error:', error);
    return [];
  }
}

/**
 * 6c. Fetch Header Data (Mobile Brands + Sell Gadgets Categories & Brands)
 */
export async function getSellHeaderData(): Promise<{ mobileBrands: any[]; sellGadgets: any[] }> {
  try {
    const res = await apiClient.get('/public/sell-device/header-data');
    if (res.data?.success && res.data?.data) {
      return {
        mobileBrands: Array.isArray(res.data.data.mobileBrands) ? res.data.data.mobileBrands : [],
        sellGadgets: Array.isArray(res.data.data.sellGadgets) ? res.data.data.sellGadgets : [],
      };
    }
    return { mobileBrands: [], sellGadgets: [] };
  } catch (error) {
    if (__DEV__) console.warn('getSellHeaderData error:', error);
    return { mobileBrands: [], sellGadgets: [] };
  }
}

/**
 * 6d. Fetch All Refurbished Models Globally (For Search / View All)
 */
export async function getAllSellModels(): Promise<any[]> {
  try {
    const res = await apiClient.get('/public/sell-device/models/all');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn('getAllSellModels error:', error);
    return [];
  }
}

/**
 * 7. Fetch Available Models for a Brand (Sell Device Flow)
 */
export async function getSellDeviceModels(brandSlug: string): Promise<any[]> {
  try {
    const res = await apiClient.get(`/public/sell-device/brands/${brandSlug.toLowerCase()}/models`);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    console.warn(`getSellDeviceModels(${brandSlug}) error:`, error);
    return [];
  }
}

/**
 * 8. Fetch Sell Device Config & Condition Questions
 */
export async function getSellDeviceConfig(brandSlug: string, modelSlug: string): Promise<any> {
  try {
    const res = await apiClient.get(
      `/public/sell-device/config/${brandSlug.toLowerCase()}/${modelSlug.toLowerCase()}`,
    );
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.warn(`getSellDeviceConfig(${brandSlug}, ${modelSlug}) error:`, error);
    return null;
  }
}

/**
 * 9. Submit Sell Device Application / Quote
 */
export async function submitSellDeviceApplication(
  formData: FormData,
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    let token = await AsyncStorage.getItem('token');
    if (!token) {
      const authData = await AsyncStorage.getItem('auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          token = parsed?.token || parsed?.tokens?.accessToken;
        } catch {}
      }
    }

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
        message: result.message || 'Application submitted successfully',
      };
    }

    return {
      success: false,
      data: result?.data,
      message: result?.error || result?.message || 'Failed to submit quote application',
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return {
        success: false,
        message: 'Upload timed out. Please check your internet connection or try with fewer/smaller media files.',
      };
    }
    console.warn('submitSellDeviceApplication error:', error);
    return {
      success: false,
      message: error?.message || 'A network error occurred while submitting. Please try again.',
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
      'Failed to load sell requests';
    console.warn('getCustomerSellRequests error:', error?.response?.data || error);
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
      message: res.data?.message || 'Offer accepted successfully!',
    };
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to accept offer';
    console.warn('acceptSellOffer error:', error?.response?.data || error);
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
      message: res.data?.message || 'Offer declined successfully',
    };
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to reject offer';
    console.warn('rejectSellOffer error:', error?.response?.data || error);
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
      'Failed to start chat';
    console.warn('startSellRequestChat error:', error?.response?.data || error);
    return { success: false, message: errMsg };
  }
}

/**
 * 14. Refurbished Cart & Wishlist Operations (matches Next.js refurbishedCart & refurbishedWishlist)
 */
const REFURB_CART_STORAGE_KEY = 'refurbished_cart';
const REFURB_WISHLIST_STORAGE_KEY = 'refurbished_wishlist';

export async function getRefurbishedCart(): Promise<any[]> {
  try {
    const res = await apiClient.get('/refurbished/cart/my-cart');
    if (res.data?.success && res.data?.data) {
      return res.data.data.items || [];
    }
  } catch (error) {
    // If not authenticated or network offline, use local storage fallback
  }
  try {
    const local = await AsyncStorage.getItem(REFURB_CART_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
}

export async function addRefurbishedCartItem(
  productId: string,
  variantId?: string,
  quantity = 1,
  productData?: any,
): Promise<{ success: boolean; message?: string; items?: any[] }> {
  try {
    const res = await apiClient.post('/refurbished/cart/my-cart/items', {
      productId,
      variantId,
      quantity,
    });
    if (res.data?.success) {
      return {
        success: true,
        message: res.data?.message || 'Added to cart!',
        items: res.data?.data?.items,
      };
    }
  } catch (error: any) {
    if (__DEV__) console.warn('addRefurbishedCartItem backend warning, saving locally:', error?.response?.data || error);
  }

  // Local fallback
  try {
    const local = await AsyncStorage.getItem(REFURB_CART_STORAGE_KEY);
    let items: any[] = local ? JSON.parse(local) : [];
    const idx = items.findIndex(
      i =>
        (i.productId === productId || i.productId?._id === productId) &&
        (i.variantId === variantId || i.variantId?._id === variantId),
    );
    if (idx > -1) {
      items[idx].quantity += quantity;
    } else {
      items.push({
        productId,
        variantId,
        quantity,
        product: productData,
      });
    }
    await AsyncStorage.setItem(REFURB_CART_STORAGE_KEY, JSON.stringify(items));
    return { success: true, message: 'Added to cart!', items };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Could not add to cart' };
  }
}

export async function updateRefurbishedCartItem(
  productId: string,
  variantId?: string,
  delta = 1,
): Promise<{ success: boolean; items?: any[] }> {
  try {
    const res = await apiClient.put('/refurbished/cart/my-cart/items', {
      productId,
      variantId,
      delta,
    });
    if (res.data?.success) {
      return { success: true, items: res.data?.data?.items };
    }
  } catch (error) {
    // Local fallback
  }

  try {
    const local = await AsyncStorage.getItem(REFURB_CART_STORAGE_KEY);
    let items: any[] = local ? JSON.parse(local) : [];
    const idx = items.findIndex(
      i =>
        (i.productId === productId || i.productId?._id === productId) &&
        (i.variantId === variantId || i.variantId?._id === variantId),
    );
    if (idx > -1) {
      items[idx].quantity = Math.max(1, items[idx].quantity + delta);
      await AsyncStorage.setItem(REFURB_CART_STORAGE_KEY, JSON.stringify(items));
      return { success: true, items };
    }
  } catch {}
  return { success: false };
}

export async function removeRefurbishedCartItem(
  productId: string,
  variantId?: string,
): Promise<{ success: boolean; items?: any[] }> {
  try {
    const res = await apiClient.delete('/refurbished/cart/my-cart/items', {
      data: { productId, variantId },
    });
    if (res.data?.success) {
      return { success: true, items: res.data?.data?.items };
    }
  } catch (error) {
    // Local fallback
  }

  try {
    const local = await AsyncStorage.getItem(REFURB_CART_STORAGE_KEY);
    let items: any[] = local ? JSON.parse(local) : [];
    items = items.filter(
      i =>
        !(
          (i.productId === productId || i.productId?._id === productId) &&
          (i.variantId === variantId || i.variantId?._id === variantId)
        ),
    );
    await AsyncStorage.setItem(REFURB_CART_STORAGE_KEY, JSON.stringify(items));
    return { success: true, items };
  } catch {}
  return { success: false };
}

export async function getRefurbishedWishlist(): Promise<any[]> {
  try {
    const res = await apiClient.get('/refurbished/wishlist');
    if (res.data?.success && Array.isArray(res.data?.data?.items)) {
      return res.data.data.items;
    }
  } catch (error) {
    // Local fallback
  }
  try {
    const local = await AsyncStorage.getItem(REFURB_WISHLIST_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
}

export async function toggleRefurbishedWishlist(
  productId: string,
  variantId?: string,
  productData?: any,
): Promise<{ isWishlisted: boolean; items: any[] }> {
  let resolvedVariantId = variantId;

  // Auto-resolve variantId if not explicitly provided
  if (!resolvedVariantId) {
    if (productData?.defaultVariantId) {
      resolvedVariantId = String(productData.defaultVariantId);
    } else if (productData?.variantId) {
      resolvedVariantId = String(
        typeof productData.variantId === 'object' ? productData.variantId._id : productData.variantId,
      );
    } else if (Array.isArray(productData?.variants) && productData.variants[0]) {
      resolvedVariantId = String(productData.variants[0]._id || productData.variants[0].id);
    }
  }

  // If still missing, look into existing refurbished wishlist for the matching item's variantId
  if (!resolvedVariantId) {
    try {
      const currentList = await getRefurbishedWishlist();
      const existing = currentList.find(
        (it: any) =>
          it.productId === productId ||
          it.productId?._id === productId ||
          it.product?._id === productId,
      );
      if (existing?.variantId) {
        resolvedVariantId = String(
          typeof existing.variantId === 'object' ? existing.variantId._id : existing.variantId,
        );
      }
    } catch {}
  }

  // Fallback: fetch product detail if variantId is still unknown
  if (!resolvedVariantId) {
    try {
      const prodRes = await apiClient.get(`/public/refurbished-devices/products/${productId}`);
      const p = prodRes.data?.data;
      if (p) {
        const def = p.variants?.find((v: any) => v.isDefault) || p.variants?.[0];
        if (def?._id) resolvedVariantId = String(def._id);
      }
    } catch {}
  }

  try {
    const res = await apiClient.post('/refurbished/wishlist/toggle', {
      productId,
      variantId: resolvedVariantId,
    });
    if (res.data?.success) {
      const items = res.data?.data?.items || [];
      const isWished = items.some(
        (i: any) =>
          (i.productId === productId || i.productId?._id === productId || i.product?._id === productId) &&
          (!resolvedVariantId ||
            i.variantId === resolvedVariantId ||
            i.variantId?._id === resolvedVariantId ||
            i.variant?._id === resolvedVariantId),
      );
      return { isWishlisted: isWished, items };
    }
  } catch (error: any) {
    if (__DEV__) console.warn('toggleRefurbishedWishlist backend warning, using local fallback:', error?.response?.data || error);
  }

  // Local fallback
  try {
    const local = await AsyncStorage.getItem(REFURB_WISHLIST_STORAGE_KEY);
    let items: any[] = local ? JSON.parse(local) : [];
    const idx = items.findIndex(
      (i: any) =>
        i.productId === productId ||
        i.productId?._id === productId ||
        i.product?._id === productId,
    );
    let isWished = false;
    if (idx > -1) {
      items.splice(idx, 1);
      isWished = false;
    } else {
      items.push({
        productId,
        variantId: resolvedVariantId,
        product: productData,
      });
      isWished = true;
    }
    await AsyncStorage.setItem(REFURB_WISHLIST_STORAGE_KEY, JSON.stringify(items));
    return { isWishlisted: isWished, items };
  } catch {
    return { isWishlisted: false, items: [] };
  }
}

export async function checkIsRefurbishedWishlisted(
  productId: string,
  variantId?: string,
): Promise<boolean> {
  try {
    const items = await getRefurbishedWishlist();
    return items.some(
      (i: any) =>
        (i.productId === productId || i.productId?._id === productId || i.product?._id === productId) &&
        (!variantId || i.variantId === variantId || i.variantId?._id === variantId || i.variant?._id === variantId),
    );
  } catch {
    return false;
  }
}

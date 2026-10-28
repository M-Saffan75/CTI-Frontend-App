import { Platform } from 'react-native';
import apiClient from '@/services/apiClient';
import { demoProductPhoto } from '@/assets/images';
import { COLORS, STORAGE_OPTIONS } from '../data/products';

export interface MobileEcomProduct {
  id: string;
  slug?: string;
  brand: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  category: string;
  colors: string[];
  storage: string;
  image: any;
  images: any[];
  seller: {
    id?: string;
    name: string;
    location: string;
    avatar: string;
  };
  specs: {
    brand: string;
    sku: string;
    category: string;
    totalVariants: number;
    totalStock: number;
    priceRange: string;
    warranty: string;
  };
  variants: Array<{
    id: string;
    label: string;
    price: number;
    originalPrice?: number;
    verified: boolean;
    stockLeft: number;
    image: any;
    attributes?: any[];
  }>;
  reviewBreakdown: Array<{ stars: number; percent: number }>;
  raw?: any;
}

/**
 * Safe Image source resolver for React Native
 */
export function resolveImageSource(img: any, fallback: any = demoProductPhoto): any {
  if (!img) return fallback;
  if (typeof img === 'number') return img;
  if (typeof img === 'string') {
    const trimmed = img.trim();
    return trimmed.length > 0 ? { uri: trimmed } : fallback;
  }
  if (typeof img === 'object') {
    if (img.uri && typeof img.uri === 'string') return { uri: img.uri.trim() };
    if (img.url && typeof img.url === 'string') return { uri: img.url.trim() };
  }
  return fallback;
}

/**
 * Adapter: Map Backend Product to Mobile App Ecom Product
 */
export function mapBackendToEcomProduct(raw: any): MobileEcomProduct {
  if (!raw) {
    return {
      id: '',
      brand: '',
      title: 'Product',
      description: '',
      price: 0,
      originalPrice: 0,
      discountPercent: 0,
      inStock: false,
      rating: 0,
      reviewCount: 0,
      category: '',
      colors: [],
      storage: '',
      image: demoProductPhoto,
      images: [demoProductPhoto],
      seller: { id: '', name: '', location: '', avatar: '' },
      specs: {
        brand: '',
        sku: '',
        category: '',
        totalVariants: 0,
        totalStock: 0,
        priceRange: '$0',
        warranty: '',
      },
      variants: [],
      reviewBreakdown: [],
      raw: null,
    };
  }

  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const gallery = rawImages.length > 0
    ? rawImages.map((img: any) => resolveImageSource(img, demoProductPhoto))
    : [resolveImageSource(raw.image, demoProductPhoto)];
  const mainImage = gallery[0] || demoProductPhoto;

  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  const defaultVar = variants.find((v: any) => v.isDefault) || variants[0] || {};

  const price = Number(
    defaultVar?.discountPrice ||
    defaultVar?.price ||
    raw.sellingPrice ||
    raw.price ||
    495,
  );

  const originalPrice = Number(
    defaultVar?.price ||
    raw.originalPrice ||
    raw.regularPrice ||
    Math.round(price * 1.2),
  );

  const discountPercent = Number(
    raw.discountPercentage ??
    raw.discountPercent ??
    (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 10),
  );

  const stock = Number(defaultVar?.stock || raw.quantity || raw.stock || 10);

  const cleanDescription = typeof raw.description === 'string'
    ? raw.description.replace(/<[^>]+>/g, '').trim()
    : raw.shortDescription || 'High quality device with guaranteed warranty and support.';

  const sellerObj = raw.sellerId && typeof raw.sellerId === 'object' ? raw.sellerId : {};
  const sellerName = sellerObj.storeName || sellerObj.name || raw.sellerName || 'Verified Seller';
  const sellerLoc = sellerObj.address || sellerObj.city || 'Karachi, Pakistan';
  const sellerAvatar = sellerObj.avatar || `https://picsum.photos/seed/${raw._id || 'seller'}/200/200`;

  const mappedVariants = variants.map((v: any, idx: number) => {
    const attrLabel = Array.isArray(v.attributes) && v.attributes.length > 0
      ? v.attributes.map((a: any) => a.value || a.name).filter(Boolean).join(' • ')
      : '';
    const label = v.title || v.name || attrLabel || v.label || `Variant ${idx + 1}`;
    const vPrice = Number(v.discountPrice || v.sellingPrice || v.price || price);
    const vOrigPrice = Number(v.sellingPrice || v.price || originalPrice);
    const vStock = Number(v.stock ?? 5);
    const vImage = v.images?.[0]?.url
      ? { uri: v.images[0].url }
      : (v.image ? resolveImageSource(v.image, mainImage) : mainImage);

    return {
      id: String(v._id || v.id || `var-${idx}`),
      label,
      price: vPrice,
      originalPrice: vOrigPrice,
      verified: true,
      stockLeft: vStock,
      image: vImage,
      attributes: v.attributes || [],
    };
  });

  const safeString = (val: any, fallback = ''): string => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') {
      return val.name || val.title || val.storeName || fallback;
    }
    return fallback;
  };

  const finalBrand = safeString(raw.brand, safeString(raw.brandName, safeString(raw.category, 'CTI Store')));
  const finalTitle = safeString(raw.title, safeString(raw.name, 'Electronic Gadget'));
  const finalCategory = safeString(raw.category, safeString(raw.productCategoryId, safeString(raw.productSubCategoryId, 'Electronics')));

  const rawSellerId = sellerObj._id || sellerObj.id || (typeof raw.sellerId === 'string' ? raw.sellerId : (raw.sellerId?._id || ''));

  return {
    id: String(raw._id || raw.id || Math.random().toString()),
    slug: raw.slug || String(raw._id || raw.id || ''),
    brand: finalBrand,
    title: finalTitle,
    description: cleanDescription,
    price,
    originalPrice,
    discountPercent,
    inStock: stock > 0,
    rating: Number(raw.averageRating || raw.rating || 4.5),
    reviewCount: Number(raw.numReviews || raw.reviewCount || 0),
    category: finalCategory,
    colors: COLORS,
    storage: STORAGE_OPTIONS[0],
    image: mainImage,
    images: gallery,
    seller: {
      id: rawSellerId ? String(rawSellerId) : '',
      name: sellerName,
      location: sellerLoc,
      avatar: sellerAvatar,
    },
    specs: {
      brand: finalBrand,
      sku: typeof raw.sku === 'string' ? raw.sku : `SKU-${String(raw._id || 'CTI-V1').slice(-8)}`,
      category: finalCategory,
      totalVariants: mappedVariants.length || 1,
      totalStock: stock,
      priceRange: `$${price} - $${originalPrice}`,
      warranty: typeof raw.warranty === 'string' ? raw.warranty : '1 Year Official Warranty',
    },
    variants: mappedVariants,
    reviewBreakdown: [
      { stars: 5, percent: 80 },
      { stars: 4, percent: 15 },
      { stars: 3, percent: 5 },
      { stars: 2, percent: 0 },
      { stars: 1, percent: 0 },
    ],
    raw,
  };
}

/**
 * 1. Fetch Home Feed (/home)
 */
export async function getHomeFeed(): Promise<any> {
  try {
    const res = await apiClient.get('/home');
    return res.data?.data || null;
  } catch (err: any) {
    console.warn('getHomeFeed error fallback:', err?.message);
    return null;
  }
}

/**
 * 2. Fetch All E-Commerce Marketplace Products
 */
export async function getEcomProducts(params?: Record<string, any>): Promise<MobileEcomProduct[]> {
  try {
    const res = await apiClient.get('/e-commerce/products', { params });
    const list = res.data?.data?.products || res.data?.data || res.data?.products;
    if (Array.isArray(list) && list.length > 0) {
      return list.map(mapBackendToEcomProduct);
    }
    return [];
  } catch (err: any) {
    if (__DEV__) console.warn('getEcomProducts error:', err?.message);
    return [];
  }
}

/**
 * 3. Fetch Single E-Commerce Product Detail
 */
export async function getEcomProductDetail(slugOrId: string): Promise<MobileEcomProduct | null> {
  if (!slugOrId) return null;
  try {
    const res = await apiClient.get(`/e-commerce/products/${slugOrId}`);
    if (res.data?.success && res.data?.data) {
      const data = res.data.data;
      const prod = data?.product || (data?._id ? data : null);
      if (prod) {
        if (Array.isArray(data?.variants) && data.variants.length > 0) {
          prod.variants = data.variants;
        }
        if (data?.seller) {
          prod.seller = data.seller;
        }
        return mapBackendToEcomProduct(prod);
      }
    }

    // Backend endpoint /e-commerce/products/:slug expects slug, not _id!
    // If slugOrId was an _id or not found directly, look up its real slug:
    const all = await getEcomProducts();
    const matched = all.find(p => p.id === slugOrId || p.slug === slugOrId);
    if (matched && matched.slug && matched.slug !== slugOrId) {
      return getEcomProductDetail(matched.slug);
    }
    return matched || null;
  } catch (err: any) {
    try {
      const all = await getEcomProducts();
      const matched = all.find(p => p.id === slugOrId || p.slug === slugOrId);
      if (matched && matched.slug && matched.slug !== slugOrId) {
        return getEcomProductDetail(matched.slug);
      }
      return matched || null;
    } catch {}
    if (__DEV__) console.warn(`getEcomProductDetail(${slugOrId}) error:`, err?.message);
    return null;
  }
}

export interface MobileCartItem {
  id: string;
  productId: string;
  variantId?: string;
  variantLabel?: string;
  title: string;
  price: number;
  quantity: number;
  image: any;
  product?: any;
}

/**
 * Adapter: Map Backend Cart response to MobileCartItem[]
 */
export function mapBackendCartItems(cartData: any): MobileCartItem[] {
  if (!cartData) return [];
  const rawItems = Array.isArray(cartData.items)
    ? cartData.items
    : Array.isArray(cartData)
    ? cartData
    : [];

  return rawItems.map((item: any, idx: number) => {
    const p = item.productId && typeof item.productId === 'object' ? item.productId : {};
    const v = item.variantId && typeof item.variantId === 'object' ? item.variantId : {};
    const pId = String(p._id || p.id || item.productId || `prod-${idx}`);
    const vId = v._id || v.id || (typeof item.variantId === 'string' ? item.variantId : undefined);

    const title = p.title || p.name || item.name || item.title || `Item ${idx + 1}`;
    const variantLabel = v.title || v.name || v.label || item.variantLabel || item.variantTitle;

    const price = Number(
      item.price ||
      v.discountPrice ||
      v.price ||
      p.sellingPrice ||
      p.price ||
      0
    );
    const quantity = Math.max(1, Number(item.quantity || item.qty || 1));

    const rawImg = p.images?.[0]?.url || p.images?.[0] || p.image?.url || p.image || item.image;
    const image = rawImg
      ? (typeof rawImg === 'string' ? { uri: rawImg } : rawImg)
      : demoProductPhoto;

    return {
      id: vId ? `${pId}-${vId}` : pId || String(item._id || `cart-${idx}`),
      productId: pId,
      variantId: vId ? String(vId) : undefined,
      variantLabel,
      title,
      price,
      quantity,
      image,
      product: p,
    };
  });
}

/**
 * 4. Fetch Cart Items (/e-commerce/cart/my-cart)
 */
export async function getCartApi(): Promise<{ items: MobileCartItem[]; subtotal: number; raw?: any }> {
  try {
    const res = await apiClient.get('/e-commerce/cart/my-cart');
    const data = res.data?.data || res.data;
    const items = mapBackendCartItems(data);
    const subtotal = Number(
      data?.totalPrice ||
      data?.subtotal ||
      items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    );
    return { items, subtotal, raw: data };
  } catch (err: any) {
    console.warn('getCartApi error fallback:', err?.message);
    return { items: [], subtotal: 0 };
  }
}

/**
 * 5. Add Item to Cart
 */
export async function addToCartApi(
  productId: string,
  variantId?: string,
  quantity = 1
): Promise<any> {
  try {
    // Only send variantId if it is a valid 24-hex ObjectId; otherwise leave undefined so backend picks default variant
    const cleanVariantId =
      variantId && variantId.length === 24 && !variantId.startsWith('var-') && !variantId.startsWith('v')
        ? variantId
        : undefined;

    const res = await apiClient.post('/e-commerce/cart/my-cart/items', {
      productId,
      variantId: cleanVariantId,
      quantity,
    });
    return res.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Could not add to cart';
    throw new Error(msg);
  }
}

/**
 * 6. Update Cart Item Quantity
 */
export async function updateCartItemApi(
  productId: string,
  variantId?: string,
  quantity = 1,
  delta?: number
): Promise<any> {
  try {
    const payload: any = {
      productId,
      variantId: variantId || undefined,
      quantity,
    };
    if (typeof delta === 'number') {
      payload.delta = delta;
    }
    const res = await apiClient.put('/e-commerce/cart/my-cart/items', payload);
    return res.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Could not update quantity';
    throw new Error(msg);
  }
}

/**
 * 7. Remove Cart Item
 */
export async function removeCartItemApi(productId: string, variantId?: string): Promise<any> {
  try {
    const res = await apiClient.delete('/e-commerce/cart/my-cart/items', {
      data: { productId, variantId: variantId || undefined },
    });
    return res.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Could not remove item';
    throw new Error(msg);
  }
}

/**
 * Helper to map backend Wishlist item
 */
export function mapBackendWishlistItem(item: any): any {
  const p = item?.productId || item;
  if (!p) return null;
  return mapBackendToEcomProduct(p);
}

/**
 * 8. Fetch Wishlist Items (/e-commerce/wishlist)
 */
export async function getWishlistApi(): Promise<{ items: any[]; raw?: any }> {
  try {
    const res = await apiClient.get('/e-commerce/wishlist');
    const data = res.data?.data || res.data;
    const rawItems = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    const items = rawItems.map(mapBackendWishlistItem).filter(Boolean);
    return { items, raw: data };
  } catch (err: any) {
    if (__DEV__) console.warn('getWishlistApi error fallback:', err?.message);
    return { items: [] };
  }
}

/**
 * 9. Toggle Wishlist Item (/e-commerce/wishlist/toggle)
 */
export async function toggleWishlistApi(productId: string, variantId?: string): Promise<any> {
  try {
    const res = await apiClient.post('/e-commerce/wishlist/toggle', {
      productId,
      variantId: variantId || undefined,
    });
    return res.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Could not toggle wishlist';
    throw new Error(msg);
  }
}

/**
 * 10. Fetch Seller Store Profile & Products (/e-commerce/sellers/:sellerId)
 */
export async function getSellerStoreApi(
  sellerId: string,
): Promise<{ seller: any; products: MobileEcomProduct[] } | null> {
  if (!sellerId) return null;
  try {
    const res = await apiClient.get(`/e-commerce/sellers/${sellerId}`, {
      params: { limit: 20 },
    });
    if (res.data?.success && res.data?.data) {
      const seller = res.data.data.seller;
      const rawProducts = res.data.data.products || [];
      const products = rawProducts.map(mapBackendToEcomProduct);
      return { seller, products };
    }
    return null;
  } catch (err: any) {
    if (__DEV__) console.warn('getSellerStoreApi error:', err?.message);
    return null;
  }
}

/**
 * 11. Send Product Query to Seller (/customer/queries) - Matches Next.js EcomProductDetail
 */
export async function sendProductQueryApi(params: {
  sellerId: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiClient.post('/customer/queries', {
      sellerId: params.sellerId,
      queryType: 'customer',
      subject: params.subject,
      message: params.message,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to send message to seller');
  }
}

/**
 * 12. Fetch Product Reviews (/e-commerce/products/:slug/reviews)
 */
export async function getProductReviewsApi(slugOrId: string): Promise<any[]> {
  try {
    const res = await apiClient.get(`/e-commerce/products/${slugOrId}/reviews`);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (err: any) {
    if (__DEV__) console.log('[ecomApi] getProductReviewsApi error:', err?.message);
    return [];
  }
}

/**
 * 13. Check Review Eligibility (/e-commerce/products/:slug/review-eligibility)
 */
export async function checkReviewEligibilityApi(slugOrId: string): Promise<boolean> {
  try {
    const res = await apiClient.get(`/e-commerce/products/${slugOrId}/review-eligibility`);
    return Boolean(res.data?.success && res.data?.canReview);
  } catch {
    return false;
  }
}

/**
 * 14. Submit Product Review (/e-commerce/products/:slug/reviews)
 */
export async function submitProductReviewApi(
  slugOrId: string,
  payload: {
    rating: number;
    comment: string;
    photoUri?: string | null;
    videoUri?: string | null;
    photoType?: string;
    photoName?: string;
    videoType?: string;
    videoName?: string;
  },
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    if (payload.photoUri || payload.videoUri) {
      const formData = new FormData();
      formData.append('rating', String(payload.rating));
      formData.append('comment', payload.comment.trim());

      if (payload.photoUri) {
        const defaultName = `review_photo_${Date.now()}.jpg`;
        const filename = payload.photoName || payload.photoUri.split('/').pop() || defaultName;
        const match = /\.(\w+)$/.exec(filename);
        const type = payload.photoType || (match ? `image/${match[1]}` : 'image/jpeg');
        const uri =
          Platform.OS === 'android' ? payload.photoUri : payload.photoUri.replace('file://', '');
        formData.append('images', {
          uri,
          name: filename,
          type,
        } as any);
      }

      if (payload.videoUri) {
        const defaultName = `review_video_${Date.now()}.mp4`;
        const filename = payload.videoName || payload.videoUri.split('/').pop() || defaultName;
        const match = /\.(\w+)$/.exec(filename);
        const type = payload.videoType || (match ? `video/${match[1]}` : 'video/mp4');
        const uri =
          Platform.OS === 'android' ? payload.videoUri : payload.videoUri.replace('file://', '');
        formData.append('video', {
          uri,
          name: filename,
          type,
        } as any);
      }

      const res = await apiClient.post(`/e-commerce/products/${slugOrId}/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: data => data,
        timeout: 60000,
      });
      return { success: Boolean(res.data?.success), data: res.data?.data, message: res.data?.message };
    }

    const res = await apiClient.post(`/e-commerce/products/${slugOrId}/reviews`, {
      rating: payload.rating,
      comment: payload.comment.trim(),
    });
    return { success: Boolean(res.data?.success), data: res.data?.data, message: res.data?.message };
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Failed to submit review. Please try again.';
    throw new Error(errorMsg);
  }
}

/**
 * 15. Delete Product Review (/e-commerce/products/:slug/reviews/:reviewId)
 */
export async function deleteProductReviewApi(
  slugOrId: string,
  reviewId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiClient.delete(`/e-commerce/products/${slugOrId}/reviews/${reviewId}`);
    return { success: Boolean(res.data?.success), message: res.data?.message };
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Failed to delete review.';
    throw new Error(errorMsg);
  }
}




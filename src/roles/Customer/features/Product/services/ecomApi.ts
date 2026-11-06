import { Platform } from 'react-native';
import apiClient from '@/services/apiClient';
import { demoProductPhoto } from '@/assets/images';

export const COLOR_HEX_MAP: Record<string, string> = {
  black: '#18181b',
  white: '#f5f5f5',
  gray: '#6b7280',
  grey: '#6b7280',
  blue: '#3b82f6',
  pink: '#ec4899',
  green: '#22c55e',
  gold: '#d4a017',
  red: '#ef4444',
  navy: '#1e3a5f',
  purple: '#a855f7',
  orange: '#f97316',
  brown: '#92400e',
  teal: '#14b8a6',
  yellow: '#eab308',
  beige: '#d4b896',
  silver: '#c0c0c0',
  platinum: '#e5e4e2',
  obsidian: '#0b0b0b',
  midnight: '#191970',
  starlight: '#f8f9fa',
  graphite: '#41424c',
  emerald: '#10b981',
  lilac: '#d8b4e2',
  iceblue: '#bae6fd',
  bay: '#60a5fa',
  floral: '#fbcfe8',
  natural: '#99958f',
  titanium: '#707070',
};

export function getColorHex(name?: string | null): string {
  if (!name) return '#6B7280';
  const lower = name.trim().toLowerCase();
  if (COLOR_HEX_MAP[lower]) return COLOR_HEX_MAP[lower];
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex;
  }
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export interface MobileEcomProduct {
  id: string;
  slug?: string;
  brand: string;
  brandId?: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  inStock: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  category: string;
  categoryId?: string;
  colors: Array<{ name: string; hex?: string | null }>;
  attrTypes: string[];
  attrOptions: Record<string, Array<{ value: string; hex?: string | null; count: number }>>;
  storage: string;
  image: any;
  images: any[];
  seller: {
    id?: string;
    name: string;
    location: string;
    avatar: string;
    isApproved?: boolean;
    isOnline?: boolean;
    storeAddress?: string;
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
  warranty?: {
    type?: string;
    months?: number;
  };
  variants: Array<{
    id: string;
    label: string;
    sku?: string;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    verified: boolean;
    stockLeft: number;
    isDefault?: boolean;
    image: any;
    attributes?: Array<{ name: string; value: string; colorHex?: string | null }>;
    specs?: any[];
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
      stock: 0,
      rating: 0,
      reviewCount: 0,
      category: '',
      colors: [],
      attrTypes: [],
      attrOptions: {},
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
    defaultVar?.sellingPrice ||
    defaultVar?.price ||
    raw.sellingPrice ||
    raw.price ||
    0,
  );

  const originalPrice = Number(
    defaultVar?.sellingPrice ||
    defaultVar?.price ||
    raw.originalPrice ||
    raw.regularPrice ||
    price,
  );

  const discountPercent = Number(
    defaultVar?.discountPercentage ??
    raw.discountPercentage ??
    raw.discountPercent ??
    (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0),
  );

  // Extract all attribute types and their options (matching Next.js web app)
  const attrTypes: string[] = Array.from(
    new Set(variants.flatMap((v: any) => (v.attributes || []).map((a: any) => a.name)).filter(Boolean))
  );

  const attrOptions: Record<string, Array<{ value: string; hex?: string | null; count: number }>> = {};
  attrTypes.forEach(type => {
    const map = new Map<string, { value: string; hex?: string | null; count: number }>();
    variants.forEach((v: any) => {
      const a = (v.attributes || []).find((att: any) => att.name === type);
      if (a && a.value) {
        const val = String(a.value).trim();
        const hex = a.colorHex || COLOR_HEX_MAP[val.toLowerCase()] || null;
        const existing = map.get(val) || { value: val, hex, count: 0 };
        existing.count += 1;
        map.set(val, existing);
      }
    });
    attrOptions[type] = Array.from(map.values());
  });

  const colors = attrOptions['Color'] || attrOptions['Colour'] || [];
  const storageList = attrOptions['Storage'] || [];
  const storageDefault = storageList[0]?.value || '';

  const totalStock = variants.length > 0
    ? variants.reduce((s: number, v: any) => s + (Number(v.stock) || 0), 0)
    : Number(raw.stock ?? raw.quantity ?? 0);
  const defaultStock = Number(defaultVar?.stock ?? (variants.length === 0 ? totalStock : 0));

  const cleanDescription = typeof raw.description === 'string'
    ? raw.description.replace(/<[^>]+>/g, '').trim()
    : raw.shortDescription || '';

  const sellerObj = raw.seller || (raw.sellerId && typeof raw.sellerId === 'object' ? raw.sellerId : {});
  const sellerName = sellerObj.businessName || sellerObj.storeName || sellerObj.name || raw.sellerName || 'Verified Store';
  const sellerLoc = sellerObj.storeAddress || sellerObj.address || sellerObj.city || 'Pakistan';
  const sellerAvatar = sellerObj.profilePictureOrLogo || sellerObj.avatar || `https://picsum.photos/seed/${raw._id || 'seller'}/200/200`;
  const rawSellerId = sellerObj._id || sellerObj.id || sellerObj.userId || (typeof raw.sellerId === 'string' ? raw.sellerId : '');

  const mappedVariants = variants.map((v: any, idx: number) => {
    const attrLabel = Array.isArray(v.attributes) && v.attributes.length > 0
      ? v.attributes.map((a: any) => a.value || a.name).filter(Boolean).join(' / ')
      : '';
    const label = v.title || v.name || attrLabel || v.label || `Option ${idx + 1}`;
    const vPrice = Number(v.discountPrice || v.sellingPrice || v.price || price);
    const vOrigPrice = Number(v.sellingPrice || v.price || originalPrice);
    const vDiscount = Number(v.discountPercentage ?? (vOrigPrice > vPrice ? Math.round(((vOrigPrice - vPrice) / vOrigPrice) * 100) : 0));
    const vStock = Number(v.stock ?? 0);
    const vImage = v.images?.[0]?.url
      ? { uri: v.images[0].url }
      : (v.image ? resolveImageSource(v.image, mainImage) : mainImage);

    return {
      id: String(v._id || v.id || `var-${idx}`),
      label,
      sku: v.sku || '',
      price: vPrice,
      originalPrice: vOrigPrice,
      discountPercent: vDiscount,
      verified: true,
      stockLeft: vStock,
      isDefault: Boolean(v.isDefault),
      image: vImage,
      attributes: v.attributes || [],
      specs: v.specs || [],
    };
  });

  const isMongoId = (val: any): boolean => {
    return typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());
  };

  const resolveDisplayName = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'object') {
      const candidate = val.title || val.name || val.storeName || val.label;
      if (candidate && typeof candidate === 'string' && !isMongoId(candidate)) {
        return candidate.trim();
      }
      return null;
    }
    if (typeof val === 'string' && !isMongoId(val)) {
      return val.trim();
    }
    return null;
  };

  // 1. Resolve Brand (strictly never an ObjectId string)
  const brandFromObj = resolveDisplayName(raw.brand);
  const brandFromName = resolveDisplayName(raw.brandName);
  let finalBrand = brandFromObj || brandFromName;

  if (!finalBrand) {
    const rawTitle = typeof raw.title === 'string' ? raw.title : (typeof raw.name === 'string' ? raw.name : '');
    const knownBrands = [
      'Lenovo', 'Samsung', 'Apple', 'Dell', 'HP', 'Sony', 'Asus', 'Acer',
      'Xiaomi', 'Google', 'OnePlus', 'Logitech', 'Microsoft', 'Huawei', 'Oppo', 'Vivo', 'Realme',
    ];
    const matched = knownBrands.find(b => new RegExp(`\\b${b}\\b`, 'i').test(rawTitle));
    finalBrand = matched || 'CTI Store';
  }

  // 2. Resolve Category (strictly never an ObjectId string)
  const catFromObj = resolveDisplayName(raw.category);
  const catFromName = resolveDisplayName(raw.categoryName);
  const subcatFromObj = resolveDisplayName(raw.subcategory || raw.subCategory);
  const finalCategory = catFromObj || catFromName || subcatFromObj || 'Electronics';

  const finalTitle = resolveDisplayName(raw.title) || resolveDisplayName(raw.name) || 'Electronic Gadget';
  const rawCategoryId = String(raw.category?._id || (isMongoId(raw.categoryId) ? raw.categoryId : raw.categoryId?._id || ''));
  const rawBrandId = String(raw.brand?._id || (isMongoId(raw.brandId) ? raw.brandId : raw.brandId?._id || ''));

  // Real warranty format matching Next.js
  let warrantyText = 'No Warranty';
  if (typeof raw.warranty === 'string') {
    warrantyText = raw.warranty;
  } else if (raw.warranty?.type === 'yes') {
    const m = Number(raw.warranty.months || 0);
    if (m >= 12) {
      const yrs = Math.floor(m / 12);
      warrantyText = `${yrs} Year${yrs > 1 ? 's' : ''} Official Warranty Included`;
    } else if (m > 0) {
      warrantyText = `${m} Month${m > 1 ? 's' : ''} Official Warranty Included`;
    } else {
      warrantyText = 'Official Warranty Included';
    }
  }

  const minPrice = mappedVariants.length > 0 ? Math.min(...mappedVariants.map(v => v.price)) : price;
  const maxPrice = mappedVariants.length > 0 ? Math.max(...mappedVariants.map(v => v.originalPrice || v.price)) : originalPrice;
  const priceRange = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  return {
    id: String(raw._id || raw.id || Math.random().toString()),
    slug: raw.slug || String(raw._id || raw.id || ''),
    brand: finalBrand,
    brandId: rawBrandId,
    title: finalTitle,
    description: cleanDescription,
    price,
    originalPrice,
    discountPercent,
    inStock: defaultStock > 0,
    stock: defaultStock,
    rating: Number(raw.ratings?.average || raw.averageRating || raw.rating || 0),
    reviewCount: Number(raw.ratings?.count || raw.numReviews || raw.reviewCount || 0),
    category: finalCategory,
    categoryId: rawCategoryId,
    colors: colors.map((c: any) => ({ name: c.value, hex: c.hex })),
    attrTypes,
    attrOptions,
    storage: storageDefault,
    image: mainImage,
    images: gallery,
    seller: {
      id: rawSellerId ? String(rawSellerId) : '',
      name: sellerName,
      location: sellerLoc,
      avatar: sellerAvatar,
      isApproved: Boolean(sellerObj.isApproved),
      isOnline: Boolean(sellerObj.isOnline),
      storeAddress: sellerLoc,
    },
    specs: {
      brand: finalBrand,
      sku: typeof raw.sku === 'string' ? raw.sku : (defaultVar?.sku || `SKU-${String(raw._id || 'CTI-V1').slice(-8)}`),
      category: finalCategory,
      totalVariants: mappedVariants.length || 1,
      totalStock,
      priceRange,
      warranty: warrantyText,
    },
    warranty: raw.warranty,
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

export interface EcomFilterCategory {
  _id: string;
  title: string;
  count: number;
}

export interface EcomFilterColor {
  name: string;
  hex?: string | null;
}

export interface EcomFilterDynamicAttr {
  name: string;
  values: string[];
}

export interface EcomFilterData {
  categories: EcomFilterCategory[];
  colors: EcomFilterColor[];
  dynamicAttributes: EcomFilterDynamicAttr[];
  stockStatus?: { inStock: number; outOfStock: number };
  warrantyOptions?: Array<{ type: string; months: number; count: number; label: string }>;
}

/**
 * 2a. Fetch E-Commerce Filter Options (/e-commerce/products/filters)
 */
export async function getEcomProductFiltersApi(): Promise<EcomFilterData | null> {
  try {
    const res = await apiClient.get('/e-commerce/products/filters');
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err: any) {
    if (__DEV__) console.warn('getEcomProductFiltersApi error:', err?.message);
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
  isRefurbished?: boolean;
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




import apiClient from '@/services/apiClient';
import { demoProductPhoto } from '@/assets/images';
import { PRODUCTS, COLORS, STORAGE_OPTIONS } from '../data/products';

export interface MobileEcomProduct {
  id: string;
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
    verified: boolean;
    stockLeft: number;
    image: any;
  }>;
  reviewBreakdown: Array<{ stars: number; percent: number }>;
  raw?: any;
}

/**
 * Adapter: Map Backend Product to Mobile App Ecom Product
 */
export function mapBackendToEcomProduct(raw: any): MobileEcomProduct {
  if (!raw) return PRODUCTS[0] as any;

  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const primaryImageUrl = rawImages[0]?.url || raw.image?.url || (typeof raw.image === 'string' ? raw.image : null);
  const mainImage = primaryImageUrl ? { uri: primaryImageUrl } : demoProductPhoto;

  const gallery = rawImages.length > 0
    ? rawImages.map((img: any) => (img?.url ? { uri: img.url } : demoProductPhoto))
    : [mainImage];

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

  const mappedVariants = variants.map((v: any, idx: number) => ({
    id: String(v._id || v.id || `var-${idx}`),
    label: v.title || v.name || v.label || `Variant ${idx + 1}`,
    price: Number(v.discountPrice || v.price || price),
    verified: true,
    stockLeft: Number(v.stock || 5),
    image: v.images?.[0]?.url ? { uri: v.images[0].url } : mainImage,
  }));

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

  return {
    id: String(raw._id || raw.id || Math.random().toString()),
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
    variants: mappedVariants.length > 0 ? mappedVariants : (PRODUCTS[0].variants as any),
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
    return PRODUCTS as any;
  } catch (err: any) {
    console.warn('getEcomProducts error fallback:', err?.message);
    return PRODUCTS as any;
  }
}

/**
 * 3. Fetch Single E-Commerce Product Detail
 */
export async function getEcomProductDetail(slugOrId: string): Promise<MobileEcomProduct> {
  try {
    const res = await apiClient.get(`/e-commerce/products/${slugOrId}`);
    const prod = res.data?.data?.product || res.data?.data || res.data;
    if (prod) {
      return mapBackendToEcomProduct(prod);
    }
    const found = PRODUCTS.find(p => p.id === slugOrId);
    return (found as any) || (PRODUCTS[0] as any);
  } catch (err: any) {
    console.warn(`getEcomProductDetail(${slugOrId}) error fallback:`, err?.message);
    const found = PRODUCTS.find(p => p.id === slugOrId);
    return (found as any) || (PRODUCTS[0] as any);
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
    const res = await apiClient.post('/e-commerce/cart/my-cart/items', {
      productId,
      variantId: variantId || undefined,
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

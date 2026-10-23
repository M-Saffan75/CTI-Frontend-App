import apiClient from '@/services/apiClient';
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
  if (!raw) return REFURBISHED_PRODUCTS[0];

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
    return REFURBISHED_CATEGORIES;
  } catch (error) {
    console.warn('getRefurbishedCategories fallback to mock:', error);
    return REFURBISHED_CATEGORIES;
  }
}

/**
 * 2. Fetch Top Selling Refurbished Products
 */
export async function getTopSellingProducts(): Promise<RefurbishedProduct[]> {
  try {
    const res = await apiClient.get('/public/refurbished-devices/products/top-selling');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map(mapBackendToProduct);
    }
    return REFURBISHED_PRODUCTS;
  } catch (error) {
    console.warn('getTopSellingProducts fallback to mock:', error);
    return REFURBISHED_PRODUCTS;
  }
}

/**
 * 3. Fetch Products for a Specific Category
 */
export async function getCategoryProducts(categorySlug: string): Promise<RefurbishedProduct[]> {
  try {
    const res = await apiClient.get(`/public/refurbished-devices/products/category/${categorySlug}`);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map(mapBackendToProduct);
    }
    return REFURBISHED_PRODUCTS.filter(p =>
      p?.category?.toLowerCase()?.includes(categorySlug.toLowerCase()),
    );
  } catch (error) {
    console.warn(`getCategoryProducts(${categorySlug}) fallback to mock:`, error);
    return REFURBISHED_PRODUCTS;
  }
}

/**
 * 4. Fetch All / Filtered Refurbished Products
 */
export async function getRefurbishedProducts(params?: Record<string, any>): Promise<RefurbishedProduct[]> {
  try {
    const res = await apiClient.get('/public/refurbished-devices/products', { params });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map(mapBackendToProduct);
    }
    return REFURBISHED_PRODUCTS;
  } catch (error) {
    console.warn('getRefurbishedProducts fallback to mock:', error);
    return REFURBISHED_PRODUCTS;
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
    const found = REFURBISHED_PRODUCTS.find(p => p.id === idOrSlug || p.name === idOrSlug);
    return found || null;
  } catch (error) {
    console.warn(`getRefurbishedProductDetail(${idOrSlug}) fallback:`, error);
    const found = REFURBISHED_PRODUCTS.find(p => p.id === idOrSlug);
    return found || null;
  }
}

/**
 * 6. Fetch Available Models for a Brand (Sell Device Flow)
 */
export async function getSellDeviceModels(brandSlug: string): Promise<string[]> {
  try {
    const res = await apiClient.get(`/public/sell-device/brands/${brandSlug.toLowerCase()}/models`);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map((m: any) => m.name || m.title || String(m));
    }
    return [];
  } catch (error) {
    console.warn(`getSellDeviceModels(${brandSlug}) error:`, error);
    return [];
  }
}

/**
 * 7. Fetch Sell Device Config & Condition Questions
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
 * 8. Submit Sell Device Application / Quote
 */
export async function submitSellDeviceApplication(formData: FormData): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await apiClient.post('/public/sell-device/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: Boolean(res.data?.success),
      data: res.data?.data,
      message: res.data?.message || 'Application submitted successfully',
    };
  } catch (error: any) {
    console.warn('submitSellDeviceApplication error:', error?.response?.data || error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to submit quote application',
    };
  }
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWishlistApi, mapBackendWishlistItem, toggleWishlistApi } from '../features/Product/services/ecomApi';
import {
  getRefurbishedWishlist,
  toggleRefurbishedWishlist,
} from '@/features/Refurbished/services/refurbishedApi';
import { demoProductPhoto } from '@/assets/images';

const STORAGE_KEY = 'customer_wishlist';

function resolveId(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  const id = val._id || val.id;
  return id ? String(id) : null;
}

function mapRefurbishedWishlistItem(it: any): any {
  if (!it) return null;
  const p = typeof it.productId === 'object' && it.productId ? it.productId : (typeof it.product === 'object' && it.product ? it.product : {});
  const v = typeof it.variantId === 'object' && it.variantId ? it.variantId : {};
  const pId = resolveId(p) || resolveId(it.productId) || '';
  if (!pId) return null;

  const vId = resolveId(v) || resolveId(it.variantId) || resolveId(p.defaultVariantId) || resolveId(p.variants?.[0]);
  const price = Number(v.discountPrice || v.sellingPrice || v.price || p.price || 0);
  const rawImages = Array.isArray(p.images) ? p.images : [];
  const varImages = Array.isArray(v.images) ? v.images : [];
  const imgUrl = varImages[0]?.url || rawImages[0]?.url || p.image;
  const imageSource = imgUrl ? (typeof imgUrl === 'string' ? { uri: imgUrl } : imgUrl) : demoProductPhoto;

  return {
    id: pId,
    _id: pId,
    productId: pId,
    variantId: vId || undefined,
    title: p.title || p.name || 'Refurbished Device',
    brand: typeof p.brandId === 'object' ? p.brandId?.name : (p.brand || 'CTI'),
    category: typeof p.categoryId === 'object' ? p.categoryId?.name : (p.category || 'Refurbished'),
    price,
    originalPrice: Number(v.sellingPrice || p.originalPrice || price),
    discountPercent: Number(v.discountPercentage || p.discountPercent || 0),
    image: imageSource,
    isRefurbished: true,
    raw: p,
    rawItem: it,
  };
}

interface WishlistContextType {
  ids: string[];
  items: any[];
  count: number;
  loading: boolean;
  isSaved: (id: string | number) => boolean;
  toggle: (productOrId: any, extraOrProduct?: any) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Initial Load: from AsyncStorage cache first, then sync with backend (Standard + Refurbished)
  const loadWishlist = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.ids)) setIds(parsed.ids);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
      }
    } catch {}

    // Fetch from backend (both regular marketplace + refurbished wishlist, matching Next.js)
    try {
      setLoading(true);
      const [res, refurbRaw] = await Promise.all([
        getWishlistApi().catch(() => null),
        getRefurbishedWishlist().catch(() => []),
      ]);

      const standardItems = res && Array.isArray(res.items) ? res.items : [];
      const refurbMapped = Array.isArray(refurbRaw)
        ? refurbRaw.map(mapRefurbishedWishlistItem).filter(Boolean)
        : [];

      // Combine standard + refurb items, strictly DEDUPLICATING by unique product ID
      const seenIds = new Set<string>();
      const dedupedItems: any[] = [];

      for (const item of [...standardItems, ...refurbMapped]) {
        const pId = String(item.id || item._id || item.productId);
        if (pId && !seenIds.has(pId)) {
          seenIds.add(pId);
          dedupedItems.push(item);
        }
      }

      const dedupedIds = Array.from(seenIds);

      setItems(dedupedItems);
      setIds(dedupedIds);
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ids: dedupedIds, items: dedupedItems })
      );
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isSaved = useCallback(
    (id: string | number) => {
      const strId = String(id);
      return ids.includes(strId);
    },
    [ids]
  );

  const toggle = useCallback(
    async (productOrId: any, extraOrProduct?: any): Promise<boolean> => {
      let rawId: any = null;
      let incomingProduct: any = null;

      if (typeof productOrId === 'object' && productOrId !== null) {
        incomingProduct = productOrId;
        rawId = resolveId(productOrId.rawId) || resolveId(productOrId._id) || resolveId(productOrId.id) || resolveId(productOrId.productId);
      } else {
        rawId = resolveId(productOrId);
        if (typeof extraOrProduct === 'object' && extraOrProduct !== null) {
          incomingProduct = extraOrProduct;
        }
      }

      if (!rawId) return false;
      const strId = String(rawId);
      const currentlySaved = ids.includes(strId);

      // Detect if refurbished product
      const isRefurb = Boolean(
        incomingProduct?.isRefurbished ||
        incomingProduct?.condition === 'Refurbished' ||
        incomingProduct?.grade ||
        incomingProduct?.rawItem ||
        items.some(it => String(it.id || it._id) === strId && it.isRefurbished)
      );

      // Optimistic state calculation
      let newIds: string[];
      let newItems: any[];

      if (currentlySaved) {
        newIds = ids.filter(i => i !== strId);
        newItems = items.filter(it => String(it.id || it._id) !== strId);
      } else {
        newIds = [...ids, strId];
        const productObj = incomingProduct
          ? (isRefurb ? mapRefurbishedWishlistItem({ productId: incomingProduct }) : mapBackendWishlistItem(incomingProduct))
          : { id: strId, _id: strId, title: 'Favorited Product', isRefurbished: isRefurb };
        newItems = [...items, productObj];
      }

      // 1. Instant realtime local state update
      setIds(newIds);
      setItems(newItems);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: newIds, items: newItems })).catch(() => {});

      // 2. Background sync with backend
      try {
        let resolvedVariantId: string | undefined = undefined;
        if (typeof extraOrProduct === 'string') {
          resolvedVariantId = extraOrProduct;
        } else {
          const foundVid =
            resolveId(extraOrProduct) ||
            resolveId(incomingProduct?.variantId) ||
            resolveId(incomingProduct?.defaultVariantId) ||
            resolveId(incomingProduct?.variants?.[0]);
          if (foundVid) resolvedVariantId = foundVid;
        }

        if (isRefurb) {
          if (currentlySaved) {
            // User is removing item: check backend wishlist for any entries with this productId
            const refurbList = await getRefurbishedWishlist().catch(() => []);
            const matchingBackend = refurbList.filter((it: any) => {
              const pId = resolveId(it.productId) || resolveId(it.product);
              return pId === strId;
            });

            if (matchingBackend.length > 0) {
              // Remove each matching entry to clean out any duplicates in DB
              for (const match of matchingBackend) {
                const vId = resolveId(match.variantId) || resolvedVariantId;
                await toggleRefurbishedWishlist(strId, vId || undefined, incomingProduct).catch(() => {});
              }
            } else {
              // Normal toggle remove
              await toggleRefurbishedWishlist(strId, resolvedVariantId, incomingProduct);
            }
          } else {
            // User is adding item
            await toggleRefurbishedWishlist(strId, resolvedVariantId, incomingProduct);
          }
        } else {
          // Standard marketplace product
          await toggleWishlistApi(strId, resolvedVariantId);
        }

        await loadWishlist();
        return !currentlySaved;
      } catch (err) {
        if (__DEV__) console.warn('Wishlist toggle API sync fallback:', err);
        return !currentlySaved;
      }
    },
    [ids, items, loadWishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        ids,
        items,
        count: ids.length,
        loading,
        isSaved,
        toggle,
        refreshWishlist: loadWishlist,
      }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) {
    return {
      ids: [],
      items: [],
      count: 0,
      loading: false,
      isSaved: () => false,
      toggle: async () => false,
      refreshWishlist: async () => {},
    };
  }
  return value;
}

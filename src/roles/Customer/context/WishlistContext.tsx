import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertModal from '@/components/AlertModal';
import { normalizeApiError } from '@/services/apiError';
import { getWishlistApi, mapBackendWishlistItem, toggleWishlistApi } from '../features/Product/services/ecomApi';
import {
  getRefurbishedWishlist,
  toggleRefurbishedWishlist,
} from '@/features/Refurbished/services/refurbishedApi';
import { demoProductPhoto } from '@/assets/images';
import { useTranslation } from 'react-i18next';

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
    title: p.title || p.name || '',
    brand: typeof p.brandId === 'object' ? p.brandId?.name : (p.brand || ''),
    category: typeof p.categoryId === 'object' ? p.categoryId?.name : (p.category || ''),
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
  // true when the lists were loaded; false when a request failed (the current items are kept)
  refreshWishlist: () => Promise<boolean>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Always holds the latest list so quick taps on different products do not use stale state
  const itemsRef = useRef<any[]>([]);
  // Products with a toggle request running (web: loadingIds)
  const inFlightRef = useRef<Set<string>>(new Set());

  const commit = useCallback((nextItems: any[]) => {
    // Strictly one entry per unique product ID
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const item of nextItems) {
      const pId = String(item?.id || item?._id || item?.productId || '');
      if (pId && !seen.has(pId)) {
        seen.add(pId);
        unique.push(item);
      }
    }
    const nextIds = Array.from(seen);
    itemsRef.current = unique;
    setItems(unique);
    setIds(nextIds);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: nextIds, items: unique })).catch(() => {});
  }, []);

  // Cache first, then the backend (standard + refurbished, like the Next.js layout).
  // Each list is replaced only when its own request worked: a failed request never wipes the wishlist.
  const loadWishlist = useCallback(async (): Promise<boolean> => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached && itemsRef.current.length === 0) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.items)) {
          itemsRef.current = parsed.items;
          setItems(parsed.items);
        }
        if (Array.isArray(parsed.ids)) setIds(parsed.ids);
      }
    } catch {}

    setLoading(true);
    const [standard, refurbished] = await Promise.allSettled([getWishlistApi(), getRefurbishedWishlist()]);
    setLoading(false);

    const current = itemsRef.current;
    const standardItems =
      standard.status === 'fulfilled' ? standard.value.items : current.filter(it => !it?.isRefurbished);
    const refurbItems =
      refurbished.status === 'fulfilled'
        ? refurbished.value.map(mapRefurbishedWishlistItem).filter(Boolean)
        : current.filter(it => it?.isRefurbished);

    if (standard.status === 'fulfilled' || refurbished.status === 'fulfilled') {
      commit([...standardItems, ...refurbItems]);
    }
    return standard.status === 'fulfilled' && refurbished.status === 'fulfilled';
  }, [commit]);

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
      const currentItems = itemsRef.current;
      const currentlySaved = currentItems.some(it => String(it.id || it._id || it.productId) === strId);

      // A toggle for this product is already running: ignore the tap (web: loadingIds)
      if (inFlightRef.current.has(strId)) return currentlySaved;

      const isRefurb = Boolean(
        incomingProduct?.isRefurbished ||
        incomingProduct?.condition === 'Refurbished' ||
        incomingProduct?.grade ||
        incomingProduct?.rawItem ||
        currentItems.some(it => String(it.id || it._id) === strId && it.isRefurbished)
      );

      let resolvedVariantId: string | undefined;
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

      const previousItem = currentItems.find(it => String(it.id || it._id || it.productId) === strId);

      inFlightRef.current.add(strId);

      // Instant local update (the web store also flips the heart before the request finishes)
      if (currentlySaved) {
        commit(currentItems.filter(it => String(it.id || it._id || it.productId) !== strId));
      } else {
        const productObj = incomingProduct
          ? (isRefurb
              ? mapRefurbishedWishlistItem({ productId: incomingProduct, variantId: resolvedVariantId })
              : mapBackendWishlistItem(incomingProduct))
          : { id: strId, _id: strId, title: '', isRefurbished: isRefurb };
        commit([...currentItems, productObj]);
      }

      try {
        if (isRefurb) {
          // Web: one POST /refurbished/wishlist/toggle, then the list from the response replaces the refurbished items
          const serverItems = await toggleRefurbishedWishlist(strId, resolvedVariantId);
          const refurbItems = serverItems.map(mapRefurbishedWishlistItem).filter(Boolean);
          commit([...itemsRef.current.filter(it => !it?.isRefurbished), ...refurbItems]);
        } else {
          await toggleWishlistApi(strId, resolvedVariantId);
        }
        return !currentlySaved;
      } catch (err) {
        // The request failed: flip the heart back and tell the customer why
        const latest = itemsRef.current;
        if (currentlySaved) {
          if (previousItem) commit([...latest, previousItem]);
        } else {
          commit(latest.filter(it => String(it.id || it._id || it.productId) !== strId));
        }
        setNotice(normalizeApiError(err).message);
        return currentlySaved;
      } finally {
        inFlightRef.current.delete(strId);
      }
    },
    [commit]
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
      <AlertModal
        visible={Boolean(notice)}
        type="error"
        title={t('glossary.wishlist')}
        message={notice || ''}
        onClose={() => setNotice(null)}
      />
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
      refreshWishlist: async () => false,
    };
  }
  return value;
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWishlistApi, mapBackendWishlistItem, toggleWishlistApi } from '../features/Product/services/ecomApi';

const STORAGE_KEY = 'customer_wishlist';

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

  // 1. Initial Load: from AsyncStorage cache first, then sync with backend
  const loadWishlist = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.ids)) setIds(parsed.ids);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
      }
    } catch {}

    // Fetch from backend
    try {
      setLoading(true);
      const res = await getWishlistApi();
      if (res && Array.isArray(res.items)) {
        setItems(res.items);
        const backendIds = res.items.map((it: any) => String(it.id || it._id));
        setIds(backendIds);
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ids: backendIds, items: res.items })
        );
      }
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
        rawId = productOrId._id || productOrId.id;
      } else {
        rawId = productOrId;
        if (typeof extraOrProduct === 'object' && extraOrProduct !== null) {
          incomingProduct = extraOrProduct;
        }
      }

      if (!rawId) return false;
      const strId = String(rawId);
      const currentlySaved = ids.includes(strId);

      // Optimistic state calculation
      let newIds: string[];
      let newItems: any[];

      if (currentlySaved) {
        newIds = ids.filter(i => i !== strId);
        newItems = items.filter(it => String(it.id || it._id) !== strId);
      } else {
        newIds = [...ids, strId];
        const productObj = incomingProduct
          ? mapBackendWishlistItem(incomingProduct)
          : { id: strId, _id: strId, title: 'Favorited Product' };
        newItems = [...items, productObj];
      }

      // 1. Instant realtime local state update
      setIds(newIds);
      setItems(newItems);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: newIds, items: newItems })).catch(() => {});

      // 2. Background sync with backend
      try {
        const variantId = typeof extraOrProduct === 'string' ? extraOrProduct : incomingProduct?.variantId;
        const res = await toggleWishlistApi(strId, variantId);
        if (res?.data && Array.isArray(res.data.items)) {
          const syncedItems = res.data.items.map(mapBackendWishlistItem).filter(Boolean);
          const syncedIds = syncedItems.map((it: any) => String(it.id || it._id));
          setItems(syncedItems);
          setIds(syncedIds);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: syncedIds, items: syncedItems })).catch(() => {});
        }
        return !currentlySaved;
      } catch (err) {
        if (__DEV__) console.warn('Wishlist toggle API sync fallback:', err);
        return !currentlySaved;
      }
    },
    [ids, items]
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

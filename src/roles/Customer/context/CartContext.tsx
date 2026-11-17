import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AlertModal from '@/components/AlertModal';
import {
  addToCartApi,
  getCartApi,
  MobileCartItem,
  removeCartItemApi,
  updateCartItemApi,
} from '../features/Product/services/ecomApi';
import {
  getRefurbishedCartData,
  updateRefurbishedCartItem,
  removeRefurbishedCartItem,
} from '@/features/Refurbished/services/refurbishedApi';
import { normalizeApiError } from '@/services/apiError';
import { demoProductPhoto } from '@/assets/images';
import { useTranslation } from 'react-i18next';

function mapRefurbishedCartItems(refurbItems: any[]): MobileCartItem[] {
  if (!Array.isArray(refurbItems)) return [];
  return refurbItems.map((it: any, index: number) => {
    const p = typeof it.productId === 'object' && it.productId ? it.productId : (it.product || {});
    const v = typeof it.variantId === 'object' && it.variantId ? it.variantId : {};
    const pId = String(p._id || p.id || it.productId || `refurb-${index}`);
    const vId = it.variantId ? String(v._id || v.id || it.variantId) : undefined;
    const price = Number(v.discountPrice || v.sellingPrice || v.price || p.price || 0);
    const rawImages = Array.isArray(p.images) ? p.images : [];
    const varImages = Array.isArray(v.images) ? v.images : [];
    const imgUrl = varImages[0]?.url || rawImages[0]?.url || p.image;
    const imageSource = imgUrl ? (typeof imgUrl === 'string' ? { uri: imgUrl } : imgUrl) : demoProductPhoto;

    return {
      id: String(it._id || `${pId}-${vId || 'def'}`),
      productId: pId,
      variantId: vId,
      variantLabel: v.title || (Array.isArray(v.attributes) ? v.attributes.map((a: any) => `${a.name}: ${a.value}`).join(' / ') : undefined),
      title: p.title || p.name || '',
      price,
      quantity: Number(it.quantity || 1),
      image: imageSource,
      product: p,
      isRefurbished: true,
    };
  });
}

interface CartContextType {
  cartItems: MobileCartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  // The server cart ids: the order request for a cart checkout needs them (like the web)
  standardCartId?: string;
  refurbishedCartId?: string;
  // true when the cart was loaded; false when the request failed (the old items are kept)
  refreshCart: (opts?: { silent?: boolean }) => Promise<boolean>;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (item: MobileCartItem, delta: number) => Promise<boolean>;
  removeItem: (item: MobileCartItem) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [standardItems, setStandardItems] = useState<MobileCartItem[]>([]);
  const [refurbItems, setRefurbItems] = useState<MobileCartItem[]>([]);
  const [standardCartId, setStandardCartId] = useState<string | undefined>(undefined);
  const [refurbishedCartId, setRefurbishedCartId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const cartItems = useMemo(() => [...standardItems, ...refurbItems], [standardItems, refurbItems]);
  const itemsRef = useRef<MobileCartItem[]>([]);
  itemsRef.current = cartItems;

  // Derived subtotal: always pure and updated synchronously with cartItems in 0ms
  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1),
      0
    );
  }, [cartItems]);

  // Track pending debounced updates per item so rapid clicks accumulate cleanly
  const pendingUpdatesRef = useRef<
    Record<
      string,
      {
        accumulatedDelta: number;
        targetQty: number;
        initialQty: number;
        timer: any;
        item: MobileCartItem;
      }
    >
  >({});

  // Count of distinct products/items in the cart (sum of standard + refurbished, matching Next.js)
  const cartCount = cartItems.length;

  const setItemsFor = useCallback(
    (item: MobileCartItem, fn: (list: MobileCartItem[]) => MobileCartItem[]) => {
      if (item.isRefurbished) setRefurbItems(fn);
      else setStandardItems(fn);
    },
    [],
  );

  const refreshCart = useCallback(async (opts?: { silent?: boolean }): Promise<boolean> => {
    if (!opts?.silent) setLoading(true);
    // Each store is replaced only when its own request worked: a failed request never empties the cart
    const [standard, refurbished] = await Promise.allSettled([getCartApi(), getRefurbishedCartData()]);
    const hasPending = Object.keys(pendingUpdatesRef.current).length > 0;

    if (standard.status === 'fulfilled') {
      setStandardCartId(standard.value.cartId);
      // Prevent a slow response from clobbering active optimistic clicks
      if (!hasPending) setStandardItems(standard.value.items);
    }
    if (refurbished.status === 'fulfilled') {
      setRefurbishedCartId(refurbished.value.cartId);
      if (!hasPending) setRefurbItems(mapRefurbishedCartItems(refurbished.value.items));
    }

    if (!opts?.silent) setLoading(false);
    const ok = standard.status === 'fulfilled' && refurbished.status === 'fulfilled';
    if (!ok && __DEV__) console.warn('[CartContext] cart refresh failed');
    return ok;
  }, []);

  useEffect(() => {
    refreshCart();

    return () => {
      // Cleanup all pending timers on unmount
      Object.values(pendingUpdatesRef.current).forEach(up => {
        if (up.timer) clearTimeout(up.timer);
      });
      pendingUpdatesRef.current = {};
    };
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId: string, variantId?: string, quantity = 1): Promise<boolean> => {
      await addToCartApi(productId, variantId, quantity);
      await refreshCart({ silent: true });
      return true;
    },
    [refreshCart]
  );

  const updateQuantity = useCallback(
    async (item: MobileCartItem, delta: number): Promise<boolean> => {
      const pending = pendingUpdatesRef.current[item.id];
      const initialQty = pending ? pending.initialQty : item.quantity;
      const accumulatedDelta = (pending ? pending.accumulatedDelta : 0) + delta;
      const targetQty = initialQty + accumulatedDelta;

      if (targetQty < 1) return false;

      // 1. Immediately update the item in local state - pure function, 0ms latency
      setItemsFor(item, current =>
        current.map(it => (it.id === item.id ? { ...it, quantity: targetQty } : it))
      );

      // 2. Clear previous debounce timer
      if (pending?.timer) {
        clearTimeout(pending.timer);
      }

      // 3. Debounce backend sync by 400ms to accumulate rapid clicks
      pendingUpdatesRef.current[item.id] = {
        accumulatedDelta,
        targetQty,
        initialQty,
        item,
        timer: setTimeout(async () => {
          const updateInfo = pendingUpdatesRef.current[item.id];
          delete pendingUpdatesRef.current[item.id];
          if (!updateInfo || updateInfo.accumulatedDelta === 0) return;

          try {
            if (updateInfo.item.isRefurbished) {
              await updateRefurbishedCartItem(
                updateInfo.item.productId,
                updateInfo.item.variantId,
                updateInfo.accumulatedDelta
              );
            } else {
              await updateCartItemApi(
                updateInfo.item.productId,
                updateInfo.item.variantId,
                updateInfo.targetQty,
                updateInfo.accumulatedDelta
              );
            }
            // Update confirmed by backend. Local state is already 100% accurate!
          } catch (err) {
            // Revert local state and tell the customer why (for example "Only 3 items left")
            setItemsFor(item, current =>
              current.map(it =>
                it.id === item.id ? { ...it, quantity: updateInfo.initialQty } : it
              )
            );
            setNotice(normalizeApiError(err).message);
          }
        }, 400),
      };

      return true;
    },
    [setItemsFor]
  );

  const removeItem = useCallback(
    async (item: MobileCartItem): Promise<boolean> => {
      // Clear pending timer if any
      if (pendingUpdatesRef.current[item.id]?.timer) {
        clearTimeout(pendingUpdatesRef.current[item.id].timer);
        delete pendingUpdatesRef.current[item.id];
      }

      const previous = itemsRef.current.find(it => it.id === item.id);
      setItemsFor(item, current => current.filter(it => it.id !== item.id));

      try {
        if (item.isRefurbished) {
          await removeRefurbishedCartItem(item.productId, item.variantId);
        } else {
          await removeCartItemApi(item.productId, item.variantId);
        }
        return true;
      } catch (err) {
        // Put back only this item (other quick changes stay as they are)
        if (previous) setItemsFor(item, current => (current.some(it => it.id === item.id) ? current : [...current, previous]));
        throw err;
      }
    },
    [setItemsFor]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        loading,
        standardCartId,
        refurbishedCartId,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
      }}>
      {children}
      <AlertModal
        visible={Boolean(notice)}
        type="error"
        title={t('glossary.cart')}
        message={notice || ''}
        onClose={() => setNotice(null)}
      />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const value = useContext(CartContext);
  if (!value) {
    // Every role that shows the shop must wrap it in a CartProvider; say so while developing
    if (__DEV__) console.warn('[useCart] used outside a CartProvider: the cart will not work');
    return {
      cartItems: [],
      cartCount: 0,
      subtotal: 0,
      loading: false,
      refreshCart: async () => false,
      addToCart: async () => {
        throw new Error('The cart is not available here.');
      },
      updateQuantity: async () => false,
      removeItem: async () => false,
    };
  }
  return value;
}

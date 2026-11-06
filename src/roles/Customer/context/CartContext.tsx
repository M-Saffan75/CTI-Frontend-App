import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addToCartApi,
  getCartApi,
  MobileCartItem,
  removeCartItemApi,
  updateCartItemApi,
} from '../features/Product/services/ecomApi';
import {
  getRefurbishedCart,
  updateRefurbishedCartItem,
  removeRefurbishedCartItem,
} from '@/features/Refurbished/services/refurbishedApi';
import { demoProductPhoto } from '@/assets/images';

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
      title: p.title || p.name || 'Refurbished Device',
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
  refreshCart: (opts?: { silent?: boolean }) => Promise<void>;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (item: MobileCartItem, delta: number) => Promise<boolean>;
  removeItem: (item: MobileCartItem) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<MobileCartItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  const refreshCart = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) {
        setLoading(true);
      }
      const [res, refurbRaw] = await Promise.all([
        getCartApi().catch(() => null),
        getRefurbishedCart().catch(() => []),
      ]);

      const standardItems = res && Array.isArray(res.items) ? res.items : [];
      const refurbItems = mapRefurbishedCartItems(refurbRaw);
      const allItems = [...standardItems, ...refurbItems];

      // Prevent slow network response from clobbering active optimistic clicks
      const hasPending = Object.keys(pendingUpdatesRef.current).length > 0;
      if (!hasPending) {
        setCartItems(allItems);
      }
    } catch {
      // Fallback
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
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
      try {
        await addToCartApi(productId, variantId, quantity);
        await refreshCart({ silent: true });
        return true;
      } catch (err) {
        if (__DEV__) console.warn('[CartContext] addToCart failed:', err);
        throw err;
      }
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

      // 1. Immediately update cartItems in local state - pure function, 0ms latency
      setCartItems(current =>
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
            // Revert local state on network error
            setCartItems(current =>
              current.map(it =>
                it.id === item.id ? { ...it, quantity: updateInfo.initialQty } : it
              )
            );
            console.warn('[CartContext] Failed to update quantity on server:', err);
          }
        }, 400),
      };

      return true;
    },
    []
  );

  const removeItem = useCallback(
    async (item: MobileCartItem): Promise<boolean> => {
      // Clear pending timer if any
      if (pendingUpdatesRef.current[item.id]?.timer) {
        clearTimeout(pendingUpdatesRef.current[item.id].timer);
        delete pendingUpdatesRef.current[item.id];
      }

      const previousItems = [...cartItems];
      setCartItems(current => current.filter(it => it.id !== item.id));

      try {
        if (item.isRefurbished) {
          await removeRefurbishedCartItem(item.productId, item.variantId);
        } else {
          await removeCartItemApi(item.productId, item.variantId);
        }
        return true;
      } catch (err) {
        setCartItems(previousItems);
        throw err;
      }
    },
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    return {
      cartItems: [],
      cartCount: 0,
      subtotal: 0,
      loading: false,
      refreshCart: async () => {},
      addToCart: async () => false,
      updateQuantity: async () => false,
      removeItem: async () => false,
    };
  }
  return value;
}

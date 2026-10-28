import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  addToCartApi,
  getCartApi,
  MobileCartItem,
  removeCartItemApi,
  updateCartItemApi,
} from '../features/Product/services/ecomApi';

interface CartContextType {
  cartItems: MobileCartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (item: MobileCartItem, delta: number) => Promise<boolean>;
  removeItem: (item: MobileCartItem) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<MobileCartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Count of distinct products/items in the cart (matches Next.js and physical rows)
  const cartCount = cartItems.length;

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCartApi();
      if (res && Array.isArray(res.items)) {
        setCartItems(res.items);
        setSubtotal(res.subtotal || 0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId: string, variantId?: string, quantity = 1): Promise<boolean> => {
      try {
        await addToCartApi(productId, variantId, quantity);
        await refreshCart();
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
      const newQty = item.quantity + delta;
      if (newQty < 1) return false;

      // Optimistic update
      const previousItems = [...cartItems];
      setCartItems(current =>
        current.map(it => (it.id === item.id ? { ...it, quantity: newQty } : it))
      );

      try {
        await updateCartItemApi(item.productId, item.variantId, newQty, delta);
        return true;
      } catch (err) {
        setCartItems(previousItems);
        throw err;
      }
    },
    [cartItems]
  );

  const removeItem = useCallback(
    async (item: MobileCartItem): Promise<boolean> => {
      const previousItems = [...cartItems];
      setCartItems(current => current.filter(it => it.id !== item.id));

      try {
        await removeCartItemApi(item.productId, item.variantId);
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

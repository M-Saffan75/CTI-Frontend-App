import { createContext, useCallback, useContext, useEffect, useState } from 'react';
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

  // Count of distinct products/items in the cart (sum of standard + refurbished, matching Next.js)
  const cartCount = cartItems.length;

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const [res, refurbRaw] = await Promise.all([
        getCartApi().catch(() => null),
        getRefurbishedCart().catch(() => []),
      ]);

      const standardItems = res && Array.isArray(res.items) ? res.items : [];
      const refurbItems = mapRefurbishedCartItems(refurbRaw);
      const allItems = [...standardItems, ...refurbItems];

      const standardSub = res?.subtotal || 0;
      const refurbSub = refurbItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

      setCartItems(allItems);
      setSubtotal(standardSub + refurbSub);
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
        if (item.isRefurbished) {
          await updateRefurbishedCartItem(item.productId, item.variantId, delta);
        } else {
          await updateCartItemApi(item.productId, item.variantId, newQty, delta);
        }
        await refreshCart();
        return true;
      } catch (err) {
        setCartItems(previousItems);
        throw err;
      }
    },
    [cartItems, refreshCart]
  );

  const removeItem = useCallback(
    async (item: MobileCartItem): Promise<boolean> => {
      const previousItems = [...cartItems];
      setCartItems(current => current.filter(it => it.id !== item.id));

      try {
        if (item.isRefurbished) {
          await removeRefurbishedCartItem(item.productId, item.variantId);
        } else {
          await removeCartItemApi(item.productId, item.variantId);
        }
        await refreshCart();
        return true;
      } catch (err) {
        setCartItems(previousItems);
        throw err;
      }
    },
    [cartItems, refreshCart]
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

import { createContext, useContext, useState } from 'react';

/**
 * Shared "hearted" product ids so the wishlist heart tapped on the product
 * grid, the detail screen, and the header badge all agree on what's saved.
 * In-memory only for now — add AsyncStorage here if it needs to survive a
 * restart.
 */
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);

  const isSaved = id => ids.includes(id);

  const toggle = id =>
    setIds(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));

  return (
    <WishlistContext.Provider value={{ ids, isSaved, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);

  if (!value) {
    throw new Error('useWishlist() was called outside <WishlistProvider>.');
  }

  return value;
}

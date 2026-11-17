// The price slider runs from 0 to PRICE_MAX (Turkish lira). PRICE_MAX as the upper value means "no upper limit".
export const PRICE_MIN = 0;
export const PRICE_MAX = 100000;

export interface ProductFilters {
  categoryIds: string[];
  categories: string[];
  color: string | null;
  storage: string | null;
  minPrice: number;
  maxPrice: number;
  minRating: number;
}

export const DEFAULT_FILTERS: ProductFilters = {
  categoryIds: [],
  categories: [],
  color: null,
  storage: null,
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  minRating: 0,
};

// The filter screen hands its result to the product list through this small bus, so no function
// has to travel inside the navigation params.
type Listener = (filters: ProductFilters) => void;
const listeners = new Set<Listener>();

export function applyProductFilters(filters: ProductFilters): void {
  listeners.forEach(listener => listener(filters));
}

export function subscribeProductFilters(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface RefurbishedProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewsCount: number;
  inStockCount: number;
  isVerified: boolean;
  tag: string;
  saveAmount: number;
  subtitle: string;
  description: string;
  image: any;
  gallery: any[];
  sku: string;
  totalVariants: number;
  condition: 'Refurbished' | 'Like New' | 'Good';
  grade: 'Superb' | 'Good' | 'Fair' | 'Best Value';
  specs: {
    buildAndMaterials: string;
    displayAndVisuals: string;
    performance: string;
    cameraSystem: string;
    batteryAndConnectivity: string;
  };
  rawId?: string;
  slug?: string;
  isRefurbished?: boolean;
  defaultVariantId?: string;
  variants?: any[];
  raw?: any;
}

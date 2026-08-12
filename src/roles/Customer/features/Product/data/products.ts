/**
 * Demo product data. When the API arrives, replace this file with the fetch
 * and keep the same shape — the screens read these fields and nothing else.
 */

import { demoProductPhoto } from '@/assets/images';

const personPhoto = seed => `https://picsum.photos/seed/${seed}/300/300`;

export const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports'];
export const COLORS = ['#000000', '#448AFF', '#EE454D', '#C7C7C7', '#193CB8', '#FFC300'];
export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB'];

const SELLER = {
  name: 'See@buy',
  location: 'New Karachi, unit no 7',
  avatar: personPhoto('cti-seller'),
};

const SPECS = {
  brand: 'Samsung',
  sku: 'SKU-ELEC-PC38-1782913028-V1',
  category: 'Electronics',
  totalVariants: 4,
  totalStock: 31,
  priceRange: '$460 - $520',
  warranty: '1 year',
};

const VARIANTS = [
  { id: 'v1', label: 'Default Variant', price: 495, verified: true, stockLeft: 9, image: demoProductPhoto },
  { id: 'v2', label: 'Default Variant', price: 495, verified: true, stockLeft: 4, image: demoProductPhoto },
  { id: 'v3', label: 'Pro Variant', price: 520, verified: true, stockLeft: 6, image: demoProductPhoto },
  { id: 'v4', label: 'Lite Variant', price: 460, verified: false, stockLeft: 12, image: demoProductPhoto },
];

const REVIEW_BREAKDOWN = [
  { stars: 5, percent: 0 },
  { stars: 4, percent: 0 },
  { stars: 3, percent: 0 },
  { stars: 2, percent: 0 },
  { stars: 1, percent: 0 },
];

const SAMPLE_PRODUCT = {
  brand: 'Grey-Incolls',
  title: 'New Products Testing',
  description:
    'Comfortable and stylish slim-fit design made from premium-quality materials, built to last and easy to use every day.',
  price: 495,
  originalPrice: 550,
  discountPercent: 10,
  inStock: true,
  rating: 0,
  reviewCount: 0,
  category: 'Electronics',
  colors: COLORS,
  storage: '128GB',
  image: demoProductPhoto,
  images: [demoProductPhoto, demoProductPhoto, demoProductPhoto],
  seller: SELLER,
  specs: SPECS,
  variants: VARIANTS,
  reviewBreakdown: REVIEW_BREAKDOWN,
};

export const PRODUCTS = Array.from({ length: 8 }).map((_, index) => ({
  id: `p${index + 1}`,
  ...SAMPLE_PRODUCT,
}));

export const getProductById = id => PRODUCTS.find(product => product.id === id);

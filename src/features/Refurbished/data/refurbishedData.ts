
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

export const REFURBISHED_CATEGORIES = [
  { id: 'all', name: 'All Types' },
  { id: 'phone', name: 'Sell Phone', figmaName: 'Sell Phone' },
  { id: 'laptop', name: 'Laptop', figmaName: 'Labtop' },
  { id: 'speaker', name: 'Speaker', figmaName: 'Speaker' },
  { id: 'gaming', name: 'Gaming Console', figmaName: 'Gaming Console' },
  { id: 'camera', name: 'Cameras & Lenses', figmaName: 'Cameras & Lenses' },
  { id: 'watch', name: 'Smart watches', figmaName: 'Smart watches' },
  { id: 'tablet', name: 'Tablets', figmaName: 'Tablets' },
  { id: 'earbuds', name: 'Earbuds', figmaName: 'Earbuds' },
  { id: 'ac', name: 'Air Conditioner (AC)', figmaName: 'Air Conditioner (AC)' },
];

export const REFURBISHED_BRANDS = [
  'Apple',
  'Hp',
  'Haier',
  'Audionic',
  'Samsung',
  'Huawei',
  'Canon',
  'Sony',
  'Sonos',
];

export const GRADE_EXPLANATIONS = {
  Superb: {
    title: 'Superb',
    overall: 'No functional defects',
    screenGlass: 'Minimal scratches only visible when the screen is off.',
    display: 'Bright sharp panel with no dead pixels or burn-in.',
    body: 'Light cosmetic wear only, with clean edges and camera housing.',
  },
  Good: {
    title: 'Good',
    overall: 'Fully functional, thoroughly tested',
    screenGlass: 'Slight micro-scratches that disappear when screen is powered on.',
    display: 'Flawless vibrant panel with accurate touch response.',
    body: 'Minor shallow scuffs on bezel or back glass, no deep cracks or dents.',
  },
  Fair: {
    title: 'Fair',
    overall: '100% operational hardware at best price',
    screenGlass: 'Moderate surface scratches, touch digitizer fully responsive.',
    display: 'Normal brightness, no lines or screen bleeding.',
    body: 'Visible cosmetic wear on edges or casing, casing structural integrity intact.',
  },
  'Best Value': {
    title: 'Best Value',
    overall: 'Maximum savings with complete certification',
    screenGlass: 'Visible hairline scratches, zero cracks or chipping.',
    display: 'Crisp display, fully tested touch accuracy across all points.',
    body: 'Noticeable signs of handling, backed by full CTI 1-year warranty.',
  },
};

export const REFURBISHED_TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Akshy Rao',
    feedback:
      'I was not sure before buying a used phone online. But I took the chance as they have return policy and verified certification. The iPhone condition was genuinely superb!',
  },
  {
    id: 't-2',
    name: 'Sophie Turner',
    feedback:
      'Great platform with clear product details and fair pricing. The buying experience felt simple and trustworthy. Delivery was fast and doorstep pickup was seamless.',
  },
  {
    id: 't-3',
    name: 'James Walker',
    feedback:
      'The whole process was smooth and easy. I found the right device quickly, and everything was exactly as described. Battery health was 98% on my refurbished laptop!',
  },
];

export const WHY_SELL_WITH_US = [
  {
    id: 'w-1',
    title: 'Best Prices',
    description: 'Objective AI-based pricing engine ensuring top market value.',
    iconType: 'tag',
  },
  {
    id: 'w-2',
    title: 'Instant Payment',
    description: 'Instant Money Transfer in your preferred mode at time of pick up or store drop off.',
    iconType: 'card',
  },
  {
    id: 'w-3',
    title: 'Simple & Convenient',
    description: 'Check price, schedule pickup & get paid in under 24 hours.',
    iconType: 'sparkle',
  },
  {
    id: 'w-4',
    title: 'Free Doorstep Pickup',
    description: 'No fees for pickup across 1500+ cities with verified field agents.',
    iconType: 'truck',
  },
  {
    id: 'w-5',
    title: 'Factory Grade Data Wipe',
    description: '100% Safe and Data Security Guaranteed with automated wipe certificates.',
    iconType: 'shield',
  },
  {
    id: 'w-6',
    title: 'Valid Purchase Invoice',
    description: 'Genuine Bill of Sale and electronic invoice generated on spot.',
    iconType: 'invoice',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '1',
    title: '1. Check Price',
    description:
      'Tell us your device brand, model, and physical condition. Our system calculates maximum value instantly.',
  },
  {
    step: '2',
    title: '2. Schedule Pickup',
    description:
      'Book a free pickup from your home or work at a time slot that best suits your convenience.',
  },
  {
    step: '3',
    title: '3. Get Paid',
    description:
      'Receive your payment instantly as soon as our agent inspects your device right at your doorstep.',
  },
];

export const SELLER_DEVICE_MODELS: Record<string, string[]> = {
  Apple: [
    '15 pro max',
    '15 pro',
    '14 pro max',
    '14 pro',
    '13 pro max',
    '13 pro',
    '12 pro max',
    '12 pro',
    'iPhone 11',
    'iPhone XR',
  ],
  Samsung: [
    'Galaxy S24 Ultra',
    'Galaxy S23 Ultra',
    'Galaxy S22 Ultra',
    'Galaxy Z Fold 5',
    'Galaxy Z Flip 5',
    'Galaxy Tab S9',
  ],
  Google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7a', 'Pixel 6 Pro'],
  Xiaomi: ['13 Pro', '12 Pro', 'Redmi Note 13 Pro', 'Redmi Note 12'],
  OnePlus: ['OnePlus 12', 'OnePlus 11', 'OnePlus 10 Pro', 'OnePlus Nord 3'],
};

export const STORAGE_VARIANTS = ['128 GB', '256 GB', '512 GB', '1 TB'];

export interface ConditionQuestion {
  id: number;
  question: string;
  options: {
    id: string;
    label: string;
    description?: string;
  }[];
}

export const CONDITION_QUESTIONS: ConditionQuestion[] = [
  {
    id: 1,
    question: 'What is the Screen Condition',
    options: [
      { id: 'opt-1', label: 'Flawless', description: 'Zero scratches, dents, or marks' },
      { id: 'opt-2', label: 'Good / Minor Scratches', description: 'Minor scratches visible only in bright light' },
      { id: 'opt-3', label: 'Cracked or Broken', description: 'Noticeable screen glass damage or cracks' },
    ],
  },
  {
    id: 2,
    question: "Is your device's touch screen working properly?",
    options: [
      { id: 'opt-4', label: 'Yes', description: 'Smooth, responsive, zero dead areas' },
      { id: 'opt-5', label: 'No', description: 'Has touch lag, ghost touch, or unresponsive zones' },
    ],
  },
  {
    id: 3,
    question: "Is your phone's screen original?",
    options: [
      { id: 'opt-6', label: 'Yes', description: 'Original factory installed display' },
      { id: 'opt-7', label: 'No', description: 'Screen was previously replaced' },
    ],
  },
  {
    id: 4,
    question: 'Body & Housing Physical Condition',
    options: [
      { id: 'opt-8', label: 'Clean & Pristine', description: 'No dents, scratches or discolouration' },
      { id: 'opt-9', label: 'Light Scuffs', description: 'Normal everyday wear around charging port' },
      { id: 'opt-10', label: 'Bent or Dented', description: 'Casing has noticeable drop impacts' },
    ],
  },
];
